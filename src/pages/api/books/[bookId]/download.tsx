import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { Document, Page, View, Text, Svg, Path, Font, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { assertBookEntitled } from "@/lib/authz";
import { pdfColors, logoIconPath, logoViewBox, pdfFooterText, pdfFontFamily, pdfFontPaths } from "@/lib/pdf-theme";

// This lives under pages/api rather than app/api deliberately: App Router
// route handlers compile as part of Next's "react-server" module graph,
// which resolves a different internal "react" build than the one used to
// construct these JSX elements vs. the one @react-pdf/renderer's own
// reconciler consumes - two different "react" instances producing/reading
// elements that don't recognize each other, failing with a cryptic
// "React error #31" (invalid element shape). Tried `export const runtime =
// "nodejs"` and `serverExternalPackages` first; neither escapes the
// react-server condition for code inside app/. Pages Router API routes
// don't apply that condition, so react-pdf works normally here. (Next.js
// explicitly supports app/ and pages/ coexisting - this is the documented
// workaround for this library in App Router projects.)

Font.register({
  family: pdfFontFamily,
  fonts: [
    { src: path.join(process.cwd(), pdfFontPaths.regular), fontWeight: "normal" },
    { src: path.join(process.cwd(), pdfFontPaths.bold), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: pdfFontFamily,
    fontSize: 10,
    color: pdfColors.foreground,
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 9, fontWeight: "bold", color: pdfColors.primary },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
    paddingTop: 8,
    fontSize: 8,
    color: pdfColors.mutedForeground,
  },
  coverTitle: { fontSize: 26, fontWeight: "bold", color: pdfColors.primary, textAlign: "center" },
  coverAuthor: { fontSize: 13, color: pdfColors.mutedForeground, marginTop: 8, textAlign: "center" },
  chapterHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: pdfColors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  chapterSubtitle: { fontSize: 10, color: pdfColors.mutedForeground, marginBottom: 14 },
  phraseBlock: {
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 4,
  },
  phraseText: { fontSize: 12, fontWeight: "bold" },
  pronunciationText: { fontSize: 9.5, color: pdfColors.mutedForeground, marginTop: 3 },
  translationText: { fontSize: 11, color: pdfColors.primary, marginTop: 4 },
  explanationText: { fontSize: 9.5, color: pdfColors.foreground, marginTop: 6, lineHeight: 1.4 },
  explanationSiText: { fontSize: 9.5, color: pdfColors.foreground, marginTop: 6, lineHeight: 1.4 },
});

function BrandMark({ size, color }: { size: number; color: string }) {
  const height = size * (46 / 95);
  return (
    <Svg width={size} height={height} viewBox={logoViewBox}>
      <Path d={logoIconPath} fill={color} />
    </Svg>
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // next-auth's universal auth() helper pulls in an App-Router-only "next/server"
  // import path when called outside the app/ module graph, so it can't be used
  // from this Pages Router route either. getToken() reads/verifies the same JWT
  // session cookie directly and works from a plain req object.
  const token = await getToken({
    req: { headers: { cookie: req.headers.cookie ?? "" } },
    secret: process.env.NEXTAUTH_SECRET,
    // Auth.js prefixes its session cookie with "__Secure-" whenever the
    // request is served over https (production on Vercel). getToken()
    // defaults secureCookie to false, so without this it looks up the
    // wrong cookie name in production and silently returns null.
    secureCookie: process.env.NODE_ENV === "production",
  });
  const userId = token?.id as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const bookId = req.query.bookId as string;
  const book = await assertBookEntitled(userId, bookId);
  if (!book) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const chapters = await db.bookChapter.findMany({
    where: { bookId },
    orderBy: { order: "asc" },
    include: { phrases: { where: { isReviewed: true }, orderBy: { order: "asc" } } },
  });

  const doc = (
    <Document title={book.title} author={book.author ?? "Study Pal"}>
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <BrandMark size={60} color={pdfColors.gold} />
          <Text style={styles.coverTitle}>{book.title}</Text>
          {book.author && <Text style={styles.coverAuthor}>{book.author}</Text>}
        </View>
      </Page>

      {chapters.map((chapter) => (
        <Page key={chapter.id} size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <BrandMark size={12} color={pdfColors.primary} />
            <Text style={styles.headerTitle}>{book.title}</Text>
          </View>
          <View style={styles.footer} fixed>
            <Text>{pdfFooterText}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>

          <Text style={styles.chapterHeading}>{chapter.title}</Text>
          {chapter.subtitle && <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>}

          {chapter.phrases.map((phrase) => (
            <View key={phrase.id} style={styles.phraseBlock} wrap={false}>
              <Text style={styles.phraseText}>{phrase.phrase}</Text>
              {phrase.pronunciationSi && <Text style={styles.pronunciationText}>{phrase.pronunciationSi}</Text>}
              {phrase.translationSi && <Text style={styles.translationText}>{phrase.translationSi}</Text>}
              <Text style={styles.explanationText}>{phrase.explanation}</Text>
              {phrase.explanationSi && <Text style={styles.explanationSiText}>{phrase.explanationSi}</Text>}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  const filename = book.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "book";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  res.status(200).send(buffer);
}

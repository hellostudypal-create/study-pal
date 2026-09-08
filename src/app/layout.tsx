import type { Metadata, Viewport } from "next";
import { Poppins, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getLocale } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
});
const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Study Pal",
  description: "Vocabulary and exam prep, quizzed the smart way.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#591F82",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          poppins.variable,
          notoSinhala.variable,
          locale === "si" ? "font-sinhala" : "font-sans",
          "antialiased"
        )}
      >
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}

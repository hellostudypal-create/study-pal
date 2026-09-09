// Brand constants for generated PDFs, mirrored from the light-theme CSS
// custom properties in src/app/globals.css (PDF libraries can't read CSS
// variables, so these are duplicated as literal hex values - update both
// places together if the brand palette changes).
export const pdfColors = {
  primary: "#58238b",
  brand2: "#9c35b6",
  gold: "#fab005",
  goldInk: "#8f5614",
  foreground: "#09090b",
  mutedForeground: "#6b6470",
  border: "#e4dfec",
  background: "#ffffff",
} as const;

// Same path data as the LogoMark SVG (src/components/brand/Logo.tsx) - kept
// in sync manually since the PDF renderer needs its own Svg/Path primitives
// rather than the web <svg> element.
export const logoIconPath =
  "M87.787 36.736a20.05 20.05 0 0 0-14.263-5.912 20.05 20.05 0 0 0-14.264 5.912L36.034 59.962a12.59 12.59 0 0 1-8.962 3.707 12.55 12.55 0 0 1-8.952-3.717A12.53 12.53 0 0 1 14.404 51c0-3.378 1.314-6.56 3.716-8.962a12.58 12.58 0 0 1 8.952-3.707 12.58 12.58 0 0 1 8.962 3.707l5.463 5.464 4.961-.46.342-4.842-5.464-5.464a20.05 20.05 0 0 0-14.264-5.912 20.05 20.05 0 0 0-14.264 5.912C8.998 40.546 6.896 45.613 6.896 51s2.102 10.452 5.912 14.265a20.05 20.05 0 0 0 14.264 5.911 20.05 20.05 0 0 0 14.264-5.911l23.226-23.227a12.59 12.59 0 0 1 8.963-3.707c3.378 0 6.56 1.313 8.952 3.707 4.944 4.945 4.944 12.979 0 17.924a12.58 12.58 0 0 1-8.952 3.707 12.59 12.59 0 0 1-8.963-3.707L58.301 53.7l-.342 4.842-4.961.46-.045-.045v.001l6.308 6.307a20.05 20.05 0 0 0 14.264 5.911 20.05 20.05 0 0 0 14.263-5.911c7.862-7.866 7.862-20.665-.001-28.529";
export const logoViewBox = "3 28 95 46";

export const pdfFooterText = "Study Pal · Message us on WhatsApp for support: wa.me/94700000000";

// Fonts: Noto Sans Sinhala, downloaded once into public/fonts/ (SIL Open
// Font License) so Sinhala text shapes correctly - the default PDF fonts
// (Helvetica etc.) have no Sinhala glyphs at all and would render blank.
export const pdfFontFamily = "NotoSansSinhala";
export const pdfFontPaths = {
  regular: "public/fonts/NotoSansSinhala-Regular.ttf",
  bold: "public/fonts/NotoSansSinhala-Bold.ttf",
} as const;

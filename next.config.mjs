/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: import.meta.dirname,
  // pdfkit (a transitive dep of @react-pdf/renderer, used by
  // src/pages/api/books/[bookId]/download.tsx) resolves its built-in
  // standard fonts via a package.json "imports" subpath
  // (e.g. "#standard-fonts/Helvetica"). Vercel's build-time file tracer
  // doesn't follow that indirection, so those .cjs font files get dropped
  // from the serverless bundle and the route 500s in production with
  // "Cannot find module '.../pdfkit/js/standard-fonts/Helvetica.cjs'".
  // Force them (and the legacy AFM metrics under js/data) into the trace.
  outputFileTracingIncludes: {
    "/api/books/[bookId]/download": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
};

export default nextConfig;

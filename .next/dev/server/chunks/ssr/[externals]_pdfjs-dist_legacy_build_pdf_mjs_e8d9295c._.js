module.exports = [
"[externals]/pdfjs-dist/legacy/build/pdf.mjs [external] (pdfjs-dist/legacy/build/pdf.mjs, esm_import, [project]/node_modules/pdfjs-dist, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[externals]_pdfjs-dist_legacy_build_pdf_mjs_c8ec4eb7._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/pdfjs-dist/legacy/build/pdf.mjs [external] (pdfjs-dist/legacy/build/pdf.mjs, esm_import, [project]/node_modules/pdfjs-dist)");
    });
});
}),
];
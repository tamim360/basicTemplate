import * as pdfjs from "pdfjs-dist";

// Using CDN version
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// OR for local build (if you've installed pdfjs-dist)
// pdfjs.GlobalWorkerOptions.workerSrc =
//   new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export default pdfjs;

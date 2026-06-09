// Minimal typing for pdf-parse's inner implementation module. We import the
// inner path (not the package entry) to skip pdf-parse's debug harness, which
// reads a bundled test PDF when `module.parent` is falsy.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }
  function pdfParse(data: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;
  export = pdfParse;
}

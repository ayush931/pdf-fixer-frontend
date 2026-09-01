/// <reference types="vite/client" />

declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort?: any;
  };
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<any>;
    getPageIndex(ref: any): Promise<number>;
    getOutline(): Promise<any[] | null>;
    getMetadata(): Promise<any>;
    destroy(): Promise<void>;
    [key: string]: any;
  }
  export function getDocument(src: any): {
    promise: Promise<PDFDocumentProxy>;
    [key: string]: any;
  };
  const _default: any;
  export default _default;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "prismjs/components/prism-core" {
  export const languages: {
    [key: string]: any;
    extend: (id: string, redef: any) => void;
    insertBefore: (inside: string, before: string, insert: any) => void;
  };

  export function highlight(
    code: string,
    grammar: any,
    language?: string
  ): string;
}

declare module "prismjs/components/prism-clike" {}
declare module "prismjs/components/prism-rust" {}

declare module 'dotenv' {
    export function config(options?: {
      path?: string;
      encoding?: string;
      debug?: boolean;
      override?: boolean;
    }): void;
    
    export function parse(src: string | Buffer): { [key: string]: string };
  }
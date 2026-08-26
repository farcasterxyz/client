/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RELEASE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

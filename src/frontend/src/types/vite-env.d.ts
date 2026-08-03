/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// `process.env.NODE_ENV` é substituído pelo Vite no build e fornecido pelo
// Jest nos testes; declaração mínima para não depender de @types/node.
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

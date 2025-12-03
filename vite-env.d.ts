/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: 599751110918;
  readonly VITE_FIREBASE_AUTH_DOMAIN: 599751110918;
  readonly VITE_FIREBASE_PROJECT_ID: 599751110918;
  readonly VITE_FIREBASE_STORAGE_BUCKET: 599751110918;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: 599751110918;
  readonly VITE_FIREBASE_APP_ID: 599751110918;
  readonly VITE_API_KEY?: 599751110918; // Optional Gemini Key
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
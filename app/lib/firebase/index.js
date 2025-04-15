import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Depurar as variáveis de ambiente
console.log("Variáveis de ambiente Firebase:", {
  apiKey: process.env.FIREBASE_API_KEY ? "Definido" : "Não definido",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET ? "Definido" : "Não definido",
});

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Verificar se campos essenciais estão presentes
if (!firebaseConfig.apiKey || !firebaseConfig.storageBucket) {
  console.error("Configuração do Firebase incompleta!", firebaseConfig);
}

// Inicializar o Firebase com tratamento de erro
let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  console.log("Firebase inicializado com sucesso. Storage disponível:", !!storage);
} catch (error) {
  console.error("Erro ao inicializar o Firebase:", error);
  // Criar um stub para evitar erros de undefined
  storage = null;
}

export { app, storage };
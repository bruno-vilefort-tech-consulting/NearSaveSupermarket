import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug do React
console.log('🔧 Verificando React no main.tsx:', {
  React: !!React,
  useState: !!React.useState,
  useEffect: !!React.useEffect,
  useRef: !!React.useRef,
  useContext: !!React.useContext,
  createContext: !!React.createContext
});

// Verificação de segurança
if (!React || !React.useState || !React.useRef || !React.useContext) {
  console.error('❌ React não foi carregado corretamente!');
  throw new Error('React hooks não estão disponíveis');
}

const root = document.getElementById("root");
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(React.createElement(App));

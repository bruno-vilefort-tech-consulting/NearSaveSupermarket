import * as React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure React is available globally
(window as any).React = React;

createRoot(document.getElementById("root")!).render(<App />);

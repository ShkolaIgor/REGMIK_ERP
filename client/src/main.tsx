import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Глобальний обробник unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[SILENCED] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Глобальний обробник помилок
window.addEventListener('error', (event) => {
  console.warn('[SILENCED] Global error:', event.error);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);

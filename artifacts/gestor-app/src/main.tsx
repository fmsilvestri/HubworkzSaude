import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Aplicar tema antes do render para evitar flash
const savedTheme = localStorage.getItem("gestor-theme") ?? "dark";
document.documentElement.classList.add(savedTheme === "light" ? "light" : "dark");

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Toaster } from "sonner";
import "./index.css";
<Toaster richColors position="top-right" />
createRoot(document.getElementById("root")!).render(<App />);

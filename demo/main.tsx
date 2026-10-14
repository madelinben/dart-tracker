import { createRoot } from "react-dom/client";
import { DartsApp } from "../src";
import "./demo.css";

createRoot(document.getElementById("root") as HTMLElement).render(<DartsApp />);

import React from "react";
import { createRoot } from "react-dom/client";
import ApiDocs from "../pages/ApiDocs.jsx";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<ApiDocs />);



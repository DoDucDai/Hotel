import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./components/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
 <ToastProvider>
 <BrowserRouter>
 <App />
 </BrowserRouter>
 </ToastProvider>
);

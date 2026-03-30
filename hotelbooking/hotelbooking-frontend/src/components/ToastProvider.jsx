import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

let toastSeq = 0;

function typeLabel(type) {
 if (type === "success") {
 return "Thanh cong";
 }

 if (type === "error") {
 return "Loi";
 }

 if (type === "warning") {
 return "Can luu y";
 }

 return "Thong bao";
}

export function ToastProvider({ children }) {
 const [toasts, setToasts] = useState([]);

 const removeToast = useCallback((id) => {
 setToasts((prev) => prev.filter((item) => item.id !== id));
 }, []);

 const show = useCallback(
 ({ message, title, type = "info", duration = 3200 }) => {
 const id = `toast-${Date.now()}-${toastSeq++}`;
 const nextToast = {
 id,
 title: title || typeLabel(type),
 message: message || "",
 type,
 };

 setToasts((prev) => [...prev, nextToast]);

 window.setTimeout(() => {
 removeToast(id);
 }, duration);

 return id;
 },
 [removeToast]
 );

 const api = useMemo(
 () => ({
 show,
 success: (message, title) => show({ type: "success", title, message }),
 error: (message, title) => show({ type: "error", title, message }),
 warning: (message, title) => show({ type: "warning", title, message }),
 info: (message, title) => show({ type: "info", title, message }),
 dismiss: removeToast,
 }),
 [removeToast, show]
 );

 return (
 <ToastContext.Provider value={api}>
 {children}

 <div className="toast-viewport" aria-live="polite" aria-atomic="true">
 {toasts.map((toast) => (
 <article key={toast.id} className={`toast-item ${toast.type}`}>
 <div className="toast-content">
 <strong>{toast.title}</strong>
 <p>{toast.message}</p>
 </div>
 <button
 type="button"
 className="toast-close"
 onClick={() => removeToast(toast.id)}
 aria-label="Dang thong bao"
 >
 x
 </button>
 </article>
 ))}
 </div>
 </ToastContext.Provider>
 );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
 const context = useContext(ToastContext);
 if (!context) {
 throw new Error("useToast must be used within ToastProvider");
 }
 return context;
}


import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDialog.css";

function ConfirmDialog({
 open,
 title,
 description,
 confirmLabel = "Xac nhan",
 cancelLabel = "Huy",
 tag = "Xac nhan thao tac",
 tone = "danger",
 loading = false,
 onClose,
 onConfirm,
}) {
 useEffect(() => {
 if (!open) {
 return undefined;
 }

 const onKeyDown = (event) => {
 if (event.key === "Escape" && !loading) {
 onClose?.();
 }
 };

 document.addEventListener("keydown", onKeyDown);
 return () => document.removeEventListener("keydown", onKeyDown);
 }, [loading, onClose, open]);

 if (!open || typeof document === "undefined") {
 return null;
 }

 return createPortal(
 <>
 <button
 type="button"
 className="confirm-dialog-backdrop"
 onClick={onClose}
 disabled={loading}
 aria-label="Dang popup xac nhan"
 />

 <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
 <article className="confirm-dialog-card">
 <p className="confirm-dialog-tag">{tag}</p>
 <h2 id="confirm-dialog-title">{title}</h2>
 <p className="confirm-dialog-description">{description}</p>

 <div className="confirm-dialog-actions">
 <button
 type="button"
 className="confirm-dialog-btn ghost"
 onClick={onClose}
 disabled={loading}
 >
 {cancelLabel}
 </button>

 <button
 type="button"
 className={`confirm-dialog-btn ${tone}`}
 onClick={onConfirm}
 disabled={loading}
 >
 {loading ? "Dang x? ly..." : confirmLabel}
 </button>
 </div>
 </article>
 </div>
 </>,
 document.body
 );
}

export default ConfirmDialog;


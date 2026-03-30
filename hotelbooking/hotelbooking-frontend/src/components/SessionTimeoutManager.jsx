import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "./ToastProvider";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

function clearAuthStorage() {
 localStorage.removeItem("accessToken");
 localStorage.removeItem("refreshToken");
 localStorage.removeItem("role");
}

export default function SessionTimeoutManager() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const timeoutRef = useRef(null);

 const stopTimer = useCallback(() => {
 if (timeoutRef.current) {
 clearTimeout(timeoutRef.current);
 timeoutRef.current = null;
 }
 }, []);

 const handleSessionExpired = useCallback(() => {
 const token = localStorage.getItem("accessToken");
 if (!token) {
 return;
 }

 clearAuthStorage();
 toast.warning("Phien dang nhap da het han do khong hoat dong trong 10 phut");

 navigate("/login", {
 replace: true,
 state: {
 from: location.pathname,
 redirectTo: location.pathname,
 },
 });
 }, [location.pathname, navigate, toast]);

 const resetTimer = useCallback(() => {
 const token = localStorage.getItem("accessToken");
 if (!token) {
 stopTimer();
 return;
 }

 stopTimer();
 timeoutRef.current = setTimeout(handleSessionExpired, INACTIVITY_LIMIT_MS);
 }, [handleSessionExpired, stopTimer]);

 useEffect(() => {
 resetTimer();
 }, [location.pathname, resetTimer]);

 useEffect(() => {
 ACTIVITY_EVENTS.forEach((eventName) => {
 window.addEventListener(eventName, resetTimer, { passive: true });
 });

 return () => {
 ACTIVITY_EVENTS.forEach((eventName) => {
 window.removeEventListener(eventName, resetTimer);
 });
 stopTimer();
 };
 }, [resetTimer, stopTimer]);

 return null;
}


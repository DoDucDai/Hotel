import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import {
 getMyAccount,
 updateMyEmail,
 updateMyProfile,
} from "../services/accountService";
import {
 createAdminCoupon,
 deleteAdminCoupon,
 getAdminDisputes,
 getAdminBookings,
 getAdminCoupons,
 getAdminDashboard,
 getAdminHotelsAll,
 getAdminLogs,
 getAdminRooms,
 getAdminUsers,
 updateAdminBookingStatus,
 updateAdminBookingPaymentStatus,
 updateAdminCoupon,
 updateAdminDisputeStatus,
 updateAdminHotelApproval,
} from "../services/adminService";
import { getMyHostRooms } from "../services/hostService";
import "./AdminDashboard.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
 style: "currency",
 currency: "VND",
 maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

const accountInitialState = {
 name: "",
 gender: "",
 dateOfBirth: "",
 citizenId: "",
};

const accountMetaInitialState = {
 id: "",
 role: "ADMIN",
 emailVerified: false,
 emailVerifiedAt: "",
};

const couponInitialState = {
 code: "",
 description: "",
 discountType: "PERCENT",
 discountValue: "",
 minOrderAmount: "0",
 expiresAt: "",
 active: true,
};

const paymentStatusOptions = [
 { value: "PENDING", label: "Cho thanh toan" },
 { value: "PAID", label: "Da thanh toan" },
 { value: "REFUNDED", label: "Da ho n tien" },
 { value: "FAILED", label: "Thet bai" },
];

const paymentStatusFilterOptions = [
 { value: "all", label: "Tat c? payment" },
 ...paymentStatusOptions,
];

const bookingStatusOptions = [
 { value: "CONFIRMED", label: "Da xac nhan" },
 { value: "CHECKED_IN", label: "Checked-in" },
 { value: "CHECKED_OUT", label: "Checked-out" },
 { value: "NO_SHOW", label: "No-show" },
 { value: "CANCELLED", label: "Da huy" },
];

const hotelApprovalOptions = [
 { value: "PENDING", label: "Cho duyat" },
 { value: "APPROVED", label: "Da duyet" },
 { value: "REJECTED", label: "Tu choi" },
];

const disputeStatusOptions = [
 { value: "OPEN", label: "Moi tao" },
 { value: "IN_REVIEW", label: "Dang x? ly" },
 { value: "RESOLVED", label: "Da giai quyet" },
 { value: "REJECTED", label: "Tu choi" },
];

const bookingStayStatusOptions = [
 { value: "all", label: "Tat c? trang thai o" },
 { value: "upcoming", label: "Sap ?en" },
 { value: "active", label: "Dang ?" },
 { value: "completed", label: "Hoan tat" },
 { value: "cancelled", label: "Da huy" },
];

const ADMIN_HOTELS_PER_PAGE = 8;

function normalizeHotels(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeRooms(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data?.content)) {
 return payload.data.content;
 }

 return [];
}

function normalizeBookings(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.content)) {
 return payload.content;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeUsers(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeCoupons(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeDisputes(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function normalizeLogs(payload) {
 if (Array.isArray(payload)) {
 return payload;
 }

 if (Array.isArray(payload.data)) {
 return payload.data;
 }

 return [];
}

function parseDate(value) {
 if (!value) {
 return null;
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return null;
 }

 date.setHours(0, 0, 0, 0);
 return date;
}

function formatDate(value) {
 const date = parseDate(value);
 if (!date) {
 return "-";
 }

 return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value) {
 if (!value) {
 return "-";
 }

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) {
 return "-";
 }

 return date.toLocaleString("vi-VN");
}

function bookingStayFilterValue(booking) {
 const meta = bookingStatusMeta(booking);

 if (meta.className === "pending") {
 return "upcoming";
 }

 if (meta.className === "success") {
 return "active";
 }

 if (meta.className === "danger") {
 return "cancelled";
 }

 return "completed";
}

function bookingMatchesDateRange(booking, dateFromValue, dateToValue) {
 const rawStart = parseDate(dateFromValue);
 const rawEnd = parseDate(dateToValue);

 if (!rawStart && !rawEnd) {
 return true;
 }

 let rangeStart = rawStart;
 let rangeEnd = rawEnd;

 if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
 rangeStart = rawEnd;
 rangeEnd = rawStart;
 }

 const checkIn = parseDate(booking?.checkInDate);
 const checkOut = parseDate(booking?.checkOutDate);
 if (!checkIn || !checkOut) {
 return false;
 }

 if (rangeStart && checkOut <= rangeStart) {
 return false;
 }

 if (rangeEnd) {
 const rangeEndExclusive = new Date(rangeEnd);
 rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);
 if (checkIn >= rangeEndExclusive) {
 return false;
 }
 }

 return true;
}

function bookingRevenueValue(booking) {
 return Number(booking?.finalPrice || booking?.totalPrice || 0);
}

function bookingStatusMeta(booking) {
 switch (booking?.status) {
 case "CANCELLED":
 return { label: "Da huy", className: "danger" };
 case "CHECKED_IN":
 return { label: "Dang ?", className: "success" };
 case "CHECKED_OUT":
 return { label: "Da tra phong", className: "neutral" };
 case "NO_SHOW":
 return { label: "No-show", className: "info" };
 case "CONFIRMED": {
 const checkIn = parseDate(booking?.checkInDate);
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 if (checkIn && today < checkIn) {
 return { label: "Sap den", className: "pending" };
 }

 return { label: "Da xac nhan", className: "pending" };
 }
 default:
 return { label: "Khong ro", className: "neutral" };
 }
}

function paymentStatusMeta(status) {
 switch (status) {
 case "PAID":
 return { label: "Da thanh toan", className: "success", kind: "paid" };
 case "PENDING":
 return { label: "Cho thanh toan", className: "pending", kind: "pending" };
 case "REFUNDED":
 return { label: "Da hoan tien", className: "info", kind: "refunded" };
 case "FAILED":
 return { label: "That bai", className: "danger", kind: "failed" };
 default:
 return { label: "Khong ro", className: "neutral", kind: "unknown" };
 }
}

function hotelApprovalMeta(status) {
 switch (status) {
 case "APPROVED":
 return { label: "Da duyet", className: "success" };
 case "REJECTED":
 return { label: "Tu choi", className: "danger" };
 default:
 return { label: "Cho duyat", className: "pending" };
 }
}

function disputeStatusMeta(status) {
 switch (status) {
 case "RESOLVED":
 return { label: "Da giai quyet", className: "success" };
 case "IN_REVIEW":
 return { label: "Dang x? ly", className: "info" };
 case "REJECTED":
 return { label: "Tu choi", className: "danger" };
 default:
 return { label: "Moi tao", className: "pending" };
 }
}

function paymentMethodLabel(method) {
 switch (method) {
 case "BANK_TRANSFER":
 return "ChuyOn khoan";
 case "E_WALLET":
 return "Vi dien tu";
 case "PAY_AT_HOTEL":
 return "Tai khach san";
 default:
 return "-";
 }
}

function couponStatusMeta(coupon) {
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 if (!coupon?.active) {
 return { label: "Tam tat", className: "neutral", kind: "inactive" };
 }

 const expiresAt = parseDate(coupon?.expiresAt);
 if (expiresAt && expiresAt < today) {
 return { label: "Het han", className: "danger", kind: "expired" };
 }

 return { label: "Dang hoat dong", className: "success", kind: "active" };
}

function formatCouponValue(coupon) {
 if (!coupon) {
 return "-";
 }

 if (coupon.discountType === "FIXED") {
 return currencyFormatter.format(Number(coupon.discountValue || 0));
 }

 return `${numberFormatter.format(Number(coupon.discountValue || 0))}%`;
}

function formatCellText(value, fallback = "-") {
 if (value === null || value === undefined) {
 return fallback;
 }

 const normalized = typeof value === "string" ? value.trim() : value;
 return normalized === "" ? fallback : normalized;
}

function toCouponFormState(coupon) {
 return {
 code: coupon?.code || "",
 description: coupon?.description || "",
 discountType: coupon?.discountType || "PERCENT",
 discountValue:
 coupon?.discountValue === undefined || coupon?.discountValue === null
 ? ""
 : String(coupon.discountValue),
 minOrderAmount:
 coupon?.minOrderAmount === undefined || coupon?.minOrderAmount === null
 ? "0"
 : String(coupon.minOrderAmount),
 expiresAt: coupon?.expiresAt || "",
 active: coupon?.active ?? true,
 };
}

function shortId(value) {
 if (!value) {
 return "-";
 }

 return value.length > 10 ? `${value.slice(0, 10)}...` : value;
}

function getAvatarText(name, fallback = "AD") {
 const source = name?.trim();

 if (!source) {
 return fallback;
 }

 const parts = source.split(/\s+/).filter(Boolean);
 if (parts.length >= 2) {
 return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
 }

 return source.slice(0, 2).toUpperCase();
}

function formatRoleLabel(role) {
 const source = String(role || "").trim();
 if (!source) {
 return "Admin";
 }

 return source
 .toLowerCase()
 .split("_")
 .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
 .join(" ");
}

function maskCitizenId(value) {
 const source = String(value || "").trim();
 if (!source) {
 return "Cha cap nhat";
 }

 if (source.length <= 4) {
 return source.replace(/./g, "*");
 }

 return `${"*".repeat(Math.max(source.length - 4, 2))}${source.slice(-4)}`;
}

function clampPercent(value) {
 const parsed = Number(value || 0);
 if (!Number.isFinite(parsed)) {
 return 0;
 }

 return Math.min(Math.max(Math.round(parsed), 0), 100);
}

function parseNonNegative(value, max = Number.POSITIVE_INFINITY) {
 const parsed = Number(value);
 if (!Number.isFinite(parsed) || parsed < 0) {
 return 0;
 }

 return Math.min(Math.floor(parsed), max);
}

function AdminDashboard() {
 const navigate = useNavigate();
 const toast = useToast();
 const profileRef = useRef(null);

 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [profileOpen, setProfileOpen] = useState(false);
 const [activeView, setActiveView] = useState("overview");
 const [sectionOpen, setSectionOpen] = useState({
 management: true,
 account: true,
 });

 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [error, setError] = useState("");

 const [dashboard, setDashboard] = useState({
 totalUsers: 0,
 totalHotels: 0,
 totalRooms: 0,
 totalBookings: 0,
 totalRevenue: 0,
 });
 const [users, setUsers] = useState([]);
 const [hotels, setHotels] = useState([]);
 const [rooms, setRooms] = useState([]);
 const [bookings, setBookings] = useState([]);
 const [coupons, setCoupons] = useState([]);
 const [disputes, setDisputes] = useState([]);
 const [logs, setLogs] = useState([]);

 const [accountLoading, setAccountLoading] = useState(true);
 const [accountError, setAccountError] = useState("");
 const [profileData, setProfileData] = useState(accountInitialState);
 const [email, setEmail] = useState("");
 const [accountMeta, setAccountMeta] = useState(accountMetaInitialState);
 const [profileSaving, setProfileSaving] = useState(false);
 const [emailSaving, setEmailSaving] = useState(false);
 const [profileMessage, setProfileMessage] = useState(null);
 const [emailMessage, setEmailMessage] = useState(null);
 const [couponForm, setCouponForm] = useState(couponInitialState);
 const [editingCouponId, setEditingCouponId] = useState(null);
 const [couponSaving, setCouponSaving] = useState(false);
 const [couponDeletingId, setCouponDeletingId] = useState(null);
 const [couponMessage, setCouponMessage] = useState(null);
 const [confirmDialog, setConfirmDialog] = useState(null);
 const [bookingFilters, setBookingFilters] = useState({
 paymentStatus: "all",
 stayStatus: "all",
 dateFrom: "",
 dateTo: "",
 userQuery: "",
 hotelQuery: "",
 });
 const [paymentDrafts, setPaymentDrafts] = useState({});
 const [paymentUpdatingId, setPaymentUpdatingId] = useState(null);
 const [bookingStatusDrafts, setBookingStatusDrafts] = useState({});
 const [bookingStatusNotes, setBookingStatusNotes] = useState({});
 const [bookingStatusUpdatingId, setBookingStatusUpdatingId] = useState(null);
 const [hotelApprovalDrafts, setHotelApprovalDrafts] = useState({});
 const [hotelApprovalNotes, setHotelApprovalNotes] = useState({});
 const [hotelApprovalUpdatingId, setHotelApprovalUpdatingId] = useState(null);
 const [disputeStatusDrafts, setDisputeStatusDrafts] = useState({});
 const [disputeNotes, setDisputeNotes] = useState({});
 const [disputeUpdatingId, setDisputeUpdatingId] = useState(null);
 const [hotelFilters, setHotelFilters] = useState({
 city: "all",
 minRooms: "0",
 minOccupancy: "0",
 });
 const [hotelCardPage, setHotelCardPage] = useState(1);

 useEffect(() => {
 const onDocumentClick = (event) => {
 if (profileRef.current && !profileRef.current.contains(event.target)) {
 setProfileOpen(false);
 }
 };

 document.addEventListener("mousedown", onDocumentClick);
 return () => document.removeEventListener("mousedown", onDocumentClick);
 }, []);

 const loadDashboardData = useCallback(
 async (manualRefresh = false) => {
 if (manualRefresh) {
 setRefreshing(true);
 } else {
 setLoading(true);
 }
 setError("");

 try {
 const roomsPromise = (async () => {
 try {
 const hostRoomsRes = await getMyHostRooms();
 return normalizeRooms(hostRoomsRes?.data);
 } catch {
 const fallbackRes = await getAdminRooms(0, 5000);
 return normalizeRooms(fallbackRes?.data);
 }
 })();

 const [
 dashboardRes,
 hotelsRes,
 bookingsRes,
 usersRes,
 roomsPayload,
 couponsRes,
 disputesRes,
 logsRes,
 ] =
 await Promise.all([
 getAdminDashboard(),
 getAdminHotelsAll(),
 getAdminBookings(),
 getAdminUsers(),
 roomsPromise,
 getAdminCoupons(),
 getAdminDisputes(),
 getAdminLogs(),
 ]);

 setDashboard(dashboardRes?.data || {});
 setHotels(normalizeHotels(hotelsRes?.data));
 setBookings(normalizeBookings(bookingsRes?.data));
 setUsers(normalizeUsers(usersRes?.data));
 setRooms(roomsPayload);
 setCoupons(normalizeCoupons(couponsRes?.data));
 setDisputes(normalizeDisputes(disputesRes?.data));
 setLogs(normalizeLogs(logsRes?.data));
 } catch (loadError) {
 console.error("Cannot load admin dashboard", loadError);
 setError("Khong thO tai ?O lieu dashboard. Vui long thO lai.");
 toast.error("Khong thO tai ?O lieu dashboard");
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 },
 [toast]
 );

 const loadMyAccount = useCallback(async () => {
 setAccountLoading(true);
 setAccountError("");

 try {
 const res = await getMyAccount();
 const user = res?.data || {};

 setProfileData({
 name: user.name || "",
 gender: user.gender || "",
 dateOfBirth: user.dateOfBirth || "",
 citizenId: user.citizenId || "",
 });
 setEmail(user.email || "");
 setAccountMeta({
 id: user.id || "",
 role: user.role || localStorage.getItem("role") || "ADMIN",
 emailVerified: Boolean(user.emailVerified),
 emailVerifiedAt: user.emailVerifiedAt || "",
 });
 } catch (loadError) {
 console.error("Cannot load admin account", loadError);
 setAccountError("Khong thO tai thong tin t i khoan admin.");
 } finally {
 setAccountLoading(false);
 }
 }, []);

 useEffect(() => {
 loadDashboardData();
 loadMyAccount();
 }, [loadDashboardData, loadMyAccount]);

 const viewMeta = useMemo(() => {
 if (activeView === "hotels") {
 return {
 title: "Quan ly khach san",
 subtitle: "Thong tin hotels ?uoc tach thanh card ?O ?O chanh sua",
 };
 }

 if (activeView === "bookings") {
 return {
 title: "Quan ly booking",
 subtitle: "Theo doi tinh trang ?at phong va doanh thO moi ngay",
 };
 }

 if (activeView === "users") {
 return {
 title: "Quan ly nguoi dung",
 subtitle: "Tong hop vai tro va danh sach tai khoan dang hoat dong",
 };
 }

 if (activeView === "coupons") {
 return {
 title: "Quan ly coupon",
 subtitle: "Tao, cap nhat va kiem soat uu dai dang ?p dong trong he thong",
 };
 }

 if (activeView === "account") {
 return {
 title: "Profile admin",
 subtitle: "Cap nhat thong tin ca nhan va cai dat email",
 };
 }

 if (activeView === "disputes") {
 return {
 title: "Tranh chap va bao cao",
 subtitle: "Xu ly cac ticket lien quan den booking, thanh toan va chat luong luu tru",
 };
 }

 if (activeView === "logs") {
 return {
 title: "Nhat ky hoat dong",
 subtitle: "Theo doi nhung thay doi quan trong de kiem soat van hanh he thong",
 };
 }

 return {
 title: "Tng quan he thong",
 subtitle: "Dashboard du lieu thuc tu backend cua project",
 };
 }, [activeView]);

 const roomMap = useMemo(() => {
 return Object.fromEntries(rooms.map((room) => [room.id, room]));
 }, [rooms]);

 const hotelMap = useMemo(() => {
 return Object.fromEntries(hotels.map((hotel) => [hotel.id, hotel]));
 }, [hotels]);

 const userMap = useMemo(() => {
 return Object.fromEntries(users.map((user) => [user.id, user]));
 }, [users]);

 const bookingsWithMeta = useMemo(() => {
 return bookings.map((booking) => {
 const room = roomMap[booking.roomId] || null;
 const hotel = room?.hotelId ? hotelMap[room.hotelId] || null : null;
 const user = userMap[booking.userId] || null;
 const status = bookingStatusMeta(booking);

 return {
 ...booking,
 room,
 hotel,
 user,
 rawStatus: booking.status,
 status,
 paymentMeta: paymentStatusMeta(booking?.paymentStatus),
 };
 });
 }, [bookings, hotelMap, roomMap, userMap]);

 const sortedBookings = useMemo(() => {
 return [...bookingsWithMeta].sort((a, b) => {
 const aTime = parseDate(a.checkInDate)?.getTime() || 0;
 const bTime = parseDate(b.checkInDate)?.getTime() || 0;
 return bTime - aTime;
 });
 }, [bookingsWithMeta]);

 const overviewStatus = useMemo(() => {
 return bookingsWithMeta.reduce(
 (acc, booking) => {
 if (booking.status.className === "pending") {
 acc.upcoming += 1;
 } else if (booking.status.className === "success") {
 acc.active += 1;
 } else if (booking.status.className === "danger") {
 acc.cancelled += 1;
 } else if (booking.status.className === "neutral") {
 acc.completed += 1;
 } else {
 acc.unknown += 1;
 }
 return acc;
 },
 { upcoming: 0, active: 0, completed: 0, cancelled: 0, unknown: 0 }
 );
 }, [bookingsWithMeta]);

 const monthlyRevenue = useMemo(() => {
 const currentDate = new Date();
 const initialMonths = [];

 for (let i = 6; i >= 0; i -= 1) {
 const monthDate = new Date(
 currentDate.getFullYear(),
 currentDate.getMonth() - i,
 1
 );

 const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
 initialMonths.push({
 key,
 label: `T${monthDate.getMonth() + 1}`,
 value: 0,
 });
 }

 const valueByKey = Object.fromEntries(
 initialMonths.map((month) => [month.key, 0])
 );

 bookingsWithMeta.forEach((booking) => {
 if (booking.status.className === "danger") {
 return;
 }

 const time =
 parseDate(booking.checkInDate) || parseDate(booking.checkOutDate);
 if (!time) {
 return;
 }

 const key = `${time.getFullYear()}-${time.getMonth() + 1}`;
 if (valueByKey[key] === undefined) {
 return;
 }

 valueByKey[key] += bookingRevenueValue(booking);
 });

 return initialMonths.map((month) => ({
 ...month,
 value: valueByKey[month.key] || 0,
 }));
 }, [bookingsWithMeta]);

 const hotelCards = useMemo(() => {
 const roomCountByHotel = {};
 rooms.forEach((room) => {
 if (!room.hotelId) {
 return;
 }
 roomCountByHotel[room.hotelId] = (roomCountByHotel[room.hotelId] || 0) + 1;
 });

 const bookingCountByHotel = {};
 const activeByHotel = {};

 bookingsWithMeta.forEach((booking) => {
 const hotelId = booking.room?.hotelId;
 if (!hotelId) {
 return;
 }

 bookingCountByHotel[hotelId] = (bookingCountByHotel[hotelId] || 0) + 1;
 if (booking.status.className === "success") {
 activeByHotel[hotelId] = (activeByHotel[hotelId] || 0) + 1;
 }
 });

 return hotels
 .map((hotel) => {
 const totalRooms = roomCountByHotel[hotel.id] || 0;
 const totalBookings = bookingCountByHotel[hotel.id] || 0;
 const activeStays = activeByHotel[hotel.id] || 0;
 const occupancy = totalRooms
 ? clampPercent((activeStays / totalRooms) * 100)
 : 0;

 return {
 ...hotel,
 totalRooms,
 totalBookings,
 activeStays,
 occupancy,
 };
 })
 .sort((a, b) => b.totalBookings - a.totalBookings);
 }, [bookingsWithMeta, hotels, rooms]);

 const occupancyRows = useMemo(() => {
 return [...hotelCards]
 .sort((a, b) => b.occupancy - a.occupancy)
 .slice(0, 6);
 }, [hotelCards]);

 const hotelCityOptions = useMemo(() => {
 const uniqueCities = new Set(
 hotelCards
 .map((hotel) => hotel.city?.trim())
 .filter((cityName) => Boolean(cityName))
 );

 return [...uniqueCities].sort((a, b) => a.localeCompare(b, "vi"));
 }, [hotelCards]);

 const filteredHotelCards = useMemo(() => {
 const minRooms = parseNonNegative(hotelFilters.minRooms);
 const minOccupancy = parseNonNegative(hotelFilters.minOccupancy, 100);

 return hotelCards.filter((hotel) => {
 const cityMatch =
 hotelFilters.city === "all" || (hotel.city || "").trim() === hotelFilters.city;
 const roomsMatch = Number(hotel.totalRooms || 0) >= minRooms;
 const occupancyMatch = Number(hotel.occupancy || 0) >= minOccupancy;

 return cityMatch && roomsMatch && occupancyMatch;
 });
 }, [hotelCards, hotelFilters.city, hotelFilters.minOccupancy, hotelFilters.minRooms]);

 const hotelCardTotalPages = useMemo(() => {
 if (!filteredHotelCards.length) {
 return 1;
 }
 return Math.ceil(filteredHotelCards.length / ADMIN_HOTELS_PER_PAGE);
 }, [filteredHotelCards.length]);

 const pagedHotelCards = useMemo(() => {
 const startIndex = (hotelCardPage - 1) * ADMIN_HOTELS_PER_PAGE;
 return filteredHotelCards.slice(startIndex, startIndex + ADMIN_HOTELS_PER_PAGE);
 }, [filteredHotelCards, hotelCardPage]);

 const hotelCardPaginationPages = useMemo(() => {
 const pages = new Set([
 1,
 hotelCardTotalPages,
 hotelCardPage,
 hotelCardPage - 1,
 hotelCardPage + 1,
 ]);

 return [...pages]
 .filter((page) => page >= 1 && page <= hotelCardTotalPages)
 .sort((a, b) => a - b);
 }, [hotelCardPage, hotelCardTotalPages]);

 useEffect(() => {
 setHotelCardPage((prev) => {
 if (prev > hotelCardTotalPages) {
 return hotelCardTotalPages;
 }
 if (prev < 1) {
 return 1;
 }
 return prev;
 });
 }, [hotelCardTotalPages]);

 const topFilteredHotel = useMemo(() => {
 if (!filteredHotelCards.length) {
 return null;
 }

 return [...filteredHotelCards].sort((a, b) => b.occupancy - a.occupancy)[0];
 }, [filteredHotelCards]);

 const citySummary = useMemo(() => {
 const map = hotels.reduce((acc, hotel) => {
 const city = hotel.city?.trim() || "Khac";
 acc[city] = (acc[city] || 0) + 1;
 return acc;
 }, {});

 return Object.entries(map)
 .map(([city, count]) => ({ city, count }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 4);
 }, [hotels]);

 const userSummary = useMemo(() => {
 const admins = users.filter((user) => user.role === "ADMIN").length;
 const usersNormal = users.filter((user) => user.role !== "ADMIN").length;
 return {
 admins,
 usersNormal,
 total: users.length,
 };
 }, [users]);

 const accountId = useMemo(() => {
 if (accountMeta.id) {
 return accountMeta.id;
 }

 const normalizedEmail = email.trim().toLowerCase();
 if (!normalizedEmail) {
 return "";
 }

 return (
 users.find((user) => (user.email || "").trim().toLowerCase() === normalizedEmail)?.id || ""
 );
 }, [accountMeta.id, email, users]);

 const accountSummary = useMemo(() => {
 const completenessFields = [
 Boolean(profileData.name?.trim()),
 Boolean(email.trim()),
 Boolean(profileData.gender?.trim()),
 Boolean(profileData.dateOfBirth.trim()),
 Boolean(profileData.citizenId.trim()),
 ];
 const completionPercent = Math.round(
 (completenessFields.filter(Boolean).length / completenessFields.length) * 100
 );
 const verified = Boolean(accountMeta.emailVerified);

 return {
 completionPercent,
 verified,
 roleLabel: formatRoleLabel(
 accountMeta.role || localStorage.getItem("role") || "ADMIN"
 ),
 maskedCitizenId: maskCitizenId(profileData.citizenId),
 verificationLabel: verified ? "Email da xac thuc" : "Email chua xac thuc",
 verificationTime: verified
 ? accountMeta.emailVerifiedAt
 ? formatDateTime(accountMeta.emailVerifiedAt)
 : "-"
 : "-",
 };
 }, [
 accountMeta.emailVerified,
 accountMeta.emailVerifiedAt,
 accountMeta.role,
 email,
 profileData.citizenId,
 profileData.dateOfBirth,
 profileData.gender,
 profileData.name,
 ]);

 const averageRoomPrice = useMemo(() => {
 if (!rooms.length) {
 return 0;
 }

 const total = rooms.reduce((sum, room) => sum + Number(room.price || 0), 0);
 return total / rooms.length;
 }, [rooms]);

 const topBarMax = useMemo(() => {
 const maxValue = Math.max(...monthlyRevenue.map((item) => item.value), 0);
 return maxValue || 1;
 }, [monthlyRevenue]);

 const sortedCoupons = useMemo(() => {
 const couponPriority = {
 active: 0,
 expired: 1,
 inactive: 2,
 };

 return [...coupons].sort((a, b) => {
 const aMeta = couponStatusMeta(a);
 const bMeta = couponStatusMeta(b);
 const kindDiff = couponPriority[aMeta.kind] - couponPriority[bMeta.kind];

 if (kindDiff !== 0) {
 return kindDiff;
 }

 const aExpiry = parseDate(a.expiresAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
 const bExpiry = parseDate(b.expiresAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
 if (aExpiry !== bExpiry) {
 return aExpiry - bExpiry;
 }

 return (a.code || "").localeCompare(b.code || "", "vi");
 });
 }, [coupons]);

 const couponSummary = useMemo(() => {
 return sortedCoupons.reduce(
 (acc, coupon) => {
 const meta = couponStatusMeta(coupon);
 acc.total += 1;
 if (meta.kind === "active") {
 acc.active += 1;
 } else if (meta.kind === "expired") {
 acc.expired += 1;
 } else {
 acc.inactive += 1;
 }
 return acc;
 },
 { total: 0, active: 0, expired: 0, inactive: 0 }
 );
 }, [sortedCoupons]);

 const paymentSummary = useMemo(() => {
 return bookingsWithMeta.reduce(
 (acc, booking) => {
 if (booking.paymentMeta.kind === "paid") {
 acc.paid += 1;
 } else if (booking.paymentMeta.kind === "pending") {
 acc.pending += 1;
 } else if (booking.paymentMeta.kind === "refunded") {
 acc.refunded += 1;
 } else if (booking.paymentMeta.kind === "failed") {
 acc.failed += 1;
 }
 return acc;
 },
 { paid: 0, pending: 0, refunded: 0, failed: 0 }
 );
 }, [bookingsWithMeta]);

 const filteredBookings = useMemo(() => {
 return sortedBookings.filter((booking) => {
 const paymentMatch =
 bookingFilters.paymentStatus === "all" ||
 (booking.paymentStatus || "PENDING") === bookingFilters.paymentStatus;

 const stayMatch =
 bookingFilters.stayStatus === "all" ||
 bookingStayFilterValue(booking) === bookingFilters.stayStatus;

 const dateMatch = bookingMatchesDateRange(
 booking,
 bookingFilters.dateFrom,
 bookingFilters.dateTo
 );
 const userQuery = bookingFilters.userQuery.trim().toLowerCase();
 const hotelQuery = bookingFilters.hotelQuery.trim().toLowerCase();
 const userSource = `${booking.user?.name || ""} ${booking.user?.email || ""} ${booking.userId || ""}`.toLowerCase();
 const hotelSource =
 `${booking.hotel?.name || ""} ${booking.hotel?.city || ""} ${booking.room?.name || ""}`.toLowerCase();
 const userMatch = !userQuery || userSource.includes(userQuery);
 const hotelMatch = !hotelQuery || hotelSource.includes(hotelQuery);

 return paymentMatch && stayMatch && dateMatch && userMatch && hotelMatch;
 });
 }, [
 bookingFilters.dateFrom,
 bookingFilters.dateTo,
 bookingFilters.hotelQuery,
 bookingFilters.paymentStatus,
 bookingFilters.stayStatus,
 bookingFilters.userQuery,
 sortedBookings,
 ]);

 const sortedDisputes = useMemo(() => {
 return [...disputes].sort((a, b) => {
 const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
 const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
 return bTime - aTime;
 });
 }, [disputes]);

 const sortedLogs = useMemo(() => {
 return [...logs].sort((a, b) => {
 const aTime = new Date(a.createdAt || 0).getTime();
 const bTime = new Date(b.createdAt || 0).getTime();
 return bTime - aTime;
 });
 }, [logs]);

 const openView = (view) => {
 setActiveView(view);
 setSidebarOpen(false);
 };

 const handleHotelFilterChange = (event) => {
 const { name, value } = event.target;
 setHotelFilters((prev) => ({ ...prev, [name]: value }));
 setHotelCardPage(1);
 };

 const handleBookingFilterChange = (event) => {
 const { name, value } = event.target;
 setBookingFilters((prev) => ({ ...prev, [name]: value }));
 };

 const resetHotelFilters = () => {
 setHotelFilters({
 city: "all",
 minRooms: "0",
 minOccupancy: "0",
 });
 setHotelCardPage(1);
 };

 const resetBookingFilters = () => {
 setBookingFilters({
 paymentStatus: "all",
 stayStatus: "all",
 dateFrom: "",
 dateTo: "",
 userQuery: "",
 hotelQuery: "",
 });
 };

 const handleLogout = () => {
 localStorage.removeItem("accessToken");
 localStorage.removeItem("refreshToken");
 localStorage.removeItem("role");
 navigate("/login", { replace: true });
 };

 const handleProfileSave = async (event) => {
 event.preventDefault();
 setProfileSaving(true);
 setProfileMessage(null);

 try {
 const res = await updateMyProfile(profileData);
 const user = res?.data || {};

 setProfileData({
 name: user.name || "",
 gender: user.gender || "",
 dateOfBirth: user.dateOfBirth || "",
 citizenId: user.citizenId || "",
 });
 setEmail(user.email || email);
 setAccountMeta((prev) => ({
 ...prev,
 id: user.id || prev.id,
 role: user.role || prev.role,
 emailVerified:
 user.emailVerified === undefined ? prev.emailVerified : Boolean(user.emailVerified),
 emailVerifiedAt: user.emailVerifiedAt ?? prev.emailVerifiedAt,
 }));

 setProfileMessage({ type: "success", text: "Da cap nhat profile admin." });
 toast.success("Da cap nhat profile admin");
 } catch (saveError) {
 console.error("Cannot save admin profile", saveError);
 const message =
 saveError?.response?.data?.message ||
 "Cap nhat profile thet bai. Vui long thO lai.";
 setProfileMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setProfileSaving(false);
 }
 };

 const handleEmailSave = async (event) => {
 event.preventDefault();
 setEmailSaving(true);
 setEmailMessage(null);

 try {
 const res = await updateMyEmail(email);
 const data = res?.data || {};
 const user = data.user || {};

 if (data.accessToken) {
 localStorage.setItem("accessToken", data.accessToken);
 }

 if (data.role) {
 localStorage.setItem("role", data.role);
 }

 setEmail(user.email || email);
 setProfileData((prev) => ({
 ...prev,
 name: user.name ?? prev.name,
 gender: user.gender ?? prev.gender,
 dateOfBirth: user.dateOfBirth ?? prev.dateOfBirth,
 citizenId: user.citizenId ?? prev.citizenId,
 }));
 setAccountMeta((prev) => ({
 ...prev,
 id: user.id || prev.id,
 role: data.role || user.role || prev.role,
 emailVerified:
 user.emailVerified === undefined ? prev.emailVerified : Boolean(user.emailVerified),
 emailVerifiedAt: user.emailVerifiedAt ?? prev.emailVerifiedAt,
 }));

 setEmailMessage({ type: "success", text: "Da cap nhat email admin." });
 toast.success("Da cap nhat email admin");
 } catch (saveError) {
 console.error("Cannot update admin email", saveError);
 const message =
 saveError?.response?.data?.message ||
 "Cap nhat email thet bai. Vui long thO lai.";
 setEmailMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setEmailSaving(false);
 }
 };

 const handleCouponFieldChange = (event) => {
 const { name, type, value, checked } = event.target;
 setCouponForm((prev) => ({
 ...prev,
 [name]: type === "checkbox" ? checked : value,
 }));
 };

 const resetCouponForm = () => {
 setCouponForm({ ...couponInitialState });
 setEditingCouponId(null);
 setCouponMessage(null);
 };

 const closeConfirmDialog = () => {
 if (couponDeletingId) {
 return;
 }

 setConfirmDialog(null);
 };

 const performCouponDelete = async (coupon) => {
 if (!coupon?.id) {
 toast.error("Coupon nay chua san sang ?O xoa.");
 return;
 }

 setCouponDeletingId(coupon.id);
 setCouponMessage(null);

 try {
 await deleteAdminCoupon(coupon.id);
 setCoupons((prev) => prev.filter((item) => item.id !== coupon.id));

 if (editingCouponId === coupon.id) {
 resetCouponForm();
 }

 setConfirmDialog(null);
 toast.success("Da xoa coupon th nh cong.");
 } catch (deleteError) {
 console.error("Cannot delete coupon", deleteError);
 const responseMessage =
 typeof deleteError?.response?.data === "string"
 ? deleteError.response.data
 : deleteError?.response?.data?.message;
 toast.error(responseMessage || "Khong thO xoa coupon. Vui long thO lai.");
 } finally {
 setCouponDeletingId(null);
 }
 };

 const handleCouponDeleteRequest = (coupon) => {
 if (!coupon?.id) {
 toast.error("Coupon nay chua san sang ?O xoa.");
 return;
 }

 setConfirmDialog({
 type: "delete-coupon",
 title: "Xoa coupon nay?",
 description: `Coupon ${coupon.code || ""} se bi xoa khoi he thong va khong con hien thi o trang booking.`,
 confirmLabel: "Xoa coupon",
 coupon,
 });
 };

 const handleConfirmDialogAction = async () => {
 if (!confirmDialog) {
 return;
 }

 if (confirmDialog.type === "delete-coupon") {
 await performCouponDelete(confirmDialog.coupon);
 }
 };

 const handleCouponEdit = (coupon) => {
 setCouponForm(toCouponFormState(coupon));
 setEditingCouponId(coupon?.id || null);
 setCouponMessage(null);
 setActiveView("coupons");
 setSidebarOpen(false);
 };

 const handleCouponSubmit = async (event) => {
 event.preventDefault();
 setCouponSaving(true);
 setCouponMessage(null);

 const payload = {
 code: couponForm.code.trim().toUpperCase(),
 description: couponForm.description.trim(),
 discountType: couponForm.discountType,
 discountValue: Number(couponForm.discountValue),
 minOrderAmount: Math.max(Number(couponForm.minOrderAmount) || 0, 0),
 expiresAt: couponForm.expiresAt || null,
 active: Boolean(couponForm.active),
 };

 try {
 const res = editingCouponId
 ? await updateAdminCoupon(editingCouponId, payload)
 : await createAdminCoupon(payload);

 const savedCoupon = res?.data;
 setCoupons((prev) => {
 const nextCoupons = editingCouponId
 ? prev.map((item) => (item.id === savedCoupon?.id ? savedCoupon : item))
 : [savedCoupon, ...prev];

 const seen = new Set();
 return nextCoupons.filter((item) => {
 const key = item?.id || item?.code;
 if (!key || seen.has(key)) {
 return false;
 }
 seen.add(key);
 return true;
 });
 });

 const successMessage = editingCouponId
 ? "Da cap nhat coupon th nh cong."
 : "Da tao coupon moi th nh cong.";

 setCouponMessage({ type: "success", text: successMessage });
 toast.success(successMessage);
 setCouponForm({ ...couponInitialState });
 setEditingCouponId(null);
 } catch (saveError) {
 console.error("Cannot save coupon", saveError);
 const responseMessage =
 typeof saveError?.response?.data === "string"
 ? saveError.response.data
 : saveError?.response?.data?.message;
 const message = responseMessage || "Khong thO luu coupon. Vui long thO lai.";
 setCouponMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setCouponSaving(false);
 }
 };

 const handlePaymentDraftChange = (bookingId, paymentStatus) => {
 setPaymentDrafts((prev) => ({
 ...prev,
 [bookingId]: paymentStatus,
 }));
 };

 const handleBookingStatusDraftChange = (bookingId, status) => {
 setBookingStatusDrafts((prev) => ({
 ...prev,
 [bookingId]: status,
 }));
 };

 const handleBookingStatusNoteChange = (bookingId, note) => {
 setBookingStatusNotes((prev) => ({
 ...prev,
 [bookingId]: note,
 }));
 };

 const handleHotelApprovalDraftChange = (hotelId, status) => {
 setHotelApprovalDrafts((prev) => ({
 ...prev,
 [hotelId]: status,
 }));
 };

 const handleHotelApprovalNoteChange = (hotelId, note) => {
 setHotelApprovalNotes((prev) => ({
 ...prev,
 [hotelId]: note,
 }));
 };

 const handleDisputeStatusDraftChange = (disputeId, status) => {
 setDisputeStatusDrafts((prev) => ({
 ...prev,
 [disputeId]: status,
 }));
 };

 const handleDisputeNoteChange = (disputeId, note) => {
 setDisputeNotes((prev) => ({
 ...prev,
 [disputeId]: note,
 }));
 };

 const handlePaymentStatusUpdate = async (booking) => {
 const nextStatus = paymentDrafts[booking.id] || booking.paymentStatus || "PENDING";
 const currentStatus = booking.paymentStatus || "PENDING";

 if (!booking?.id || nextStatus === currentStatus) {
 return;
 }

 setPaymentUpdatingId(booking.id);

 try {
 const res = await updateAdminBookingPaymentStatus(booking.id, {
 paymentStatus: nextStatus,
 });

 const updatedBooking = res?.data;
 setBookings((prev) =>
 prev.map((item) => (item.id === updatedBooking?.id ? updatedBooking : item))
 );
 setPaymentDrafts((prev) => {
 const nextDrafts = { ...prev };
 delete nextDrafts[booking.id];
 return nextDrafts;
 });
 toast.success(
 `Da cap nhat payment status: ${paymentStatusMeta(nextStatus).label}.`
 );
 } catch (updateError) {
 console.error("Cannot update payment status", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(
 responseMessage || "Khong thO cap nhat payment status. Vui long thO lai."
 );
 } finally {
 setPaymentUpdatingId(null);
 }
 };

 const handleBookingStatusUpdate = async (booking) => {
 const nextStatus = bookingStatusDrafts[booking.id] || booking.rawStatus || "CONFIRMED";
 const currentStatus = booking.rawStatus || "CONFIRMED";

 if (!booking?.id || nextStatus === currentStatus) {
 return;
 }

 setBookingStatusUpdatingId(booking.id);

 try {
 const res = await updateAdminBookingStatus(booking.id, {
 status: nextStatus,
 note: bookingStatusNotes[booking.id] || "",
 });

 const updatedBooking = res?.data;
 setBookings((prev) =>
 prev.map((item) => (item.id === updatedBooking?.id ? updatedBooking : item))
 );
 setBookingStatusDrafts((prev) => {
 const next = { ...prev };
 delete next[booking.id];
 return next;
 });
 setBookingStatusNotes((prev) => {
 const next = { ...prev };
 delete next[booking.id];
 return next;
 });
 toast.success("Da cap nhat trang thai booking");
 } catch (updateError) {
 console.error("Cannot update booking status", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Khong thO cap nhat trang thai booking.");
 } finally {
 setBookingStatusUpdatingId(null);
 }
 };

 const handleHotelApprovalUpdate = async (hotel) => {
 const nextStatus = hotelApprovalDrafts[hotel.id] || hotel.approvalStatus || "PENDING";
 const currentStatus = hotel.approvalStatus || "PENDING";
 const nextNote = (hotelApprovalNotes[hotel.id] ?? hotel.approvalNote ?? "").trim();
 const currentNote = (hotel.approvalNote || "").trim();

 if (!hotel.id || (nextStatus === currentStatus && nextNote === currentNote)) {
 return;
 }

 setHotelApprovalUpdatingId(hotel.id);

 try {
 const res = await updateAdminHotelApproval(hotel.id, {
 status: nextStatus,
 note: nextNote,
 });
 const updatedHotel = res?.data;
 setHotels((prev) => prev.map((item) => (item.id === updatedHotel.id ? updatedHotel : item)));
 setHotelApprovalDrafts((prev) => {
 const next = { ...prev };
 delete next[hotel.id];
 return next;
 });
 setHotelApprovalNotes((prev) => {
 const next = { ...prev };
 delete next[hotel.id];
 return next;
 });
 toast.success("Da cap nhat trang thai duyet hotel");
 } catch (updateError) {
 console.error("Cannot update hotel approval", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Khong thO cap nhat trang thai hotel.");
 } finally {
 setHotelApprovalUpdatingId(null);
 }
 };

 const handleDisputeUpdate = async (dispute) => {
 const nextStatus = disputeStatusDrafts[dispute.id] || dispute.status || "OPEN";
 const currentStatus = dispute.status || "OPEN";
 const nextNote = (disputeNotes[dispute.id] ?? dispute.resolutionNote ?? "").trim();
 const currentNote = (dispute.resolutionNote || "").trim();

 if (!dispute?.id || (nextStatus === currentStatus && nextNote === currentNote)) {
 return;
 }

 setDisputeUpdatingId(dispute.id);

 try {
 const res = await updateAdminDisputeStatus(dispute.id, {
 status: nextStatus,
 resolutionNote: nextNote,
 });
 const updatedDispute = res?.data;
 setDisputes((prev) =>
 prev.map((item) => (item.id === updatedDispute?.id ? updatedDispute : item))
 );
 setDisputeStatusDrafts((prev) => {
 const next = { ...prev };
 delete next[dispute.id];
 return next;
 });
 setDisputeNotes((prev) => {
 const next = { ...prev };
 delete next[dispute.id];
 return next;
 });
 toast.success("Da cap nhat tranh chap");
 } catch (updateError) {
 console.error("Cannot update dispute", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Khong thO cap nhat tranh chap.");
 } finally {
 setDisputeUpdatingId(null);
 }
 };

 const renderOverview = () => (
 <>
 <section className="kpi-grid">
 <article className="kpi-card">
 <p className="kpi-label">Tng nguoi dung</p>
 <h3>{numberFormatter.format(dashboard.totalUsers || 0)}</h3>
 <p className="kpi-trend up">{userSummary.admins} admin dang quan ly</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng khach san</p>
 <h3>{numberFormatter.format(dashboard.totalHotels || 0)}</h3>
 <p className="kpi-trend up">{citySummary.length} thanh phi noi bat</p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng phong</p>
 <h3>{numberFormatter.format(dashboard.totalRooms || 0)}</h3>
 <p className="kpi-trend up">
 Gia TB {currencyFormatter.format(averageRoomPrice || 0)}
 </p>
 </article>
 <article className="kpi-card">
 <p className="kpi-label">Tng booking</p>
 <h3>{numberFormatter.format(dashboard.totalBookings || 0)}</h3>
 <p className="kpi-trend down">
 {overviewStatus.upcoming} sap ?en | {overviewStatus.cancelled} da huy
 </p>
 </article>
 </section>

 <section className="analytics-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Doanh thu 7 thang gan nhat</p>
 <h2>{currencyFormatter.format(dashboard.totalRevenue || 0)}</h2>
 </div>
 <span className="panel-badge">{overviewStatus.active} dang luu tru</span>
 </div>

 <div className="revenue-chart">
 {monthlyRevenue.map((item) => (
 <div key={item.key} className="bar-col">
 <div className="bar-track">
 <span
 className="bar-fill"
 style={{
 height: `${Math.max((item.value / topBarMax) * 100, 5)}%`,
 }}
 />
 </div>
 <strong>{item.label}</strong>
 <span>{numberFormatter.format(Math.round(item.value / 1000000))}M</span>
 </div>
 ))}
 </div>
 </article>

 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Hieu suat lap day</p>
 <h2>Top hotel lap day cao nhat</h2>
 </div>
 </div>

 <div className="occupancy-list">
 {occupancyRows.length ? (
 occupancyRows.map((hotel) => (
 <div key={hotel.id} className="occupancy-row">
 <div className="occupancy-title">
 <span>{hotel.name || "Khach san"}</span>
 <strong>{hotel.occupancy}%</strong>
 </div>
 <div className="progress">
 <span style={{ width: `${hotel.occupancy}%` }} />
 </div>
 </div>
 ))
 ) : (
 <div className="admin-empty-state">Cha co ?O lieu occupancy theo hotel.</div>
 )}
 </div>
 </article>
 </section>

 <section className="bottom-grid">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Booking gan day</p>
 <h2>Danh sach ?at phong moi nhat</h2>
 </div>
 </div>

 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Ma</th>
 <th>Nguoi dat</th>
 <th>Khach san</th>
 <th>Ngy o</th>
 <th>Tng tien</th>
 <th>Trang thai</th>
 </tr>
 </thead>
 <tbody>
 {sortedBookings.slice(0, 8).map((booking) => (
 <tr key={booking.id}>
 <td>{shortId(booking.id)}</td>
 <td>{booking.user?.name || booking.user?.email || "-"}</td>
 <td>{booking.hotel?.name || "-"}</td>
 <td>
 {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
 </td>
 <td>
 {currencyFormatter.format(bookingRevenueValue(booking))}
 </td>
 <td>
 <span className={`status-pill ${booking.status.className}`}>
 {booking.status.label}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </article>

 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tng quan nhanh</p>
 <h2>DO lieu van hanh</h2>
 </div>
 </div>

 <div className="type-grid">
 <article className="type-card">
 <h3>Trang thai booking</h3>
 <p>
 Sap ?en: {overviewStatus.upcoming} | Dang ?: {overviewStatus.active} | Hoan tat:{" "}
 {overviewStatus.completed} | Da huy: {overviewStatus.cancelled}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem booking
 </button>
 </article>
 <article className="type-card">
 <h3>Thanh toan</h3>
 <p>
 Da thanh toan: {paymentSummary.paid} | Cho thanh toan: {paymentSummary.pending} |
 Hoan tien: {paymentSummary.refunded} | Thet bai: {paymentSummary.failed}
 </p>
 <button type="button" onClick={() => openView("bookings")}>
 Xem payment
 </button>
 </article>
 <article className="type-card">
 <h3>Phan bo thanh phi</h3>
 <p>
 {citySummary.length
 ? citySummary.map((item) => `${item.city} (${item.count})`).join(", ")
 : "Cha co ?O lieu thanh phi"}
 </p>
 <button type="button" onClick={() => openView("hotels")}>
 Xem hotels
 </button>
 </article>
 <article className="type-card">
 <h3>Coupon dang dung</h3>
 <p>
 Hoat dong: {couponSummary.active} | Het han: {couponSummary.expired} | Tam tat:{" "}
 {couponSummary.inactive}
 </p>
 <button type="button" onClick={() => openView("coupons")}>
 Quan ly coupon
 </button>
 </article>
 <article className="type-card">
 <h3>Phan quyen nguoi dung</h3>
 <p>
 Admin: {userSummary.admins} | User: {userSummary.usersNormal} | Tng:{" "}
 {userSummary.total}
 </p>
 <button type="button" onClick={() => openView("users")}>
 Xem users
 </button>
 </article>
 </div>
 </article>
 </section>
 </>
 );

 const renderHotels = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Danh sach hotels</p>
 <h2>Tach rieng tung card ?O ?O mo rong</h2>
 </div>
 <span className="panel-badge">
 Trang {hotelCardPage}/{hotelCardTotalPages} - {filteredHotelCards.length}/{hotelCards.length} hotels
 </span>
 </div>

 <div className="admin-hotel-filters">
 <label className="admin-filter-field">
 <span>Thonh phi</span>
 <select name="city" value={hotelFilters.city} onChange={handleHotelFilterChange}>
 <option value="all">Tat c? thanh phi</option>
 {hotelCityOptions.map((city) => (
 <option key={city} value={city}>
 {city}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>S? phong tai thiOu</span>
 <input
 type="number"
 min="0"
 name="minRooms"
 value={hotelFilters.minRooms}
 onChange={handleHotelFilterChange}
 />
 </label>

 <label className="admin-filter-field">
 <span>Lap day tai thiOu (%)</span>
 <input
 type="number"
 min="0"
 max="100"
 name="minOccupancy"
 value={hotelFilters.minOccupancy}
 onChange={handleHotelFilterChange}
 />
 </label>

 <button type="button" className="admin-filter-reset" onClick={resetHotelFilters}>
 Dat lai bo luc
 </button>
 </div>

 <div className="admin-summary-grid">
 <div className="type-card">
 <h3>Phong hoat dong</h3>
 <p>{numberFormatter.format(rooms.length)} phong trong he thong</p>
 </div>
 <div className="type-card">
 <h3>Booking theo hotel</h3>
 <p>{numberFormatter.format(bookings.length)} luot ?at phong</p>
 </div>
 <div className="type-card">
 <h3>Khach san lap day cao</h3>
 <p>
 {topFilteredHotel
 ? `${topFilteredHotel.name} - ${topFilteredHotel.occupancy}%`
 : "Cha co ?O lieu"}
 </p>
 </div>
 </div>

 {hotelCards.length ? (
 filteredHotelCards.length ? (
 <>
 <div className="admin-hotel-grid">
 {pagedHotelCards.map((hotel) => {
 const approvalMetaItem = hotelApprovalMeta(hotel.approvalStatus);
 const selectedStatus =
 hotelApprovalDrafts[hotel.id] || hotel.approvalStatus || "PENDING";
 const noteValue = hotelApprovalNotes[hotel.id] ?? hotel.approvalNote ?? "";
 const statusDirty =
 selectedStatus !== (hotel.approvalStatus || "PENDING") ||
 noteValue.trim() !== String(hotel.approvalNote || "").trim();

 return (
 <article key={hotel.id} className="admin-hotel-admin-card">
 <div className="admin-hotel-card-head">
 <div>
 <p className="panel-tag">{hotel.city || "Viet Nam"}</p>
 <h3>{hotel.name || "Khach san"}</h3>
 </div>
 <span className={`status-pill ${approvalMetaItem.className}`}>
 {approvalMetaItem.label}
 </span>
 </div>

 <p className="admin-hotel-address">{hotel.address || "-"}</p>

 <div className="admin-hotel-meta">
 <span>{hotel.starRating || 3} sao</span>
 <span>{hotel.totalRooms || 0} loai phong</span>
 <span>{hotel.totalBookings || 0} booking</span>
 <span>Lap day {hotel.occupancy || 0}%</span>
 </div>

 <div className="admin-hotel-meta">
 <span>Huy mien phi: {hotel.freeCancellationBeforeDays ?? 0} ngay</span>
 <span>Hoan tien muon: {hotel.lateCancellationRefundRate ?? 0}%</span>
 </div>

 <div className="admin-form-stack">
 <label className="admin-filter-field">
 <span>Duyet hotel</span>
 <select
 value={selectedStatus}
 onChange={(event) =>
 handleHotelApprovalDraftChange(hotel.id, event.target.value)
 }
 disabled={hotelApprovalUpdatingId === hotel.id}
 >
 {hotelApprovalOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>Ghi chu admin</span>
 <textarea
 value={noteValue}
 onChange={(event) =>
 handleHotelApprovalNoteChange(hotel.id, event.target.value)
 }
 placeholder="Ly do duyet, tu choi hoac can host bo sung thong tin"
 />
 </label>
 </div>

 <div className="admin-card-actions">
 <button
 type="button"
 className="btn-action btn-secondary"
 onClick={() =>
 navigate(`/hotels/${hotel.id}`, {
 state: { hotel },
 })
 }
 >
 Xem chi tiet
 </button>
 <button
 type="button"
 className="btn-action btn-primary"
 disabled={!statusDirty || hotelApprovalUpdatingId === hotel.id}
 onClick={() => handleHotelApprovalUpdate(hotel)}
 >
 {hotelApprovalUpdatingId === hotel.id ? "Dang luu..." : "Lu duyet"}
 </button>
 </div>
 </article>
 );
 })}
 </div>

 <div className="admin-hotel-pagination">
 <button
 type="button"
 className="admin-pagination-btn"
 onClick={() => setHotelCardPage((prev) => Math.max(prev - 1, 1))}
 disabled={hotelCardPage === 1}
 >
 Truoc
 </button>

 <div className="admin-pagination-list">
 {hotelCardPaginationPages.map((page, index) => {
 const prevPage = hotelCardPaginationPages[index - 1];
 const showGap = prevPage && page - prevPage > 1;
 return (
 <span key={page} className="admin-pagination-item-wrap">
 {showGap ? <span className="admin-pagination-gap">...</span> : null}
 <button
 type="button"
 className={`admin-pagination-btn number ${
 hotelCardPage === page ? "active" : ""
 }`}
 onClick={() => setHotelCardPage(page)}
 >
 {page}
 </button>
 </span>
 );
 })}
 </div>

 <button
 type="button"
 className="admin-pagination-btn"
 onClick={() =>
 setHotelCardPage((prev) => Math.min(prev + 1, hotelCardTotalPages))
 }
 disabled={hotelCardPage >= hotelCardTotalPages}
 >
 Sau
 </button>
 </div>
 </>
 ) : (
 <div className="admin-empty-state">
 Khong co khach san phu hop bo luc hien tai.
 </div>
 )
 ) : (
 <div className="admin-empty-state">Cha co khach san nao trong he thong.</div>
 )}
 </article>
 </section>
 );

 const renderBookings = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tat c? booking</p>
 <h2>Quan sat booking theo tinh trang thuc tu</h2>
 </div>
 <span className="panel-badge">
 {filteredBookings.length}/{sortedBookings.length} booking
 </span>
 </div>

 <div className="admin-booking-filters">
 <label className="admin-filter-field">
 <span>Payment status</span>
 <select
 name="paymentStatus"
 value={bookingFilters.paymentStatus}
 onChange={handleBookingFilterChange}
 >
 {paymentStatusFilterOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>User</span>
 <input
 type="text"
 name="userQuery"
 value={bookingFilters.userQuery}
 onChange={handleBookingFilterChange}
 placeholder="Ten, email nguoi dat"
 />
 </label>

 <label className="admin-filter-field">
 <span>Hotel</span>
 <input
 type="text"
 name="hotelQuery"
 value={bookingFilters.hotelQuery}
 onChange={handleBookingFilterChange}
 placeholder="Ten hotel hoac phong"
 />
 </label>

 <label className="admin-filter-field">
 <span>Trang thai o</span>
 <select
 name="stayStatus"
 value={bookingFilters.stayStatus}
 onChange={handleBookingFilterChange}
 >
 {bookingStayStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>Tu ngay</span>
 <input
 type="date"
 name="dateFrom"
 value={bookingFilters.dateFrom}
 onChange={handleBookingFilterChange}
 />
 </label>

 <label className="admin-filter-field">
 <span>Den ngay</span>
 <input
 type="date"
 name="dateTo"
 value={bookingFilters.dateTo}
 onChange={handleBookingFilterChange}
 />
 </label>

 <button
 type="button"
 className="admin-filter-reset"
 onClick={resetBookingFilters}
 >
 Dat lai bo luc
 </button>
 </div>

 {filteredBookings.length ? (
 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Ma booking</th>
 <th>User</th>
 <th>Hotel</th>
 <th>Room</th>
 <th>Check-in</th>
 <th>Check-out</th>
 <th>Tng tien</th>
 <th>Thanh toan</th>
 <th>Coupon</th>
 <th>Ghi chu</th>
 <th>Trang thai</th>
 </tr>
 </thead>
 <tbody>
 {filteredBookings.map((booking) => {
 const selectedPaymentStatus =
 paymentDrafts[booking.id] || booking.paymentStatus || "PENDING";
 const paymentDirty =
 selectedPaymentStatus !== (booking.paymentStatus || "PENDING");
 const selectedBookingStatus =
 bookingStatusDrafts[booking.id] || booking.rawStatus || "CONFIRMED";
 const bookingStatusDirty =
 selectedBookingStatus !== (booking.rawStatus || "CONFIRMED");

 return (
 <tr key={booking.id}>
 <td>{shortId(booking.id)}</td>
 <td>{booking.user?.name || booking.user?.email || booking.userId || "-"}</td>
 <td>{booking.hotel?.name || "-"}</td>
 <td>{booking.room?.name || booking.roomId || "-"}</td>
 <td>{formatDate(booking.checkInDate)}</td>
 <td>{formatDate(booking.checkOutDate)}</td>
 <td>{currencyFormatter.format(bookingRevenueValue(booking))}</td>
 <td>
 <div className="admin-table-stack">
 <span className={`status-pill ${booking.paymentMeta.className}`}>
 {booking.paymentMeta.label}
 </span>
 <span className="admin-cell-note">
 {paymentMethodLabel(booking.paymentMethod)}
 </span>
 <div className="admin-payment-editor">
 <select
 value={selectedPaymentStatus}
 onChange={(event) =>
 handlePaymentDraftChange(booking.id, event.target.value)
 }
 disabled={paymentUpdatingId === booking.id}
 >
 {paymentStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <button
 type="button"
 className="admin-mini-btn"
 disabled={!paymentDirty || paymentUpdatingId === booking.id}
 onClick={() => handlePaymentStatusUpdate(booking)}
 >
 {paymentUpdatingId === booking.id ? "Dang luu..." : "Lu"}
 </button>
 </div>
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <strong>{booking.couponCode || "-"}</strong>
 {Number(booking.discountAmount || 0) > 0 ? (
 <span className="admin-cell-note">
 -{currencyFormatter.format(Number(booking.discountAmount || 0))}
 </span>
 ) : null}
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <span className="admin-note-cell">
 {formatCellText(booking.note, "Khong co ghi chu")}
 </span>
 {booking.cancellationReason ? (
 <span className="admin-cell-note">
 Ly do huy: {booking.cancellationReason}
 </span>
 ) : null}
 </div>
 </td>
 <td>
 <div className="admin-table-stack">
 <span className={`status-pill ${booking.status.className}`}>
 {booking.status.label}
 </span>
 <div className="admin-payment-editor">
 <select
 value={selectedBookingStatus}
 onChange={(event) =>
 handleBookingStatusDraftChange(booking.id, event.target.value)
 }
 disabled={bookingStatusUpdatingId === booking.id}
 >
 {bookingStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <button
 type="button"
 className="admin-mini-btn"
 disabled={!bookingStatusDirty || bookingStatusUpdatingId === booking.id}
 onClick={() => handleBookingStatusUpdate(booking)}
 >
 {bookingStatusUpdatingId === booking.id ? "Dang luu..." : "Lu"}
 </button>
 </div>
 <input
 type="text"
 className="admin-inline-input"
 value={bookingStatusNotes[booking.id] || ""}
 onChange={(event) =>
 handleBookingStatusNoteChange(booking.id, event.target.value)
 }
 placeholder="Ghi chu check-in/out"
 />
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="admin-empty-state">
 Khong co booking phu hop bo luc payment status hien tai.
 </div>
 )}
 </article>
 </section>
 );

 const renderDisputes = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tranh chap booking</p>
 <h2>Xu ly ticket do nguoi dung gui len he thong</h2>
 </div>
 <span className="panel-badge">{sortedDisputes.length} tranh chap</span>
 </div>

 {sortedDisputes.length ? (
 <div className="admin-dispute-list">
 {sortedDisputes.map((dispute) => {
 const user = userMap[dispute.userId] || null;
 const hotel = hotelMap[dispute.hotelId] || null;
 const room = roomMap[dispute.roomId] || null;
 const disputeMeta = disputeStatusMeta(dispute.status);
 const selectedStatus = disputeStatusDrafts[dispute.id] || dispute.status || "OPEN";
 const noteValue = disputeNotes[dispute.id] ?? dispute.resolutionNote ?? "";
 const statusDirty =
 selectedStatus !== (dispute.status || "OPEN") ||
 noteValue.trim() !== String(dispute.resolutionNote || "").trim();

 return (
 <article key={dispute.id} className="admin-dispute-card">
 <div className="admin-dispute-head">
 <div>
 <p className="panel-tag">Booking {shortId(dispute.bookingId)}</p>
 <h3>{dispute.subject || "Tranh chap booking"}</h3>
 </div>
 <span className={`status-pill ${disputeMeta.className}`}>
 {disputeMeta.label}
 </span>
 </div>

 <div className="admin-hotel-meta">
 <span>User: {user?.name || user?.email || dispute.userId || "-"}</span>
 <span>Hotel: {hotel.name || dispute.hotelId || "-"}</span>
 <span>Room: {room?.name || dispute.roomId || "-"}</span>
 </div>

 <p className="admin-dispute-body">{dispute.description || "-"}</p>

 <div className="admin-form-stack">
 <label className="admin-filter-field">
 <span>Trang thai xu ly</span>
 <select
 value={selectedStatus}
 onChange={(event) =>
 handleDisputeStatusDraftChange(dispute.id, event.target.value)
 }
 disabled={disputeUpdatingId === dispute.id}
 >
 {disputeStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="admin-filter-field">
 <span>Phan hoi admin</span>
 <textarea
 value={noteValue}
 onChange={(event) =>
 handleDisputeNoteChange(dispute.id, event.target.value)
 }
 placeholder="Cap nhat ket qua xu ly cho nguoi dung"
 />
 </label>
 </div>

 <div className="admin-card-actions">
 <span className="admin-cell-note">
 Cap nhat: {formatDateTime(dispute.updatedAt || dispute.createdAt)}
 </span>
 <button
 type="button"
 className="btn-action btn-primary"
 disabled={!statusDirty || disputeUpdatingId === dispute.id}
 onClick={() => handleDisputeUpdate(dispute)}
 >
 {disputeUpdatingId === dispute.id ? "Dang luu..." : "Lu xu ly"}
 </button>
 </div>
 </article>
 );
 })}
 </div>
 ) : (
 <div className="admin-empty-state">Cha co tranh chap nao can xu ly.</div>
 )}
 </article>
 </section>
 );

 const renderLogs = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Audit log</p>
 <h2>Theo doi nhet ky thay doi trong he thong</h2>
 </div>
 <span className="panel-badge">{sortedLogs.length} so kien</span>
 </div>

 {sortedLogs.length ? (
 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>Thoi gian</th>
 <th>Hanh dong</th>
 <th>Thuc the</th>
 <th>Actor</th>
 <th>Noi dung</th>
 </tr>
 </thead>
 <tbody>
 {sortedLogs.map((log) => (
 <tr key={log.id}>
 <td>{formatDateTime(log.createdAt)}</td>
 <td>{log.action || "-"}</td>
 <td>
 {(log.entityType || "-") + " " + shortId(log.entityId)}
 </td>
 <td>{log.actorEmail || log.actorRole || "-"}</td>
 <td>{log.message || "-"}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="admin-empty-state">Chua co nhat ky hoat dong nao.</div>
 )}
 </article>
 </section>
 );

 const renderCoupons = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Quan ly coupon</p>
 <h2>Dieu chinh uu dai va theo doi trang thai ma giam gia</h2>
 </div>
 <span className="panel-badge">{couponSummary.total} coupon</span>
 </div>

 <div className="admin-summary-grid">
 <div className="type-card">
 <h3>Dang hoat dong</h3>
 <p>{couponSummary.active} coupon co the ap dung cho booking moi</p>
 </div>
 <div className="type-card">
 <h3>Da het han</h3>
 <p>{couponSummary.expired} coupon can gia hon hoac tat ?i</p>
 </div>
 <div className="type-card">
 <h3>Tam tat</h3>
 <p>{couponSummary.inactive} coupon dang dong ? che do an</p>
 </div>
 </div>

 <div className="admin-coupon-grid">
 <article className="admin-coupon-editor">
 <h3>{editingCouponId ? "Cap nhat coupon" : "Tao coupon moi"}</h3>
 <p className="admin-account-note">
 Quan ly ma giam gia ngay trong dashboard admin va dong bo truc tiep sang trang
 booking.
 </p>

 <form className="admin-coupon-form" onSubmit={handleCouponSubmit}>
 <label>
 <span>Ma coupon</span>
 <input
 name="code"
 value={couponForm.code}
 onChange={handleCouponFieldChange}
 placeholder="VD: SUMMER15"
 required
 />
 </label>

 <label>
 <span>Mo ta</span>
 <textarea
 name="description"
 value={couponForm.description}
 onChange={handleCouponFieldChange}
 placeholder="Mo ta uu dai ?O user ?O nhan biet"
 rows="3"
 />
 </label>

 <div className="admin-coupon-form-grid">
 <label>
 <span>Loai giam</span>
 <select
 name="discountType"
 value={couponForm.discountType}
 onChange={handleCouponFieldChange}
 >
 <option value="PERCENT">Phan tram</option>
 <option value="FIXED">Tien mat</option>
 </select>
 </label>

 <label>
 <span>Gia tri giam</span>
 <input
 type="number"
 min="0"
 step="1"
 name="discountValue"
 value={couponForm.discountValue}
 onChange={handleCouponFieldChange}
 placeholder="10"
 required
 />
 </label>
 </div>

 <div className="admin-coupon-form-grid">
 <label>
 <span>Don tai thiOu</span>
 <input
 type="number"
 min="0"
 step="1000"
 name="minOrderAmount"
 value={couponForm.minOrderAmount}
 onChange={handleCouponFieldChange}
 />
 </label>

 <label>
 <span>Ngy het han</span>
 <input
 type="date"
 name="expiresAt"
 value={couponForm.expiresAt}
 onChange={handleCouponFieldChange}
 />
 </label>
 </div>

 <label className="admin-checkbox-field">
 <input
 type="checkbox"
 name="active"
 checked={couponForm.active}
 onChange={handleCouponFieldChange}
 />
 <span>Cho phep coupon hoat dong ngay</span>
 </label>

 {couponMessage && (
 <p className={`admin-form-message ${couponMessage.type}`}>
 {couponMessage.text}
 </p>
 )}

 <div className="admin-form-actions">
 <button type="submit" className="admin-save-btn" disabled={couponSaving}>
 {couponSaving
 ? "Dang luu..."
 : editingCouponId
 ? "Cap nhat coupon"
 : "Tao coupon"}
 </button>
 <button
 type="button"
 className="admin-save-btn secondary"
 onClick={resetCouponForm}
 disabled={couponSaving}
 >
 {editingCouponId ? "Bo soa" : "Dat lai form"}
 </button>
 </div>
 </form>
 </article>

 <div className="admin-coupon-list">
 {sortedCoupons.length ? (
 sortedCoupons.map((coupon) => {
 const statusMeta = couponStatusMeta(coupon);

 return (
 <article key={coupon.id || coupon.code} className="coupon-card">
 <div className="coupon-card-head">
 <div>
 <h3>{coupon.code || "COUPON"}</h3>
 <p>{formatCellText(coupon.description, "Cha co mo ta")}</p>
 </div>
 <span className={`status-pill ${statusMeta.className}`}>
 {statusMeta.label}
 </span>
 </div>

 <ul className="coupon-meta-list">
 <li>
 <span>Gia tri giam</span>
 <strong>{formatCouponValue(coupon)}</strong>
 </li>
 <li>
 <span>Don tai thiOu</span>
 <strong>
 {currencyFormatter.format(Number(coupon.minOrderAmount || 0))}
 </strong>
 </li>
 <li>
 <span>Ngy het han</span>
 <strong>
 {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Khong giai han"}
 </strong>
 </li>
 </ul>

 <div className="coupon-card-actions">
 <button
 type="button"
 className="coupon-edit-btn"
 onClick={() => handleCouponEdit(coupon)}
 >
 Chinh sua coupon
 </button>
 <button
 type="button"
 className="coupon-delete-btn"
 onClick={() => handleCouponDeleteRequest(coupon)}
 disabled={couponDeletingId === coupon.id}
 >
 {couponDeletingId === coupon.id ? "Dang xoa..." : "Xoa coupon"}
 </button>
 </div>
 </article>
 );
 })
 ) : (
 <div className="admin-empty-state">Cha co coupon nao trong he thong.</div>
 )}
 </div>
 </div>
 </article>
 </section>
 );

 const renderUsers = () => (
 <section className="admin-view-stack">
 <article className="panel">
 <div className="panel-head">
 <div>
 <p className="panel-tag">Tat c? nguoi dung</p>
 <h2>Phan loai role va theo doi t i khoan</h2>
 </div>
 <span className="panel-badge">{users.length} users</span>
 </div>

 <div className="admin-summary-grid">
 <div className="type-card">
 <h3>Admin</h3>
 <p>{userSummary.admins} t i khoan quan tri</p>
 </div>
 <div className="type-card">
 <h3>User</h3>
 <p>{userSummary.usersNormal} t i khoan khach hang/host</p>
 </div>
 <div className="type-card">
 <h3>Tng so</h3>
 <p>{userSummary.total} nguoi dung tren he thong</p>
 </div>
 </div>

 <div className="table-wrap">
 <table>
 <thead>
 <tr>
 <th>ID</th>
 <th>Ho ten</th>
 <th>Email</th>
 <th>Role</th>
 <th>Gioi tinh</th>
 <th>Ngay sinh</th>
 </tr>
 </thead>
 <tbody>
 {users.map((user) => (
 <tr key={user.id}>
 <td>{shortId(user.id)}</td>
 <td>{user.name || "-"}</td>
 <td>{user.email || "-"}</td>
 <td>{user.role || "-"}</td>
 <td>{user.gender || "-"}</td>
 <td>{user.dateOfBirth || "-"}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </article>
 </section>
 );

 const renderAccount = () => (
 <section className="admin-account-section">
 {accountLoading ? (
 <div className="admin-account-state">dang tai profile admin...</div>
 ) : accountError ? (
 <div className="admin-account-state error">{accountError}</div>
 ) : (
 <div className="admin-account-grid">
 <article className="admin-account-card admin-account-overview">
 <div className="admin-account-hero">
 <span className="admin-account-avatar">{getAvatarText(profileData.name)}</span>
 <div className="admin-account-hero-text">
 <h2>{profileData.name || "Quan tri vien"}</h2>
 <p>{email || "admin@hotelbooking.com"}</p>
 <div className="admin-account-tags">
 <span className="admin-role-pill">{accountSummary.roleLabel}</span>
 <span
 className={`admin-verify-pill ${
 accountSummary.verified ? "verified" : "unverified"
 }`}
 >
 {accountSummary.verificationLabel}
 </span>
 </div>
 </div>
 </div>

 <div className="admin-account-progress">
 <div className="admin-account-progress-head">
 <span>Muc ?O ho n thiOn profile</span>
 <strong>{accountSummary.completionPercent}%</strong>
 </div>
 <div className="admin-account-progress-track">
 <span style={{ width: `${accountSummary.completionPercent}%` }} />
 </div>
 </div>

 <ul className="admin-account-highlights">
 <li>
 <span>ID admin</span>
 <strong>{shortId(accountId)}</strong>
 </li>
 <li>
 <span>CCCD hiOn thO</span>
 <strong>{accountSummary.maskedCitizenId}</strong>
 </li>
 <li>
 <span>Xac thuc email luc</span>
 <strong>{accountSummary.verificationTime}</strong>
 </li>
 </ul>
 </article>

 <article className="admin-account-card">
 <h2>Thong tin ca nhan admin</h2>
 <p className="admin-account-note">
 Cap nhat thong tin chuan ?O profile admin hiOn thO giong t i khoan that.
 </p>

 <form className="admin-account-form" onSubmit={handleProfileSave}>
 <label>
 <span>Ho ten</span>
 <input
 name="name"
 value={profileData.name}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, name: event.target.value }))
 }
 placeholder="Nhap ho ten"
 required
 />
 </label>

 <label>
 <span>Gioi tinh</span>
 <select
 name="gender"
 value={profileData.gender}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, gender: event.target.value }))
 }
 >
 <option value="">Chan gioi tinh</option>
 <option value="Nam">Nam</option>
 <option value="Nu">Nu</option>
 <option value="Khac">Khac</option>
 </select>
 </label>

 <label>
 <span>Ngy sinh</span>
 <input
 type="date"
 name="dateOfBirth
 value={profileData.dateOfBirth}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, dateOfBirth: event.target.value }))
 }
 />
 </label>

 <label>
 <span>Can cuoc cong dan</span>
 <input
 name="citizenId
 value={profileData.citizenId}
 onChange={(event) =>
 setProfileData((prev) => ({ ...prev, citizenId: event.target.value }))
 }
 placeholder="So CCCD"
 />
 </label>

 {profileMessage && (
 <p className={`admin-form-message ${profileMessage.type}`}>
 {profileMessage.text}
 </p>
 )}

 <button type="submit" className="admin-save-btn" disabled={profileSaving}>
 {profileSaving ? "Dang luu..." : "Lu profile"}
 </button>
 </form>
 </article>

 <article className="admin-account-card">
 <h2>Cai dat email dang nhap</h2>
 <p className="admin-account-note">
 Email nay ?uoc dung ?O dang nhap va nhan link dat lai mat khau.
 </p>

 <form className="admin-account-form" onSubmit={handleEmailSave}>
 <label>
 <span>Email</span>
 <input
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 placeholder="admin@email.com"
 required
 />
 </label>

 {emailMessage && (
 <p className={`admin-form-message ${emailMessage.type}`}>
 {emailMessage.text}
 </p>
 )}

 <button
 type="submit"
 className="admin-save-btn secondary"
 disabled={emailSaving}
 >
 {emailSaving ? "Dang cap nhet..." : "Cap nhat email"}
 </button>
 </form>

 <ul className="admin-info-list">
 <li>
 <span>Role hien tai</span>
 <strong>{accountSummary.roleLabel}</strong>
 </li>
 <li>
 <span>ID admin</span>
 <strong>{shortId(accountId)}</strong>
 </li>
 <li>
 <span>Trang thai email</span>
 <strong>{accountSummary.verificationLabel}</strong>
 </li>
 <li>
 <span>Tng doanh thO he thong</span>
 <strong>{currencyFormatter.format(dashboard.totalRevenue || 0)}</strong>
 </li>
 </ul>
 </article>
 </div>
 )}
 </section>
 );

 const renderMainContent = () => {
 if (loading) {
 return <div className="admin-loading-state">Dang tai du lieu dashboard...</div>;
 }

 if (error) {
 return (
 <div className="admin-error-state">
 <p>{error}</p>
 <button type="button" className="btn-action btn-primary" onClick={() => loadDashboardData()}>
 Thu tai lai
 </button>
 </div>
 );
 }

 if (activeView === "hotels") {
 return renderHotels();
 }

 if (activeView === "bookings") {
 return renderBookings();
 }

 if (activeView === "users") {
 return renderUsers();
 }

 if (activeView === "coupons") {
 return renderCoupons();
 }

 if (activeView === "disputes") {
 return renderDisputes();
 }

 if (activeView === "logs") {
 return renderLogs();
 }

 if (activeView === "account") {
 return renderAccount();
 }

 return renderOverview();
 };

 return (
 <main className="admin-dashboard">
 {sidebarOpen && <button type="button" className="admin-overlay" onClick={() => setSidebarOpen(false)} />}
 <ConfirmDialog
 open={Boolean(confirmDialog)}
 title={confirmDialog?.title || ""}
 description={confirmDialog?.description || ""}
 confirmLabel={confirmDialog?.confirmLabel || "Xac nhan"}
 loading={Boolean(couponDeletingId)}
 onClose={closeConfirmDialog}
 onConfirm={handleConfirmDialogAction}
 />

 <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
 <div className="sidebar-brand">
 <div className="brand-mark">HB</div>
 <div className="brand-meta">
 <strong>Hotel Booking</strong>
 <span>Admin Control Center</span>
 </div>
 <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)}>
 Dang
 </button>
 </div>

 <button
 type="button"
 className={`sidebar-overview ${activeView === "overview" ? "active" : ""}`}
 onClick={() => openView("overview")}
 >
 Tng quan
 </button>

 <div className="sidebar-section">
 <button
 type="button"
 className="section-toggle"
 onClick={() =>
 setSectionOpen((prev) => ({ ...prev, management: !prev.management }))
 }
 >
 <span>Quan ly ?O lieu</span>
 <span className={`section-caret ${sectionOpen.management ? "open" : ""}`}>
 v
 </span>
 </button>

 {sectionOpen.management && (
 <ul className="section-submenu">
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "hotels" ? "active" : ""}`}
 onClick={() => openView("hotels")}
 >
 Hotels
 </button>
 </li>
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "bookings" ? "active" : ""}`}
 onClick={() => openView("bookings")}
 >
 Bookings
 </button>
 </li>
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "users" ? "active" : ""}`}
 onClick={() => openView("users")}
 >
 Users
 </button>
 </li>
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "coupons" ? "active" : ""}`}
 onClick={() => openView("coupons")}
 >
 Coupons
 </button>
 </li>
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "disputes" ? "active" : ""}`}
 onClick={() => openView("disputes")}
 >
 Disputes
 </button>
 </li>
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "logs" ? "active" : ""}`}
 onClick={() => openView("logs")}
 >
 Audit logs
 </button>
 </li>
 </ul>
 )}
 </div>

 <div className="sidebar-section">
 <button
 type="button"
 className="section-toggle"
 onClick={() =>
 setSectionOpen((prev) => ({ ...prev, account: !prev.account }))
 }
 >
 <span>T i khoan</span>
 <span className={`section-caret ${sectionOpen.account ? "open" : ""}`}>v</span>
 </button>

 {sectionOpen.account && (
 <ul className="section-submenu">
 <li>
 <button
 type="button"
 className={`submenu-btn ${activeView === "account" ? "active" : ""}`}
 onClick={() => openView("account")}
 >
 Profile admin
 </button>
 </li>
 </ul>
 )}
 </div>

 <div className="admin-link-group">
 <p className="admin-link-title">Quick Links</p>
 <button type="button" className="admin-link-btn" onClick={() => navigate("/")}>
 V? trang chu
 </button>
 <button type="button" className="admin-link-btn" onClick={() => navigate("/hotels")}>
 Xem website
 </button>
 <button type="button" className="admin-link-btn active" onClick={handleLogout}>
 Dang xuat
 </button>
 </div>
 </aside>

 <section className="admin-main">
 <header className="admin-topbar">
 <div className="topbar-left">
 <button
 type="button"
 className="sidebar-toggle"
 onClick={() => setSidebarOpen((prev) => !prev)}
 >
 Menu
 </button>
 <div>
 <h1>{viewMeta.title}</h1>
 <p>{viewMeta.subtitle}</p>
 </div>
 </div>

 <div className="topbar-right">
 <button
 type="button"
 className="btn-action btn-soft"
 onClick={() => loadDashboardData(true)}
 disabled={refreshing}
 >
 {refreshing ? "Dang lam moi..." : "Lam moi ?O lieu"}
 </button>

 <button
 type="button"
 className="btn-action btn-primary"
 onClick={() => navigate("/host")}
 >
 Quan ly dang phong
 </button>

 <div className="profile-box" ref={profileRef}>
 <button
 type="button"
 className="profile-trigger"
 onClick={() => setProfileOpen((prev) => !prev)}
 >
 <span className="profile-avatar">{getAvatarText(profileData.name)}</span>
 <span className="profile-text">
 <strong>{profileData.name || "Admin"}</strong>
 <small>{email || "admin@hotelbooking.com"}</small>
 </span>
 <span className={`profile-arrow ${profileOpen ? "open" : ""}`}>v</span>
 </button>

 {profileOpen && (
 <div className="profile-dropdown">
 <div className="dropdown-head">
 <span className="dropdown-avatar">{getAvatarText(profileData.name)}</span>
 <div>
 <strong>{profileData.name || "Administrator"}</strong>
 <small>{email || "-"}</small>
 </div>
 </div>
 <button type="button" className="dropdown-item" onClick={() => openView("account")}>
 Profile admin
 </button>
 <button type="button" className="dropdown-item" onClick={() => openView("coupons")}>
 Quan ly coupon
 </button>
 <button type="button" className="dropdown-item" onClick={() => navigate("/host")}>
 Quan ly dang phong
 </button>
 <button type="button" className="dropdown-item" onClick={() => navigate("/")}>
 V? trang chu
 </button>
 <button type="button" className="dropdown-item danger" onClick={handleLogout}>
 Dang xuat
 </button>
 </div>
 )}
 </div>
 </div>
 </header>

 {renderMainContent()}
 </section>
 </main>
 );
}

export default AdminDashboard;



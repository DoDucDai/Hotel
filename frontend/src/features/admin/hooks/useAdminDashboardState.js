import { useCallback, useEffect, useState } from "react";
import { getMyAccount } from "../../../services/accountService";
import {
 getAdminDisputes,
 getAdminBookings,
 getAdminCoupons,
 getAdminDashboard,
 getAdminHotelsAll,
 getAdminLogs,
 getAdminRooms,
 getAdminUsers,
} from "../../../services/adminService";
import { getMyHostRooms } from "../../../services/hostService";
import {
 currencyFormatter,
 numberFormatter,
 accountInitialState,
 accountMetaInitialState,
 couponInitialState,
 adminUserInitialState,
 adminUserRoleOptions,
 paymentStatusOptions,
 paymentStatusFilterOptions,
 bookingStatusOptions,
 hotelApprovalOptions,
 disputeStatusOptions,
 bookingStayStatusOptions,
 normalizeHotels,
 normalizeRooms,
 normalizeBookings,
 normalizeUsers,
 normalizeCoupons,
 normalizeDisputes,
 normalizeLogs,
 formatDate,
 formatDateTime,
 bookingRevenueValue,
 paymentStatusMeta,
 hotelApprovalMeta,
 disputeStatusMeta,
 paymentMethodLabel,
 couponStatusMeta,
 formatCouponValue,
 formatCellText,
 shortId,
 getAvatarText,
} from "../adminDashboardUtils";
import useAdminDashboardActions from "./useAdminDashboardActions";
import useAdminDashboardDerivedData from "./useAdminDashboardDerivedData";

export default function useAdminDashboardState({ navigate, toast, profileRef }) {
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
 const [emailOtp, setEmailOtp] = useState("");
 const [emailOtpSent, setEmailOtpSent] = useState(false);
 const [emailOtpTarget, setEmailOtpTarget] = useState("");
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
 const [userForm, setUserForm] = useState(adminUserInitialState);
 const [editingUserId, setEditingUserId] = useState(null);
 const [userSaving, setUserSaving] = useState(false);
 const [userDeletingId, setUserDeletingId] = useState(null);
 const [userMessage, setUserMessage] = useState(null);
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
 }, [profileRef]);

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
 ] = await Promise.all([
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
 setError("Không thể tai dữ liệu dashboard. Vui lòng thử lại.");
 toast.error("Không thể tai dữ liệu dashboard");
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
 setEmailOtp("");
 setEmailOtpSent(false);
 setEmailOtpTarget("");
 setAccountMeta({
 id: user.id || "",
 role: user.role || localStorage.getItem("role") || "ADMIN",
 emailVerified: Boolean(user.emailVerified),
 emailVerifiedAt: user.emailVerifiedAt || "",
 });
 } catch (loadError) {
 console.error("Cannot load admin account", loadError);
 setAccountError("Không thể tai thông tin tài khoản admin.");
 } finally {
 setAccountLoading(false);
 }
 }, []);

 useEffect(() => {
 loadDashboardData();
 loadMyAccount();
 }, [loadDashboardData, loadMyAccount]);

 const {
 viewMeta,
 roomMap,
 hotelMap,
 userMap,
 bookingsWithMeta,
 sortedBookings,
 overviewStatus,
 monthlyRevenue,
 hotelCards,
 occupancyRows,
 hotelCityOptions,
 filteredHotelCards,
 hotelCardTotalPages,
 pagedHotelCards,
 hotelCardPaginationPages,
 topFilteredHotel,
 citySummary,
 userSummary,
 accountId,
 accountSummary,
 averageRoomPrice,
 topBarMax,
 sortedCoupons,
 couponSummary,
 paymentSummary,
 filteredBookings,
 sortedDisputes,
 sortedLogs,
 } = useAdminDashboardDerivedData({
 activeView,
 rooms,
 hotels,
 users,
 bookings,
 coupons,
 disputes,
 logs,
 hotelFilters,
 hotelCardPage,
 bookingFilters,
 accountMeta,
 email,
 profileData,
 });

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

 const {
 openView,
 handleHotelFilterChange,
 handleBookingFilterChange,
 resetHotelFilters,
 resetBookingFilters,
 handleLogout,
 handleProfileSave,
 handleEmailInputChange,
 handleEmailOtpChange,
 handleEmailSave,
 handleVerifyEmailOtp,
 handleCouponFieldChange,
 resetCouponForm,
 closeConfirmDialog,
 handleCouponDeleteRequest,
 handleConfirmDialogAction,
 handleCouponEdit,
 handleCouponSubmit,
 handleUserFieldChange,
 resetUserForm,
 handleUserEdit,
 handleUserSubmit,
 handleUserDeleteRequest,
 handlePaymentDraftChange,
 handleBookingStatusDraftChange,
 handleBookingStatusNoteChange,
 handleHotelApprovalDraftChange,
 handleHotelApprovalNoteChange,
 handleDisputeStatusDraftChange,
 handleDisputeNoteChange,
 handlePaymentStatusUpdate,
 handleBookingStatusUpdate,
 handleHotelApprovalUpdate,
 handleDisputeUpdate,
 } = useAdminDashboardActions({
 navigate,
 toast,
 setActiveView,
 setSidebarOpen,
 setHotelFilters,
 setHotelCardPage,
 setBookingFilters,
 setProfileSaving,
 setProfileMessage,
 profileData,
 setProfileData,
 setEmail,
 email,
 setEmailOtp,
 emailOtp,
 emailOtpSent,
 setEmailOtpSent,
 emailOtpTarget,
 setEmailOtpTarget,
 setAccountMeta,
 setEmailSaving,
 setEmailMessage,
 setCouponForm,
 setEditingCouponId,
 setCouponMessage,
 couponDeletingId,
 setConfirmDialog,
 setCouponDeletingId,
 setCoupons,
 setUsers,
 editingCouponId,
 confirmDialog,
 couponForm,
 setCouponSaving,
 userForm,
 setUserForm,
 editingUserId,
 setEditingUserId,
 setUserSaving,
 userDeletingId,
 setUserDeletingId,
 setUserMessage,
 setPaymentDrafts,
 setBookingStatusDrafts,
 setBookingStatusNotes,
 setHotelApprovalDrafts,
 setHotelApprovalNotes,
 setDisputeStatusDrafts,
 setDisputeNotes,
 paymentDrafts,
 setPaymentUpdatingId,
 setBookings,
 bookingStatusDrafts,
 bookingStatusNotes,
 setBookingStatusUpdatingId,
 hotelApprovalDrafts,
 hotelApprovalNotes,
 setHotelApprovalUpdatingId,
 setHotels,
 disputeStatusDrafts,
 disputeNotes,
 setDisputeUpdatingId,
 setDisputes,
 });

 return {
 sidebarOpen,
 setSidebarOpen,
 profileOpen,
 setProfileOpen,
 activeView,
 setActiveView,
 sectionOpen,
 setSectionOpen,
 loading,
 refreshing,
 error,
 dashboard,
 users,
 hotels,
 rooms,
 bookings,
 coupons,
 disputes,
 logs,
 accountLoading,
 accountError,
 profileData,
 setProfileData,
 email,
 emailOtp,
 emailOtpSent,
 accountMeta,
 profileSaving,
 emailSaving,
 profileMessage,
 emailMessage,
 couponForm,
 setCouponForm,
 editingCouponId,
 couponSaving,
 couponDeletingId,
 couponMessage,
 userForm,
 setUserForm,
 editingUserId,
 userSaving,
 userDeletingId,
 userMessage,
 confirmDialog,
 bookingFilters,
 paymentDrafts,
 paymentUpdatingId,
 bookingStatusDrafts,
 bookingStatusNotes,
 bookingStatusUpdatingId,
 hotelApprovalDrafts,
 hotelApprovalNotes,
 hotelApprovalUpdatingId,
 disputeStatusDrafts,
 disputeNotes,
 disputeUpdatingId,
 hotelFilters,
 hotelCardPage,
 setHotelCardPage,
 viewMeta,
 roomMap,
 hotelMap,
 userMap,
 bookingsWithMeta,
 sortedBookings,
 overviewStatus,
 monthlyRevenue,
 hotelCards,
 occupancyRows,
 hotelCityOptions,
 filteredHotelCards,
 hotelCardTotalPages,
 pagedHotelCards,
 hotelCardPaginationPages,
 topFilteredHotel,
 citySummary,
 userSummary,
 accountId,
 accountSummary,
 averageRoomPrice,
 topBarMax,
 sortedCoupons,
 couponSummary,
 paymentSummary,
 filteredBookings,
 sortedDisputes,
 sortedLogs,
 openView,
 handleHotelFilterChange,
 handleBookingFilterChange,
 resetHotelFilters,
 resetBookingFilters,
 handleLogout,
 handleProfileSave,
 handleEmailInputChange,
 handleEmailOtpChange,
 handleEmailSave,
 handleVerifyEmailOtp,
 handleCouponFieldChange,
 resetCouponForm,
 closeConfirmDialog,
 handleCouponDeleteRequest,
 handleConfirmDialogAction,
 handleCouponEdit,
 handleCouponSubmit,
 handleUserFieldChange,
 resetUserForm,
 handleUserEdit,
 handleUserSubmit,
 handleUserDeleteRequest,
 handlePaymentDraftChange,
 handleBookingStatusDraftChange,
 handleBookingStatusNoteChange,
 handleHotelApprovalDraftChange,
 handleHotelApprovalNoteChange,
 handleDisputeStatusDraftChange,
 handleDisputeNoteChange,
 handlePaymentStatusUpdate,
 handleBookingStatusUpdate,
 handleHotelApprovalUpdate,
 handleDisputeUpdate,
 loadDashboardData,
 currencyFormatter,
 numberFormatter,
 paymentStatusOptions,
 paymentStatusFilterOptions,
 bookingStatusOptions,
 hotelApprovalOptions,
 disputeStatusOptions,
 bookingStayStatusOptions,
 formatDate,
 formatDateTime,
 bookingRevenueValue,
 paymentStatusMeta,
 hotelApprovalMeta,
 disputeStatusMeta,
 paymentMethodLabel,
 couponStatusMeta,
 formatCouponValue,
 formatCellText,
 shortId,
 getAvatarText,
 adminUserRoleOptions,
 };
}



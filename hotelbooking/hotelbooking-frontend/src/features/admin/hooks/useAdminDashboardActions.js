import { updateMyEmail, updateMyProfile } from "../../../services/accountService";
import {
 createAdminCoupon,
 deleteAdminCoupon,
 updateAdminBookingPaymentStatus,
 updateAdminBookingStatus,
 updateAdminCoupon,
 updateAdminDisputeStatus,
 updateAdminHotelApproval,
} from "../../../services/adminService";
import {
 couponInitialState,
 paymentStatusMeta,
 toCouponFormState,
} from "../adminDashboardUtils";

export default function useAdminDashboardActions({
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
 editingCouponId,
 confirmDialog,
 couponForm,
 setCouponSaving,
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
}) {
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
 "Cap nhat profile that bai. Vui long thu lai.";
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
 "Cap nhat email that bai. Vui long thu lai.";
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
 toast.error("Coupon nay chua san sang de xoa.");
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
 toast.success("Da xoa coupon thanh cong.");
 } catch (deleteError) {
 console.error("Cannot delete coupon", deleteError);
 const responseMessage =
 typeof deleteError?.response?.data === "string"
 ? deleteError.response.data
 : deleteError?.response?.data?.message;
 toast.error(responseMessage || "Khong the xoa coupon. Vui long thu lai.");
 } finally {
 setCouponDeletingId(null);
 }
 };

 const handleCouponDeleteRequest = (coupon) => {
 if (!coupon?.id) {
 toast.error("Coupon nay chua san sang de xoa.");
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
 ? "Da cap nhat coupon thanh cong."
 : "Da tao coupon moi thanh cong.";

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
 const message = responseMessage || "Khong the luu coupon. Vui long thu lai.";
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
 toast.success(`Da cap nhat payment status: ${paymentStatusMeta(nextStatus).label}.`);
 } catch (updateError) {
 console.error("Cannot update payment status", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(
 responseMessage || "Khong the cap nhat payment status. Vui long thu lai."
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
 toast.error(responseMessage || "Khong the cap nhat trang thai booking.");
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
 toast.error(responseMessage || "Khong the cap nhat trang thai hotel.");
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
 toast.error(responseMessage || "Khong the cap nhat tranh chap.");
 } finally {
 setDisputeUpdatingId(null);
 }
 };

 return {
 openView,
 handleHotelFilterChange,
 handleBookingFilterChange,
 resetHotelFilters,
 resetBookingFilters,
 handleLogout,
 handleProfileSave,
 handleEmailSave,
 handleCouponFieldChange,
 resetCouponForm,
 closeConfirmDialog,
 handleCouponDeleteRequest,
 handleConfirmDialogAction,
 handleCouponEdit,
 handleCouponSubmit,
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
 };
}

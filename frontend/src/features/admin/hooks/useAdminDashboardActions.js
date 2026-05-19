import {
 requestMyEmailChangeOtp,
 updateMyProfile,
 verifyMyEmailChangeOtp,
} from "../../../services/accountService";
import {
 createAdminCoupon,
 createAdminUser,
 deleteAdminCoupon,
 deleteAdminUser,
 updateAdminBookingPaymentStatus,
 updateAdminBookingStatus,
 updateAdminCoupon,
 updateAdminDisputeStatus,
 updateAdminHotelApproval,
 updateAdminUser,
} from "../../../services/adminService";
import {
 adminUserInitialState,
 couponInitialState,
 paymentStatusMeta,
 toAdminUserFormState,
 toCouponFormState,
} from "../adminDashboardUtils";

const normalizeEmailValue = (value) => String(value || "").trim().toLowerCase();

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
}) {
 const openView = (view) => {
 const normalizedView = String(view || "").trim();
 if (!normalizedView) {
 return;
 }

 setActiveView(normalizedView);
 setSidebarOpen(false);
 navigate(`/admin?view=${encodeURIComponent(normalizedView)}`, { replace: true });
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

 setProfileMessage({ type: "success", text: "Đã cập nhật profile admin." });
 toast.success("Đã cập nhật profile admin");
 } catch (saveError) {
 console.error("Cannot save admin profile", saveError);
 const message =
 saveError?.response?.data?.message ||
 "Cập nhật profile thất bại. Vui lòng thử lại.";
 setProfileMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setProfileSaving(false);
 }
 };

 const handleEmailInputChange = (nextEmail) => {
 const normalizedEmail = normalizeEmailValue(nextEmail);
 setEmail(nextEmail);
 setEmailMessage(null);

 if (emailOtpSent && normalizeEmailValue(emailOtpTarget) !== normalizedEmail) {
 setEmailOtp("");
 setEmailOtpSent(false);
 setEmailOtpTarget("");
 }
 };

 const handleEmailOtpChange = (nextOtp) => {
 const normalizedOtp = String(nextOtp || "").replace(/\D/g, "").slice(0, 6);
 setEmailOtp(normalizedOtp);
 setEmailMessage(null);
 };

 const handleEmailSave = async (event) => {
 event.preventDefault();
 const targetEmail = normalizeEmailValue(email);

 if (!targetEmail) {
 toast.error("Vui lòng nhập email mới");
 return;
 }

 setEmailSaving(true);
 setEmailMessage(null);

 try {
 const res = await requestMyEmailChangeOtp(targetEmail);
 const message = res?.data?.message || "Đã gửi OTP xác nhận đổi email admin";

 setEmailOtpSent(true);
 setEmailOtpTarget(targetEmail);
 setEmailOtp("");
 setEmailMessage({ type: "success", text: message });
 toast.success(message);
 } catch (saveError) {
 console.error("Cannot request admin email OTP", saveError);
 const message =
 saveError?.response?.data?.message ||
 "Không thể gửi OTP đổi email. Vui lòng thử lại.";
 setEmailMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setEmailSaving(false);
 }
 };

 const handleVerifyEmailOtp = async () => {
 const targetEmail = normalizeEmailValue(email);
 const otp = String(emailOtp || "").trim();

 if (!targetEmail) {
 toast.error("Vui lòng nhập email mới");
 return;
 }

 if (!emailOtpSent || normalizeEmailValue(emailOtpTarget) !== targetEmail) {
 toast.error("Vui lòng gửi OTP cho email hiện tại trước");
 return;
 }

 if (!/^\d{6}$/.test(otp)) {
 toast.error("Mã OTP phải gồm đúng 6 chữ số");
 return;
 }

 setEmailSaving(true);
 setEmailMessage(null);

 try {
 const res = await verifyMyEmailChangeOtp(targetEmail, otp);
 const data = res?.data || {};
 const user = data.user || {};

 if (data.accessToken) {
 localStorage.setItem("accessToken", data.accessToken);
 }

 if (data.role) {
 localStorage.setItem("role", data.role);
 }

 setEmail(user.email || targetEmail);
 setEmailOtp("");
 setEmailOtpSent(false);
 setEmailOtpTarget("");
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

 const message = data?.message || "Đã cập nhật email admin thành công.";
 setEmailMessage({ type: "success", text: message });
 toast.success(message);
 } catch (saveError) {
 console.error("Cannot verify admin email OTP", saveError);
 const message =
 saveError?.response?.data?.message ||
 "Xác nhận OTP thất bại. Vui lòng thử lại.";
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
 if (couponDeletingId || userDeletingId) {
 return;
 }

 setConfirmDialog(null);
 };

 const performCouponDelete = async (coupon) => {
 if (!coupon?.id) {
 toast.error("Coupon này chưa sẵn sàng để xóa.");
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
 toast.success("Đã xóa coupon thành công.");
 } catch (deleteError) {
 console.error("Cannot delete coupon", deleteError);
 const responseMessage =
 typeof deleteError?.response?.data === "string"
 ? deleteError.response.data
 : deleteError?.response?.data?.message;
 toast.error(responseMessage || "Không thể xóa coupon. Vui lòng thử lại.");
 } finally {
 setCouponDeletingId(null);
 }
 };

 const handleCouponDeleteRequest = (coupon) => {
 if (!coupon?.id) {
 toast.error("Coupon này chưa sẵn sàng để xóa.");
 return;
 }

 setConfirmDialog({
 type: "delete-coupon",
 title: "Xóa coupon này?",
 description: `Coupon ${coupon.code || ""} sẽ bị xóa khỏi hệ thống và không còn hiển thị ở trang booking.`,
 confirmLabel: "Xóa coupon",
 coupon,
 });
 };

 const handleConfirmDialogAction = async () => {
 if (!confirmDialog) {
 return;
 }

 if (confirmDialog.type === "delete-coupon") {
 await performCouponDelete(confirmDialog.coupon);
 return;
 }

 if (confirmDialog.type === "delete-user") {
 await performUserDelete(confirmDialog.user);
 }
 };

 const handleCouponEdit = (coupon) => {
 setCouponForm(toCouponFormState(coupon));
 setEditingCouponId(coupon?.id || null);
 setCouponMessage(null);
 openView("coupons");
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
 ? "Đã cập nhật coupon thành công."
 : "Đã tạo coupon mới thành công.";

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
 const message = responseMessage || "Không thể lưu coupon. Vui lòng thử lại.";
 setCouponMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setCouponSaving(false);
 }
 };

 const handleUserFieldChange = (event) => {
 const { name, value } = event.target;
 setUserForm((prev) => ({
 ...prev,
 [name]: value,
 }));
 };

 const resetUserForm = () => {
 setUserForm({ ...adminUserInitialState });
 setEditingUserId(null);
 setUserMessage(null);
 };

 const handleUserEdit = (user) => {
 setUserForm(toAdminUserFormState(user));
 setEditingUserId(user?.id || null);
 setUserMessage(null);
 openView("users");
 };

 const performUserDelete = async (user) => {
 if (!user?.id) {
 toast.error("User này chưa sẵn sàng để xóa.");
 return;
 }

 setUserDeletingId(user.id);
 setUserMessage(null);

 try {
 await deleteAdminUser(user.id);
 setUsers((prev) => prev.filter((item) => item.id !== user.id));

 if (editingUserId === user.id) {
 resetUserForm();
 }

 setConfirmDialog(null);
 toast.success("Đã xóa user thành công.");
 } catch (deleteError) {
 console.error("Cannot delete user", deleteError);
 const responseMessage =
 typeof deleteError?.response?.data === "string"
 ? deleteError.response.data
 : deleteError?.response?.data?.message;
 toast.error(responseMessage || "Không thể xóa user. Vui lòng thử lại.");
 } finally {
 setUserDeletingId(null);
 }
 };

 const handleUserDeleteRequest = (user) => {
 if (!user?.id) {
 toast.error("User này chưa sẵn sàng để xóa.");
 return;
 }

 setConfirmDialog({
 type: "delete-user",
 title: "Xóa user này?",
 description: `Tài khoản ${user.email || user.id} sẽ bị xóa khỏi hệ thống.`,
 confirmLabel: "Xóa user",
 user,
 });
 };

 const handleUserSubmit = async (event) => {
 event.preventDefault();
 setUserSaving(true);
 setUserMessage(null);

 const payload = {
 name: userForm.name.trim(),
 email: userForm.email.trim().toLowerCase(),
 role: userForm.role || "USER",
 gender: userForm.gender.trim() || null,
 dateOfBirth: userForm.dateOfBirth.trim() || null,
 citizenId: userForm.citizenId.trim() || null,
 };

 const rawPassword = userForm.password.trim();
 if (!editingUserId) {
 if (!rawPassword) {
 setUserMessage({ type: "error", text: "Mật khẩu là bắt buộc khi tạo user." });
 toast.error("Mật khẩu là bắt buộc khi tạo user");
 setUserSaving(false);
 return;
 }
 payload.password = rawPassword;
 } else if (rawPassword) {
 payload.password = rawPassword;
 }

 try {
 const res = editingUserId
 ? await updateAdminUser(editingUserId, payload)
 : await createAdminUser(payload);
 const savedUser = res?.data;

 setUsers((prev) => {
 const nextUsers = editingUserId
 ? prev.map((item) => (item.id === savedUser?.id ? savedUser : item))
 : [savedUser, ...prev];

 const seen = new Set();
 return nextUsers.filter((item) => {
 const key = item?.id || item?.email;
 if (!key || seen.has(key)) {
 return false;
 }
 seen.add(key);
 return true;
 });
 });

 const successMessage = editingUserId
 ? "Đã cập nhật user thành công."
 : "Đã tạo user mới thành công.";
 setUserMessage({ type: "success", text: successMessage });
 toast.success(successMessage);
 setUserForm({ ...adminUserInitialState });
 setEditingUserId(null);
 } catch (saveError) {
 console.error("Cannot save user", saveError);
 const responseMessage =
 typeof saveError?.response?.data === "string"
 ? saveError.response.data
 : saveError?.response?.data?.message;
 const message = responseMessage || "Không thể lưu user. Vui lòng thử lại.";
 setUserMessage({ type: "error", text: message });
 toast.error(message);
 } finally {
 setUserSaving(false);
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
 toast.success(`Đã cập nhật payment status: ${paymentStatusMeta(nextStatus).label}.`);
 } catch (updateError) {
 console.error("Cannot update payment status", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(
 responseMessage || "Không thể cập nhật payment status. Vui lòng thử lại."
 );
 } finally {
 setPaymentUpdatingId(null);
 }
 };

 const handleBookingStatusUpdate = async (booking) => {
 const nextStatus = bookingStatusDrafts[booking.id] || booking.rawStatus || "CONFIRMED";
 const currentStatus = booking.rawStatus || "CONFIRMED";
 const nextNote = (bookingStatusNotes[booking.id] ?? booking.note ?? "").trim();
 const currentNote = (booking.note || "").trim();

 if (!booking?.id || (nextStatus === currentStatus && nextNote === currentNote)) {
 return;
 }

 setBookingStatusUpdatingId(booking.id);

 try {
 const res = await updateAdminBookingStatus(booking.id, {
 status: nextStatus,
 note: nextNote,
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
 toast.success("Đã cập nhật trạng thái booking");
 } catch (updateError) {
 console.error("Cannot update booking status", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Không thể cập nhật trạng thái booking.");
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
 toast.success("Đã cập nhật trạng thái duyệt hotel");
 } catch (updateError) {
 console.error("Cannot update hotel approval", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Không thể cập nhật trạng thái hotel.");
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
 toast.success("Đã cập nhật tranh chấp");
 } catch (updateError) {
 console.error("Cannot update dispute", updateError);
 const responseMessage =
 typeof updateError?.response?.data === "string"
 ? updateError.response.data
 : updateError?.response?.data?.message;
 toast.error(responseMessage || "Không thể cập nhật tranh chấp.");
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
 };
}



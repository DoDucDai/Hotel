import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import "./AdminDashboard.css";
import useAdminDashboardState from "../features/admin/hooks/useAdminDashboardState";
import AccountView from "../features/admin/views/AccountView";
import BookingsView from "../features/admin/views/BookingsView";
import CouponsView from "../features/admin/views/CouponsView";
import DisputesView from "../features/admin/views/DisputesView";
import HotelsView from "../features/admin/views/HotelsView";
import LogsView from "../features/admin/views/LogsView";
import OverviewView from "../features/admin/views/OverviewView";
import UsersView from "../features/admin/views/UsersView";

function AdminDashboard() {
 const navigate = useNavigate();
 const location = useLocation();
 const toast = useToast();
 const profileRef = useRef(null);

 const {
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
 rooms,
 bookings,
 accountLoading,
 accountError,
 profileData,
 setProfileData,
 email,
 emailOtp,
 emailOtpSent,
 profileSaving,
 emailSaving,
 profileMessage,
 emailMessage,
 couponForm,
 editingCouponId,
 couponSaving,
 couponDeletingId,
 couponMessage,
 userForm,
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
 hotelApprovalMeta,
 disputeStatusMeta,
 paymentMethodLabel,
 couponStatusMeta,
 formatCouponValue,
 formatCellText,
 shortId,
 getAvatarText,
 adminUserRoleOptions,
 } = useAdminDashboardState({ navigate, toast, profileRef });

 useEffect(() => {
 const requestedView = new URLSearchParams(location.search).get("view");
 const allowedViews = [
 "overview",
 "hotels",
 "bookings",
 "users",
 "coupons",
 "disputes",
 "logs",
 "account",
 ];

 if (!requestedView || !allowedViews.includes(requestedView)) {
 return;
 }

 setActiveView(requestedView);
 }, [location.search, setActiveView]);

 const renderOverview = () => (
 <OverviewView
 numberFormatter={numberFormatter}
 dashboard={dashboard}
 userSummary={userSummary}
 citySummary={citySummary}
 currencyFormatter={currencyFormatter}
 averageRoomPrice={averageRoomPrice}
 overviewStatus={overviewStatus}
 monthlyRevenue={monthlyRevenue}
 topBarMax={topBarMax}
 occupancyRows={occupancyRows}
 sortedBookings={sortedBookings}
 shortId={shortId}
 formatDate={formatDate}
 bookingRevenueValue={bookingRevenueValue}
 paymentSummary={paymentSummary}
 couponSummary={couponSummary}
 openView={openView}
 />
 );
 const renderHotels = () => (
 <HotelsView
 hotelCardPage={hotelCardPage}
 hotelCardTotalPages={hotelCardTotalPages}
 filteredHotelCards={filteredHotelCards}
 hotelCards={hotelCards}
 hotelFilters={hotelFilters}
 handleHotelFilterChange={handleHotelFilterChange}
 hotelCityOptions={hotelCityOptions}
 resetHotelFilters={resetHotelFilters}
 numberFormatter={numberFormatter}
 rooms={rooms}
 bookings={bookings}
 topFilteredHotel={topFilteredHotel}
 pagedHotelCards={pagedHotelCards}
 hotelApprovalMeta={hotelApprovalMeta}
 hotelApprovalDrafts={hotelApprovalDrafts}
 hotelApprovalNotes={hotelApprovalNotes}
 hotelApprovalOptions={hotelApprovalOptions}
 hotelApprovalUpdatingId={hotelApprovalUpdatingId}
 handleHotelApprovalDraftChange={handleHotelApprovalDraftChange}
 handleHotelApprovalNoteChange={handleHotelApprovalNoteChange}
 navigate={navigate}
 handleHotelApprovalUpdate={handleHotelApprovalUpdate}
 setHotelCardPage={setHotelCardPage}
 hotelCardPaginationPages={hotelCardPaginationPages}
 />
 );
 const renderBookings = () => (
 <BookingsView
 sortedBookings={sortedBookings}
 filteredBookings={filteredBookings}
 bookingFilters={bookingFilters}
 handleBookingFilterChange={handleBookingFilterChange}
 paymentStatusFilterOptions={paymentStatusFilterOptions}
 bookingStayStatusOptions={bookingStayStatusOptions}
 resetBookingFilters={resetBookingFilters}
 paymentDrafts={paymentDrafts}
 paymentUpdatingId={paymentUpdatingId}
 bookingStatusDrafts={bookingStatusDrafts}
 bookingStatusNotes={bookingStatusNotes}
 bookingStatusUpdatingId={bookingStatusUpdatingId}
 paymentStatusOptions={paymentStatusOptions}
 bookingStatusOptions={bookingStatusOptions}
 shortId={shortId}
 formatDate={formatDate}
 currencyFormatter={currencyFormatter}
 bookingRevenueValue={bookingRevenueValue}
 paymentMethodLabel={paymentMethodLabel}
 formatCellText={formatCellText}
 handlePaymentDraftChange={handlePaymentDraftChange}
 handlePaymentStatusUpdate={handlePaymentStatusUpdate}
 handleBookingStatusDraftChange={handleBookingStatusDraftChange}
 handleBookingStatusUpdate={handleBookingStatusUpdate}
 handleBookingStatusNoteChange={handleBookingStatusNoteChange}
 />
 );
 const renderDisputes = () => (
 <DisputesView
 sortedDisputes={sortedDisputes}
 userMap={userMap}
 hotelMap={hotelMap}
 roomMap={roomMap}
 disputeStatusMeta={disputeStatusMeta}
 disputeStatusDrafts={disputeStatusDrafts}
 disputeNotes={disputeNotes}
 disputeUpdatingId={disputeUpdatingId}
 shortId={shortId}
 disputeStatusOptions={disputeStatusOptions}
 handleDisputeStatusDraftChange={handleDisputeStatusDraftChange}
 handleDisputeNoteChange={handleDisputeNoteChange}
 formatDateTime={formatDateTime}
 handleDisputeUpdate={handleDisputeUpdate}
 />
 );
 const renderLogs = () => (
 <LogsView
 sortedLogs={sortedLogs}
 formatDateTime={formatDateTime}
 shortId={shortId}
 />
 );
 const renderCoupons = () => (
 <CouponsView
 couponSummary={couponSummary}
 editingCouponId={editingCouponId}
 couponForm={couponForm}
 handleCouponFieldChange={handleCouponFieldChange}
 couponMessage={couponMessage}
 couponSaving={couponSaving}
 resetCouponForm={resetCouponForm}
 handleCouponSubmit={handleCouponSubmit}
 sortedCoupons={sortedCoupons}
 couponStatusMeta={couponStatusMeta}
 formatCellText={formatCellText}
 formatCouponValue={formatCouponValue}
 currencyFormatter={currencyFormatter}
 formatDate={formatDate}
 handleCouponEdit={handleCouponEdit}
 handleCouponDeleteRequest={handleCouponDeleteRequest}
 couponDeletingId={couponDeletingId}
 />
 );
 const renderUsers = () => (
 <UsersView
 users={users}
 userSummary={userSummary}
 shortId={shortId}
 userForm={userForm}
 editingUserId={editingUserId}
 userSaving={userSaving}
 userDeletingId={userDeletingId}
 userMessage={userMessage}
 adminUserRoleOptions={adminUserRoleOptions}
 handleUserFieldChange={handleUserFieldChange}
 handleUserSubmit={handleUserSubmit}
 resetUserForm={resetUserForm}
 handleUserEdit={handleUserEdit}
 handleUserDeleteRequest={handleUserDeleteRequest}
 />
 );
 const renderAccount = () => (
 <AccountView
 accountLoading={accountLoading}
 accountError={accountError}
 getAvatarText={getAvatarText}
 profileData={profileData}
 email={email}
 accountSummary={accountSummary}
 shortId={shortId}
 accountId={accountId}
 handleProfileSave={handleProfileSave}
 setProfileData={setProfileData}
 profileMessage={profileMessage}
 profileSaving={profileSaving}
 handleEmailSave={handleEmailSave}
 handleEmailInputChange={handleEmailInputChange}
 emailOtp={emailOtp}
 emailOtpSent={emailOtpSent}
 handleEmailOtpChange={handleEmailOtpChange}
 handleVerifyEmailOtp={handleVerifyEmailOtp}
 emailMessage={emailMessage}
 emailSaving={emailSaving}
 dashboard={dashboard}
 currencyFormatter={currencyFormatter}
 />
 );
 const renderMainContent = () => {
 if (loading) {
 return <div className="admin-loading-state">Đang tải dữ liệu dashboard...</div>;
 }

 if (error) {
 return (
 <div className="admin-error-state">
 <p>{error}</p>
 <button type="button" className="btn-action btn-primary" onClick={() => loadDashboardData()}>
     Thử tải lại
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
  confirmLabel={confirmDialog?.confirmLabel || "Xác nhận"}
 loading={Boolean(couponDeletingId || userDeletingId)}
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
   Đóng
 </button>
 </div>

 <button
 type="button"
 className={`sidebar-overview ${activeView === "overview" ? "active" : ""}`}
 onClick={() => openView("overview")}
 >
  Tổng quan
 </button>

 <div className="sidebar-section">
 <button
 type="button"
 className="section-toggle"
 onClick={() =>
 setSectionOpen((prev) => ({ ...prev, management: !prev.management }))
 }
 >
 <span>Quản lý dữ liệu</span>
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
 <span>Tài khoản</span>
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
 <button type="button" className="admin-link-btn" onClick={() => navigate("/hotels")}>
 Xem website
 </button>
 <button type="button" className="admin-link-btn active" onClick={handleLogout}>
 Đăng xuất
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
   {refreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
 </button>

 <button
 type="button"
 className="btn-action btn-primary"
 onClick={() => navigate("/host")}
 >
   Quản lý đăng phòng
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
 Quản lý coupon
 </button>
 <button type="button" className="dropdown-item" onClick={() => navigate("/host")}>
   Quản lý đăng phòng
 </button>
 <button type="button" className="dropdown-item" onClick={() => navigate("/")}>
   Về trang chủ
 </button>
 <button type="button" className="dropdown-item danger" onClick={handleLogout}>
 Đăng xuất
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









import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import useAccountEnhancedState from "../features/account/hooks/useAccountEnhancedState";
import { getAvatarText } from "../features/account/accountUtils";
import ProfileTab from "../features/account/views/ProfileTab";
import HistoryTab from "../features/account/views/HistoryTab";
import PaymentsTab from "../features/account/views/PaymentsTab";
import WishlistTab from "../features/account/views/WishlistTab";
import "./Account.css";

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const {
    activeTab,
    setActiveTab,
    loading,
    loadError,
    profile,
    email,
    handleEmailInputChange,
    emailOtp,
    setEmailOtp,
    emailOtpSent,
    sortedBookings,
    selectedBooking,
    bookingsLoading,
    bookingsError,
    wishlistItems,
    wishlistLoading,
    wishlistError,
    sortedDisputes,
    disputesByBookingId,
    disputesLoading,
    disputesError,
    profileSaving,
    emailSaving,
    actionSaving,
    disputeSaving,
    bookingAction,
    setBookingAction,
    disputeDraft,
    setDisputeDraft,
    handleProfileChange,
    handleSaveProfile,
    handleSaveEmail,
    handleConfirmEmailOtp,
    handleSubmitBookingAction,
    handleRemoveWishlist,
    handleSubmitDispute,
    refreshDisputes,
  } = useAccountEnhancedState({
    location,
    navigate,
    toast,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focus = params.get("focus");
    const paymentStatus = params.get("paymentStatus");
    const bookingId = params.get("bookingId");

    if (focus === "history" || focus === "payments" || focus === "profile" || focus === "wishlist") {
      setActiveTab(focus);
    }

    if (paymentStatus === "PAID") {
      toast.success(`Thanh toán thành công${bookingId ? ` cho booking ${bookingId}` : ""}`);
    } else if (paymentStatus === "FAILED") {
      toast.error(`Thanh toán thất bại${bookingId ? ` cho booking ${bookingId}` : ""}`);
    }

    if (!focus && !paymentStatus && !bookingId) {
      return;
    }

    params.delete("focus");
    params.delete("paymentStatus");
    params.delete("bookingId");

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, setActiveTab, toast]);

  return (
    <main className="account-page">
      <section className="account-shell">
        <header className="account-header">
          <div>
            <p className="account-tag">Profile người dùng</p>
            <h1>Quản lý tài khoản của bạn</h1>
            <p className="account-subtitle">
              Một nơi duy nhất để cập nhật profile, theo dõi booking, lịch sử thanh toán, hoàn tiền,
              tranh chấp và quản lý wishlist.
            </p>
          </div>
          <button type="button" className="back-btn" onClick={() => navigate("/")}>
            Quay về trang chủ
          </button>
        </header>

        {loading ? (
          <div className="account-state">đang tải dữ liệu tài khoản...</div>
        ) : loadError ? (
          <div className="account-error">{loadError}</div>
        ) : (
          <>
            <section className="profile-hero">
              <div className="hero-avatar">{getAvatarText(profile.name)}</div>
              <div className="hero-info">
                <h2>{profile.name || "Người dùng"}</h2>
                <p>{email || "-"}</p>
              </div>
            </section>

            <section className="account-tabs account-tabs-wide">
              <button
                type="button"
                className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Lịch sử booking
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                Thanh toán
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "wishlist" ? "active" : ""}`}
                onClick={() => setActiveTab("wishlist")}
              >
                Wishlist
              </button>
            </section>

            {activeTab === "profile" ? (
              <ProfileTab
                profile={profile}
                handleProfileChange={handleProfileChange}
                handleSaveProfile={handleSaveProfile}
                profileSaving={profileSaving}
                email={email}
                handleEmailInputChange={handleEmailInputChange}
                emailOtp={emailOtp}
                setEmailOtp={setEmailOtp}
                emailOtpSent={emailOtpSent}
                handleSaveEmail={handleSaveEmail}
                handleConfirmEmailOtp={handleConfirmEmailOtp}
                emailSaving={emailSaving}
              />
            ) : null}

            {activeTab === "history" ? (
              <HistoryTab
                sortedBookings={sortedBookings}
                selectedBooking={selectedBooking}
                bookingAction={bookingAction}
                setBookingAction={setBookingAction}
                handleSubmitBookingAction={handleSubmitBookingAction}
                actionSaving={actionSaving}
                bookingsLoading={bookingsLoading}
                bookingsError={bookingsError}
                disputesByBookingId={disputesByBookingId}
                setActiveTab={setActiveTab}
                setDisputeDraft={setDisputeDraft}
                navigate={navigate}
              />
            ) : null}

            {activeTab === "payments" ? (
              <PaymentsTab
                sortedBookings={sortedBookings}
                bookingsLoading={bookingsLoading}
                bookingsError={bookingsError}
                disputeDraft={disputeDraft}
                setDisputeDraft={setDisputeDraft}
                handleSubmitDispute={handleSubmitDispute}
                disputeSaving={disputeSaving}
                disputesByBookingId={disputesByBookingId}
                sortedDisputes={sortedDisputes}
                disputesLoading={disputesLoading}
                disputesError={disputesError}
                refreshDisputes={refreshDisputes}
              />
            ) : null}

            {activeTab === "wishlist" ? (
              <WishlistTab
                wishlistItems={wishlistItems}
                wishlistLoading={wishlistLoading}
                wishlistError={wishlistError}
                navigate={navigate}
                handleRemoveWishlist={handleRemoveWishlist}
              />
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}



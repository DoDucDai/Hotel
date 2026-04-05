import { useEffect, useMemo, useState } from "react";
import { getMyAccount, updateMyEmail, updateMyProfile } from "../../../services/accountService";
import {
  cancelBooking,
  createDispute,
  getMyBookings,
  getMyDisputes,
  rescheduleBooking,
} from "../../../services/bookingService";
import { getHotelById } from "../../../services/hotelService";
import { getRoomById } from "../../../services/roomService";
import { getMyWishlist, removeFromWishlist } from "../../../services/wishlistService";
import {
  initialProfile,
  normalizeBookings,
  normalizeDisputes,
  normalizeWishlist,
  resolveInitialTab,
} from "../accountUtils";

async function enrichBookings(bookingList) {
  const roomIds = [...new Set(bookingList.map((item) => item.roomId).filter(Boolean))];

  const roomResults = await Promise.all(
    roomIds.map(async (roomId) => {
      try {
        const res = await getRoomById(roomId);
        return [roomId, res?.data || null];
      } catch (error) {
        console.error("Cannot load room detail", roomId, error);
        return [roomId, null];
      }
    }),
  );

  const roomMap = Object.fromEntries(roomResults);

  const hotelIds = [...new Set(roomResults.map(([, room]) => room?.hotelId).filter(Boolean))];

  const hotelResults = await Promise.all(
    hotelIds.map(async (hotelId) => {
      try {
        const res = await getHotelById(hotelId);
        return [hotelId, res?.data || null];
      } catch (error) {
        console.error("Cannot load hotel detail", hotelId, error);
        return [hotelId, null];
      }
    }),
  );

  const hotelMap = Object.fromEntries(hotelResults);

  return bookingList.map((booking) => {
    const room = roomMap[booking.roomId] || null;
    const hotel = room?.hotelId ? hotelMap[room.hotelId] || null : null;
    return {
      ...booking,
      room,
      hotel,
    };
  });
}

export default function useAccountEnhancedState({ location, navigate, toast }) {
  const [activeTab, setActiveTab] = useState(resolveInitialTab(location.state));

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [disputeSaving, setDisputeSaving] = useState(false);

  const [profile, setProfile] = useState(initialProfile);
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [bookingAction, setBookingAction] = useState(null);
  const [disputeDraft, setDisputeDraft] = useState({
    bookingId: "",
    subject: "",
    description: "",
  });

  const [loadError, setLoadError] = useState("");
  const [bookingsError, setBookingsError] = useState("");
  const [wishlistError, setWishlistError] = useState("");
  const [disputesError, setDisputesError] = useState("");

  const hasToken = Boolean(localStorage.getItem("accessToken"));

  useEffect(() => {
    setActiveTab(resolveInitialTab(location.state));
  }, [location.state]);

  useEffect(() => {
    if (!hasToken) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setBookingsLoading(true);
        setWishlistLoading(true);
        setDisputesLoading(true);

        const [accountRes, bookingsRes, wishlistRes, disputesRes] = await Promise.all([
          getMyAccount(),
          getMyBookings(),
          getMyWishlist(),
          getMyDisputes(),
        ]);

        const bookingList = normalizeBookings(bookingsRes?.data);
        const enrichedBookings = await enrichBookings(bookingList);

        if (isMounted) {
          const user = accountRes?.data || {};
          setProfile({
            name: user.name || "",
            gender: user.gender || "",
            dateOfBirth: user.dateOfBirth || "",
            citizenId: user.citizenId || "",
          });
          setEmail(user.email || "");
          setBookings(enrichedBookings);
          setWishlistItems(normalizeWishlist(wishlistRes?.data));
          setDisputes(normalizeDisputes(disputesRes?.data));
          setLoadError("");
          setBookingsError("");
          setWishlistError("");
          setDisputesError("");
        }
      } catch (error) {
        console.error("Cannot load account", error);
        if (isMounted) {
          setLoadError("Khong the tai thong tin tai khoan. Vui long thu lai.");
          setBookingsError("Khong the tai lich su dat phong.");
          setWishlistError("Khong the tai wishlist.");
          setDisputesError("Khong the tai danh sach tranh chap.");
          toast.error("Khong the tai du lieu tai khoan");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setBookingsLoading(false);
          setWishlistLoading(false);
          setDisputesLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [hasToken, location.pathname, navigate, toast]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aValue = new Date(a.checkInDate || 0).getTime();
      const bValue = new Date(b.checkInDate || 0).getTime();
      return bValue - aValue;
    });
  }, [bookings]);

  const selectedBooking = useMemo(
    () => sortedBookings.find((booking) => booking.id === bookingAction?.bookingId) || null,
    [bookingAction?.bookingId, sortedBookings],
  );

  const sortedDisputes = useMemo(() => {
    return [...disputes].sort((a, b) => {
      const aValue = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bValue = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bValue - aValue;
    });
  }, [disputes]);

  const disputesByBookingId = useMemo(() => {
    return disputes.reduce((acc, item) => {
      if (item?.bookingId) {
        acc[item.bookingId] = item;
      }
      return acc;
    }, {});
  }, [disputes]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);

    try {
      const res = await updateMyProfile(profile);
      const user = res?.data || {};
      setProfile({
        name: user.name || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        citizenId: user.citizenId || "",
      });
      toast.success("Da luu thong tin profile");
    } catch (error) {
      console.error("Cannot save profile", error);
      toast.error(error?.response?.data?.message || "Cap nhat profile that bai");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveEmail = async (event) => {
    event.preventDefault();
    setEmailSaving(true);

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
      setProfile((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        gender: user.gender ?? prev.gender,
        dateOfBirth: user.dateOfBirth ?? prev.dateOfBirth,
        citizenId: user.citizenId ?? prev.citizenId,
      }));

      toast.success("Da doi email thanh cong");
    } catch (error) {
      console.error("Cannot change email", error);
      toast.error(error?.response?.data?.message || "Doi email that bai");
    } finally {
      setEmailSaving(false);
    }
  };

  const refreshBookings = async () => {
    setBookingsLoading(true);

    try {
      const res = await getMyBookings();
      const enriched = await enrichBookings(normalizeBookings(res?.data));
      setBookings(enriched);
      setBookingsError("");
    } catch (error) {
      console.error("Cannot refresh booking history", error);
      setBookingsError("Khong the tai lich su dat phong.");
    } finally {
      setBookingsLoading(false);
    }
  };

  const refreshDisputes = async () => {
    setDisputesLoading(true);

    try {
      const res = await getMyDisputes();
      setDisputes(normalizeDisputes(res?.data));
      setDisputesError("");
    } catch (error) {
      console.error("Cannot refresh disputes", error);
      setDisputesError("Khong the tai danh sach tranh chap.");
    } finally {
      setDisputesLoading(false);
    }
  };

  const handleSubmitBookingAction = async () => {
    if (!selectedBooking || !bookingAction) {
      return;
    }

    try {
      setActionSaving(true);

      if (bookingAction.mode === "cancel") {
        await cancelBooking(selectedBooking.id, bookingAction.reason || "");
        toast.success("Da huy booking thanh cong");
      } else {
        await rescheduleBooking(selectedBooking.id, {
          checkInDate: bookingAction.checkInDate,
          checkOutDate: bookingAction.checkOutDate,
        });
        toast.success("Da doi lich booking");
      }

      setBookingAction(null);
      await refreshBookings();
    } catch (error) {
      console.error("Cannot update booking", error);
      toast.error(error?.response?.data?.error || "Khong the cap nhat booking");
    } finally {
      setActionSaving(false);
    }
  };

  const handleRemoveWishlist = async (hotelId) => {
    try {
      await removeFromWishlist(hotelId);
      setWishlistItems((prev) => prev.filter((item) => item.hotelId !== hotelId));
      toast.success("Da bo khoi wishlist");
    } catch (error) {
      console.error("Cannot remove wishlist item", error);
      toast.error("Khong the xoa khoi wishlist");
    }
  };

  const handleSubmitDispute = async (event) => {
    event.preventDefault();

    if (!disputeDraft.bookingId || !disputeDraft.subject.trim() || !disputeDraft.description.trim()) {
      toast.error("Vui long chon booking va nhap day du noi dung tranh chap");
      return;
    }

    try {
      setDisputeSaving(true);
      await createDispute({
        bookingId: disputeDraft.bookingId,
        subject: disputeDraft.subject.trim(),
        description: disputeDraft.description.trim(),
      });
      setDisputeDraft({
        bookingId: "",
        subject: "",
        description: "",
      });
      await refreshDisputes();
      toast.success("Da gui tranh chap thanh cong");
    } catch (error) {
      console.error("Cannot create dispute", error);
      toast.error(error?.response?.data?.error || "Khong the gui tranh chap");
    } finally {
      setDisputeSaving(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    loadError,
    profile,
    setProfile,
    email,
    setEmail,
    bookings,
    sortedBookings,
    selectedBooking,
    bookingsLoading,
    bookingsError,
    wishlistItems,
    wishlistLoading,
    wishlistError,
    disputes,
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
    handleSubmitBookingAction,
    handleRemoveWishlist,
    handleSubmitDispute,
    refreshDisputes,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelCard from "../components/HotelCard";
import { useToast } from "../components/ToastProvider";
import {
  getMyAccount,
  updateMyEmail,
  updateMyProfile,
} from "../services/accountService";
import {
  getAdminBookings,
  getAdminDashboard,
  getAdminRooms,
  getAdminUsers,
} from "../services/adminService";
import { getMyHostRooms } from "../services/hostService";
import { getHotels } from "../services/hotelService";
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

function normalizeHotels(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeRooms(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data?.content)) {
    return payload.data.content;
  }

  return [];
}

function normalizeBookings(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeUsers(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
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

function bookingStatusMeta(booking) {
  if (booking?.status === "CANCELLED") {
    return { label: "Da huy", className: "neutral" };
  }

  const checkIn = parseDate(booking?.checkInDate);
  const checkOut = parseDate(booking?.checkOutDate);

  if (!checkIn || !checkOut) {
    return { label: "Khong ro", className: "neutral" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < checkIn) {
    return { label: "Sap den", className: "pending" };
  }

  if (today >= checkIn && today < checkOut) {
    return { label: "Dang o", className: "success" };
  }

  return { label: "Hoan tat", className: "neutral" };
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

  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  const [profileData, setProfileData] = useState(accountInitialState);
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [emailMessage, setEmailMessage] = useState(null);
  const [hotelFilters, setHotelFilters] = useState({
    city: "all",
    minRooms: "0",
    minOccupancy: "0",
  });

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

        const [dashboardRes, hotelsRes, bookingsRes, usersRes, roomsPayload] =
          await Promise.all([
            getAdminDashboard(),
            getHotels(0, 500),
            getAdminBookings(),
            getAdminUsers(),
            roomsPromise,
          ]);

        setDashboard(dashboardRes?.data || {});
        setHotels(normalizeHotels(hotelsRes?.data));
        setBookings(normalizeBookings(bookingsRes?.data));
        setUsers(normalizeUsers(usersRes?.data));
        setRooms(roomsPayload);
      } catch (loadError) {
        console.error("Cannot load admin dashboard", loadError);
        setError("Khong the tai du lieu dashboard. Vui long thu lai.");
        toast.error("Khong the tai du lieu dashboard");
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
    } catch (loadError) {
      console.error("Cannot load admin account", loadError);
      setAccountError("Khong the tai thong tin tai khoan admin.");
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
        subtitle: "Thong tin hotels duoc tach thanh card de de chinh sua",
      };
    }

    if (activeView === "bookings") {
      return {
        title: "Quan ly booking",
        subtitle: "Theo doi tinh trang dat phong va doanh thu moi ngay",
      };
    }

    if (activeView === "users") {
      return {
        title: "Quan ly nguoi dung",
        subtitle: "Tong hop vai tro va danh sach tai khoan dang su dung",
      };
    }

    if (activeView === "account") {
      return {
        title: "Profile admin",
        subtitle: "Cap nhat thong tin ca nhan va cai dat email",
      };
    }

    return {
      title: "Tong quan he thong",
      subtitle: "Dashboard du lieu thuc te tu backend cua project",
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
        status,
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
        } else if (booking.status.className === "neutral") {
          acc.completed += 1;
        } else {
          acc.unknown += 1;
        }
        return acc;
      },
      { upcoming: 0, active: 0, completed: 0, unknown: 0 }
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
      const time =
        parseDate(booking.checkInDate) || parseDate(booking.checkOutDate);
      if (!time) {
        return;
      }

      const key = `${time.getFullYear()}-${time.getMonth() + 1}`;
      if (valueByKey[key] === undefined) {
        return;
      }

      valueByKey[key] += Number(booking.totalPrice || 0);
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

  const openView = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const handleHotelFilterChange = (event) => {
    const { name, value } = event.target;
    setHotelFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetHotelFilters = () => {
    setHotelFilters({
      city: "all",
      minRooms: "0",
      minOccupancy: "0",
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

  const renderOverview = () => (
    <>
      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">Tong nguoi dung</p>
          <h3>{numberFormatter.format(dashboard.totalUsers || 0)}</h3>
          <p className="kpi-trend up">{userSummary.admins} admin dang quan ly</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Tong khach san</p>
          <h3>{numberFormatter.format(dashboard.totalHotels || 0)}</h3>
          <p className="kpi-trend up">{citySummary.length} thanh pho noi bat</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Tong phong</p>
          <h3>{numberFormatter.format(dashboard.totalRooms || 0)}</h3>
          <p className="kpi-trend up">
            Gia TB {currencyFormatter.format(averageRoomPrice || 0)}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Tong booking</p>
          <h3>{numberFormatter.format(dashboard.totalBookings || 0)}</h3>
          <p className="kpi-trend down">{overviewStatus.upcoming} booking sap den</p>
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
              <h2>Top hotel dang o cao nhat</h2>
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
              <div className="admin-empty-state">Chua co du lieu occupancy theo hotel.</div>
            )}
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="panel-tag">Booking gan day</p>
              <h2>Danh sach dat phong moi nhat</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ma</th>
                  <th>Nguoi dat</th>
                  <th>Khach san</th>
                  <th>Ngay o</th>
                  <th>Tong tien</th>
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
                      {currencyFormatter.format(
                        Number(booking.finalPrice || booking.totalPrice || 0)
                      )}
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
              <p className="panel-tag">Tong quan nhanh</p>
              <h2>Du lieu van hanh</h2>
            </div>
          </div>

          <div className="type-grid">
            <article className="type-card">
              <h3>Trang thai booking</h3>
              <p>
                Sap den: {overviewStatus.upcoming} | Dang o: {overviewStatus.active} | Hoan tat:{" "}
                {overviewStatus.completed}
              </p>
              <button type="button" onClick={() => openView("bookings")}>
                Xem booking
              </button>
            </article>
            <article className="type-card">
              <h3>Phan bo thanh pho</h3>
              <p>
                {citySummary.length
                  ? citySummary.map((item) => `${item.city} (${item.count})`).join(", ")
                  : "Chua co du lieu thanh pho"}
              </p>
              <button type="button" onClick={() => openView("hotels")}>
                Xem hotels
              </button>
            </article>
            <article className="type-card">
              <h3>Phan quyen nguoi dung</h3>
              <p>
                Admin: {userSummary.admins} | User: {userSummary.usersNormal} | Tong:{" "}
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
            <h2>Tach rieng tung card de de mo rong</h2>
          </div>
          <span className="panel-badge">
            {filteredHotelCards.length}/{hotelCards.length} hotels
          </span>
        </div>

        <div className="admin-hotel-filters">
          <label className="admin-filter-field">
            <span>Thanh pho</span>
            <select name="city" value={hotelFilters.city} onChange={handleHotelFilterChange}>
              <option value="all">Tat ca thanh pho</option>
              {hotelCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            <span>So phong toi thieu</span>
            <input
              type="number"
              min="0"
              name="minRooms"
              value={hotelFilters.minRooms}
              onChange={handleHotelFilterChange}
            />
          </label>

          <label className="admin-filter-field">
            <span>Lap day toi thieu (%)</span>
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
            Dat lai bo loc
          </button>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Phong hoat dong</h3>
            <p>{numberFormatter.format(rooms.length)} phong trong he thong</p>
          </div>
          <div className="type-card">
            <h3>Booking theo hotel</h3>
            <p>{numberFormatter.format(bookings.length)} luot dat phong</p>
          </div>
          <div className="type-card">
            <h3>Khach san lap day cao</h3>
            <p>
              {topFilteredHotel
                ? `${topFilteredHotel.name} - ${topFilteredHotel.occupancy}%`
                : "Chua co du lieu"}
            </p>
          </div>
        </div>

        {hotelCards.length ? (
          filteredHotelCards.length ? (
          <div className="admin-hotel-grid">
            {filteredHotelCards.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onView={(hotelItem) =>
                  navigate(`/hotels/${hotelItem.id}`, {
                    state: { hotel: hotelItem },
                  })
                }
              />
            ))}
          </div>
        ) : (
            <div className="admin-empty-state">
              Khong co khach san phu hop bo loc hien tai.
            </div>
          )
        ) : (
          <div className="admin-empty-state">Chua co khach san nao trong he thong.</div>
        )}
      </article>
    </section>
  );

  const renderBookings = () => (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Tat ca booking</p>
            <h2>Quan sat booking theo tinh trang thuc te</h2>
          </div>
          <span className="panel-badge">{sortedBookings.length} booking</span>
        </div>

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
                <th>Tong tien</th>
                <th>Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{shortId(booking.id)}</td>
                  <td>{booking.user?.name || booking.user?.email || booking.userId || "-"}</td>
                  <td>{booking.hotel?.name || "-"}</td>
                  <td>{booking.room?.name || booking.roomId || "-"}</td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td>{formatDate(booking.checkOutDate)}</td>
                  <td>
                    {currencyFormatter.format(
                      Number(booking.finalPrice || booking.totalPrice || 0)
                    )}
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
    </section>
  );

  const renderUsers = () => (
    <section className="admin-view-stack">
      <article className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-tag">Tat ca nguoi dung</p>
            <h2>Phan loai role va theo doi tai khoan</h2>
          </div>
          <span className="panel-badge">{users.length} users</span>
        </div>

        <div className="admin-summary-grid">
          <div className="type-card">
            <h3>Admin</h3>
            <p>{userSummary.admins} tai khoan quan tri</p>
          </div>
          <div className="type-card">
            <h3>User</h3>
            <p>{userSummary.usersNormal} tai khoan khach hang/host</p>
          </div>
          <div className="type-card">
            <h3>Tong so</h3>
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
        <div className="admin-account-state">Dang tai profile admin...</div>
      ) : accountError ? (
        <div className="admin-account-state error">{accountError}</div>
      ) : (
        <div className="admin-account-grid">
          <article className="admin-account-card">
            <h2>Thong tin ca nhan admin</h2>
            <p className="admin-account-note">
              Cap nhat ho ten, gioi tinh, ngay sinh va can cuoc cua tai khoan admin.
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
                  <option value="">Chon gioi tinh</option>
                  <option value="Nam">Nam</option>
                  <option value="Nu">Nu</option>
                  <option value="Khac">Khac</option>
                </select>
              </label>

              <label>
                <span>Ngay sinh</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={(event) =>
                    setProfileData((prev) => ({ ...prev, dateOfBirth: event.target.value }))
                  }
                />
              </label>

              <label>
                <span>Can cuoc cong dan</span>
                <input
                  name="citizenId"
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
                {profileSaving ? "Dang luu..." : "Luu profile"}
              </button>
            </form>
          </article>

          <article className="admin-account-card">
            <h2>Cai dat email dang nhap</h2>
            <p className="admin-account-note">
              Doi email de nhan token moi, email nay duoc dung de dang nhap he thong.
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
                {emailSaving ? "Dang cap nhat..." : "Cap nhat email"}
              </button>
            </form>

            <ul className="admin-info-list">
              <li>
                <span>Role hien tai</span>
                <strong>{localStorage.getItem("role") || "ADMIN"}</strong>
              </li>
              <li>
                <span>ID admin</span>
                <strong>{shortId(users.find((u) => u.email === email)?.id)}</strong>
              </li>
              <li>
                <span>Tong doanh thu he thong</span>
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

    if (activeView === "account") {
      return renderAccount();
    }

    return renderOverview();
  };

  return (
    <main className="admin-dashboard">
      {sidebarOpen && <button type="button" className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">HB</div>
          <div className="brand-meta">
            <strong>Hotel Booking</strong>
            <span>Admin Control Center</span>
          </div>
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            Dong
          </button>
        </div>

        <button
          type="button"
          className={`sidebar-overview ${activeView === "overview" ? "active" : ""}`}
          onClick={() => openView("overview")}
        >
          Tong quan
        </button>

        <div className="sidebar-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() =>
              setSectionOpen((prev) => ({ ...prev, management: !prev.management }))
            }
          >
            <span>Quan ly du lieu</span>
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
            <span>Tai khoan</span>
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
            Ve trang chu
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
              {refreshing ? "Dang lam moi..." : "Lam moi du lieu"}
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
                  <button type="button" className="dropdown-item" onClick={() => navigate("/host")}>
                    Quan ly dang phong
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => navigate("/")}>
                    Ve trang chu
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

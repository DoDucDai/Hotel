import { useMemo } from "react";
import {
 ADMIN_HOTELS_PER_PAGE,
 bookingMatchesDateRange,
 bookingRevenueValue,
 bookingStatusMeta,
 bookingStayFilterValue,
 clampPercent,
 couponStatusMeta,
 formatDateTime,
 formatRoleLabel,
 maskCitizenId,
 parseDate,
 parseNonNegative,
 paymentStatusMeta,
} from "../adminDashboardUtils";

export default function useAdminDashboardDerivedData({
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
}) {
 const viewMeta = useMemo(() => {
 if (activeView === "hotels") {
 return {
 title: "Quản lý khách sạn",
 subtitle: "Thông tin hotel được tách thành card để dễ chỉnh sửa",
 };
 }

 if (activeView === "bookings") {
 return {
 title: "Quản lý booking",
    subtitle: "Theo dõi tình trạng đặt phòng và doanh thu mỗi ngày",
 };
 }

 if (activeView === "users") {
 return {
 title: "Quản lý người dùng",
 subtitle: "Tổng hợp vai trò và danh sách tài khoản đang hoạt động",
 };
 }

 if (activeView === "coupons") {
 return {
 title: "Quản lý coupon",
 subtitle: "Tạo, cập nhật và kiểm soát ưu đãi đang áp dụng trong hệ thống",
 };
 }

 if (activeView === "account") {
 return {
 title: "Profile admin",
 subtitle: "Cập nhật thông tin cá nhân và cài đặt email",
 };
 }

 if (activeView === "disputes") {
 return {
 title: "Tranh chấp và báo cáo",
 subtitle: "Xử lý các ticket liên quan đến booking, thanh toán và chất lượng lưu trú",
 };
 }

 if (activeView === "logs") {
 return {
 title: "Nhật ký hoạt động",
 subtitle: "Theo dõi những thay đổi quan trọng để kiểm soát vận hành hệ thống",
 };
 }

 return {
 title: "Tổng quan hệ thống",
 subtitle: "Dashboard dữ liệu thực từ backend của project",
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

 const valueByKey = Object.fromEntries(initialMonths.map((month) => [month.key, 0]));

 bookingsWithMeta.forEach((booking) => {
 if (booking.status.className === "danger") {
 return;
 }

 const time = parseDate(booking.checkInDate) || parseDate(booking.checkOutDate);
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
 const occupancy = totalRooms ? clampPercent((activeStays / totalRooms) * 100) : 0;

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
 .filter((hotel) => Number(hotel.totalRooms || 0) > 0)
 .sort((a, b) => {
 const occupancyDiff = Number(b.occupancy || 0) - Number(a.occupancy || 0);
 if (occupancyDiff !== 0) {
 return occupancyDiff;
 }

 const activeStayDiff = Number(b.activeStays || 0) - Number(a.activeStays || 0);
 if (activeStayDiff !== 0) {
 return activeStayDiff;
 }

 return Number(b.totalBookings || 0) - Number(a.totalBookings || 0);
 })
 .slice(0, 6);
 }, [hotelCards]);

 const hotelCityOptions = useMemo(() => {
 const uniqueCities = new Set(
 hotelCards.map((hotel) => hotel.city?.trim()).filter((cityName) => Boolean(cityName))
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

 return users.find((user) => (user.email || "").trim().toLowerCase() === normalizedEmail)?.id || "";
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
 roleLabel: formatRoleLabel(accountMeta.role || localStorage.getItem("role") || "ADMIN"),
 maskedCitizenId: maskCitizenId(profileData.citizenId),
 verificationLabel: verified ? "Email đã xác thực" : "Email chưa xác thực",
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

 return {
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
 };
}



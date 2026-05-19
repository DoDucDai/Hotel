import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import { getMyAccount } from "../services/accountService";
import {
 createHostHotel,
 createHostInventoryBlock,
 createHostRoom,
 deleteHostHotel,
 deleteHostInventoryBlock,
 deleteHostRoom,
 getHostDashboard,
 getHostInventoryBlocks,
 getHostRoomInventory,
 getMyHostHotels,
 getMyHostRooms,
 updateHostHotel,
 updateHostRoom,
} from "../services/hostService";
import HostDashboardSection from "../features/host/views/HostDashboardSection";
import HostHotelsSection from "../features/host/views/HostHotelsSection";
import HostInventorySection from "../features/host/views/HostInventorySection";
import HostRoomsSection from "../features/host/views/HostRoomsSection";
import {
 addDays,
 approvalMeta,
 currencyFormatter,
 formatDate,
 formatDateTime,
 initialHotelForm,
 initialRoomForm,
 normalizeList,
 parseCommaList,
 todayString,
} from "../features/host/hostRoomsUtils";
import "./HostRooms.css";

function HostRooms() {
 const navigate = useNavigate();
 const toast = useToast();

 const [loading, setLoading] = useState(true);
 const [dashboardLoading, setDashboardLoading] = useState(true);
 const [hotels, setHotels] = useState([]);
 const [rooms, setRooms] = useState([]);
 const [hostDashboard, setHostDashboard] = useState({
 totalHotels: 0,
 totalRooms: 0,
 totalBookings: 0,
 upcomingBookings: 0,
 activeBookings: 0,
 completedBookings: 0,
 cancelledBookings: 0,
 totalRevenue: 0,
 recentBookings: [],
 });

 const [hotelForm, setHotelForm] = useState(initialHotelForm);
 const [roomForm, setRoomForm] = useState(initialRoomForm);
 const [inventoryForm, setInventoryForm] = useState({
 startDate: todayString(),
 endDate: addDays(todayString(), 2),
 blockedUnits: 1,
 reason: "",
 });
 const [inventoryRange, setInventoryRange] = useState({
 startDate: todayString(),
 endDate: addDays(todayString(), 13),
 });

 const [editingHotelId, setEditingHotelId] = useState("");
 const [editingRoomId, setEditingRoomId] = useState("");
 const [inventoryRoomId, setInventoryRoomId] = useState("");

 const [savingHotel, setSavingHotel] = useState(false);
 const [savingRoom, setSavingRoom] = useState(false);
 const [inventoryLoading, setInventoryLoading] = useState(false);
 const [inventorySaving, setInventorySaving] = useState(false);
 const [confirmDialog, setConfirmDialog] = useState(null);
 const [confirmLoading, setConfirmLoading] = useState(false);
 const [inventoryCalendar, setInventoryCalendar] = useState([]);
 const [inventoryBlocks, setInventoryBlocks] = useState([]);
 const [payoutProfile, setPayoutProfile] = useState({
 loaded: false,
 bankProvider: "",
 bankAccountName: "",
 bankAccountNumber: "",
 });

 const hotelsById = useMemo(() => {
 return hotels.reduce((acc, hotel) => {
 if (hotel?.id) {
 acc[hotel.id] = hotel;
 }
 return acc;
 }, {});
 }, [hotels]);

 const selectedInventoryRoom = useMemo(() => {
 return rooms.find((room) => room.id === inventoryRoomId) || null;
 }, [inventoryRoomId, rooms]);

 const payoutReady = useMemo(() => {
 const hasBankProvider = Boolean((payoutProfile.bankProvider || "").trim());
 const hasBankAccountNumber = Boolean((payoutProfile.bankAccountNumber || "").trim());
 return hasBankProvider && hasBankAccountNumber;
 }, [payoutProfile.bankAccountNumber, payoutProfile.bankProvider]);

 const showMissingPayoutWarning = payoutProfile.loaded && !payoutReady;

 const loadHostData = async () => {
 try {
 setLoading(true);
 setDashboardLoading(true);
 const [hotelsRes, roomsRes, dashboardRes] = await Promise.all([
 getMyHostHotels(),
 getMyHostRooms(),
 getHostDashboard(),
 ]);
 const hotelList = normalizeList(hotelsRes?.data);
 const roomList = normalizeList(roomsRes?.data);
 const dashboard = dashboardRes?.data || {};

 let accountData = null;
 try {
 const accountRes = await getMyAccount();
 accountData = accountRes?.data || null;
 } catch (accountError) {
 console.error("Cannot load payout profile for host warning", accountError);
 }

 setPayoutProfile({
 loaded: Boolean(accountData),
 bankProvider: accountData?.bankProvider || "",
 bankAccountName: accountData?.bankAccountName || "",
 bankAccountNumber: accountData?.bankAccountNumber || "",
 });

 setHotels(hotelList);
 setRooms(roomList);
 setHostDashboard({
 totalHotels: Number(dashboard.totalHotels || 0),
 totalRooms: Number(dashboard.totalRooms || 0),
 totalBookings: Number(dashboard.totalBookings || 0),
 upcomingBookings: Number(dashboard.upcomingBookings || 0),
 activeBookings: Number(dashboard.activeBookings || 0),
 completedBookings: Number(dashboard.completedBookings || 0),
 cancelledBookings: Number(dashboard.cancelledBookings || 0),
 totalRevenue: Number(dashboard.totalRevenue || 0),
 recentBookings: Array.isArray(dashboard.recentBookings)
 ? dashboard.recentBookings
 : [],
 });

 if (!editingRoomId && hotelList.length && !roomForm.hotelId) {
 setRoomForm((prev) => ({
 ...prev,
 hotelId: hotelList[0].id,
 }));
 }

 setInventoryRoomId((prev) => {
 if (prev && roomList.some((room) => room.id === prev)) {
 return prev;
 }
 return roomList[0]?.id || "";
 });
 } catch (error) {
 console.error("Cannot load host dashboard", error);
 toast.error("Không thể tải dữ liệu đăng phòng");
 } finally {
 setLoading(false);
 setDashboardLoading(false);
 }
 };

 useEffect(() => {
 loadHostData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 useEffect(() => {
 if (!inventoryRoomId || !inventoryRange.startDate || !inventoryRange.endDate) {
 setInventoryCalendar([]);
 setInventoryBlocks([]);
 return;
 }

 let isMounted = true;

 const fetchInventory = async () => {
 if (new Date(inventoryRange.endDate) < new Date(inventoryRange.startDate)) {
 toast.error("Khoảng ngày xem tồn kho không hợp lệ");
 return;
 }

 try {
 setInventoryLoading(true);
 const [calendarRes, blocksRes] = await Promise.all([
 getHostRoomInventory(
 inventoryRoomId,
 inventoryRange.startDate,
 inventoryRange.endDate
 ),
 getHostInventoryBlocks(inventoryRoomId),
 ]);

 if (isMounted) {
 setInventoryCalendar(normalizeList(calendarRes?.data));
 setInventoryBlocks(normalizeList(blocksRes?.data));
 }
 } catch (error) {
 console.error("Cannot load inventory", error);
 if (isMounted) {
 setInventoryCalendar([]);
 setInventoryBlocks([]);
 }
 toast.error("Không thể tải tồn kho theo ngày");
 } finally {
 if (isMounted) {
 setInventoryLoading(false);
 }
 }
 };

 fetchInventory();

 return () => {
 isMounted = false;
 };
 }, [inventoryRange.endDate, inventoryRange.startDate, inventoryRoomId, toast]);

 const handleHotelChange = (event) => {
 const { name, value } = event.target;
 setHotelForm((prev) => ({ ...prev, [name]: value }));
 };

 const handleRoomChange = (event) => {
 const { name, value } = event.target;
 setRoomForm((prev) => ({ ...prev, [name]: value }));
 };

 const handleInventoryFormChange = (event) => {
 const { name, value } = event.target;
 setInventoryForm((prev) => ({ ...prev, [name]: value }));
 };

 const handleInventoryRangeChange = (event) => {
 const { name, value } = event.target;
 setInventoryRange((prev) => ({ ...prev, [name]: value }));
 };

 const resetHotelForm = () => {
 setEditingHotelId("");
 setHotelForm({ ...initialHotelForm });
 };

 const resetRoomForm = () => {
 setEditingRoomId("");
 setRoomForm({
 ...initialRoomForm,
 hotelId: hotels[0]?.id || "",
 });
 };

 const handleSubmitHotel = async (event) => {
 event.preventDefault();
 setSavingHotel(true);

 try {
 const payload = {
 name: hotelForm.name.trim(),
 address: hotelForm.address.trim(),
 city: hotelForm.city.trim(),
 starRating: Number(hotelForm.starRating) || 3,
 amenities: parseCommaList(hotelForm.amenities),
 freeCancellationBeforeDays: Math.max(
 Number(hotelForm.freeCancellationBeforeDays) || 0,
 0
 ),
 lateCancellationRefundRate: Math.min(
 Math.max(Number(hotelForm.lateCancellationRefundRate) || 0, 0),
 100
 ),
 };

 if (!payload.name || !payload.address || !payload.city) {
 toast.error("Vui lòng nhập đầy đủ thông tin khách sạn");
 return;
 }

 if (editingHotelId) {
 await updateHostHotel(editingHotelId, payload);
 toast.success("Đã cập nhật khách sạn");
 } else {
 await createHostHotel(payload);
 toast.success("Đã tạo khách sạn mới");
 }

 resetHotelForm();
 await loadHostData();
 } catch (error) {
 console.error("Cannot save hotel", error);
 toast.error(error?.response?.data?.error || "Không thể lưu khách sạn");
 } finally {
 setSavingHotel(false);
 }
 };

 const handleEditHotel = (hotel) => {
 setEditingHotelId(hotel.id);
 setHotelForm({
 name: hotel.name || "",
 address: hotel.address || "",
 city: hotel.city || "",
 starRating: hotel.starRating || 3,
 amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : "",
 freeCancellationBeforeDays: hotel.freeCancellationBeforeDays ?? 3,
 lateCancellationRefundRate: hotel.lateCancellationRefundRate ?? 50,
 });
 };

 const performDeleteHotel = async (hotelId) => {
 setConfirmLoading(true);
 try {
 await deleteHostHotel(hotelId);
 toast.success("Đã xóa khách sạn");
 if (editingHotelId === hotelId) {
 resetHotelForm();
 }
 setConfirmDialog(null);
 await loadHostData();
 } catch (error) {
 console.error("Cannot delete hotel", error);
 toast.error(error?.response?.data?.error || "Không thể xóa khách sạn");
 } finally {
 setConfirmLoading(false);
 }
 };

 const handleDeleteHotelRequest = (hotel) => {
 setConfirmDialog({
 type: "hotel",
 id: hotel.id,
 title: "Xóa khách sạn này?",
 description:
 "Khách sạn và các loại phòng thuộc khách sạn này sẽ bị xóa khỏi hệ thống đăng phòng của bạn.",
 confirmLabel: "Xóa khách sạn",
 });
 };

 const handleSubmitRoom = async (event) => {
 event.preventDefault();
 setSavingRoom(true);

 try {
 const payload = {
 hotelId: roomForm.hotelId,
 name: roomForm.name.trim(),
 capacity: Number(roomForm.capacity),
 price: Number(roomForm.price),
 roomType: roomForm.roomType.trim() || "STANDARD",
 bedType: roomForm.bedType.trim(),
 description: roomForm.description.trim(),
 totalUnits: Math.max(Number(roomForm.totalUnits) || 1, 1),
 amenities: parseCommaList(roomForm.amenities),
 };

 if (!payload.hotelId || !payload.name) {
 toast.error("Vui lòng chọn khách sạn và tên phòng");
 return;
 }

 if (!Number.isFinite(payload.capacity) || payload.capacity < 1) {
 toast.error("Sức chứa phải lớn hơn hoặc bằng 1");
 return;
 }

 if (!Number.isFinite(payload.price) || payload.price < 0) {
 toast.error("Giá phòng không hợp lệ");
 return;
 }

 if (editingRoomId) {
 await updateHostRoom(editingRoomId, payload);
 toast.success("Đã cập nhật loại phòng");
 } else {
 await createHostRoom(payload);
 toast.success("Đã tạo loại phòng mới");
 }

 resetRoomForm();
 await loadHostData();
 } catch (error) {
 console.error("Cannot save room", error);
 toast.error(error?.response?.data?.error || "Không thể lưu phòng");
 } finally {
 setSavingRoom(false);
 }
 };

 const handleEditRoom = (room) => {
 setEditingRoomId(room.id);
 setRoomForm({
 hotelId: room.hotelId || "",
 name: room.name || "",
 capacity: room.capacity || 1,
 price: room.price || 0,
 roomType: room.roomType || "STANDARD",
 bedType: room.bedType || "",
 description: room.description || "",
 totalUnits: room.totalUnits || 1,
 amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
 });
 };

 const performDeleteRoom = async (roomId) => {
 setConfirmLoading(true);
 try {
 await deleteHostRoom(roomId);
 toast.success("Đã xóa phòng");
 if (editingRoomId === roomId) {
 resetRoomForm();
 }
 setConfirmDialog(null);
 await loadHostData();
 } catch (error) {
 console.error("Cannot delete room", error);
 toast.error(error?.response?.data?.error || "Không thể xóa phòng");
 } finally {
 setConfirmLoading(false);
 }
 };

 const handleDeleteRoomRequest = (room) => {
 setConfirmDialog({
 type: "room",
 id: room.id,
 title: "Xóa loại phòng này?",
 description:
 "Loại phòng này sẽ bị gỡ khỏi hệ thống và không còn được hiển thị cho người dùng đặt.",
 confirmLabel: "Xóa phòng",
 });
 };

 const handleSubmitInventoryBlock = async (event) => {
 event.preventDefault();

 if (!inventoryRoomId) {
 toast.error("Hãy chọn một loại phòng để block tồn kho");
 return;
 }

 if (!inventoryForm.startDate || !inventoryForm.endDate) {
 toast.error("Vui lòng chọn dải khoảng ngày block");
 return;
 }

 if (new Date(inventoryForm.endDate) < new Date(inventoryForm.startDate)) {
 toast.error("Ngày kết thúc block phải sau ngày bắt đầu");
 return;
 }

 try {
 setInventorySaving(true);
 await createHostInventoryBlock(inventoryRoomId, {
 startDate: inventoryForm.startDate,
 endDate: inventoryForm.endDate,
 blockedUnits: Math.max(Number(inventoryForm.blockedUnits) || 1, 1),
 reason: inventoryForm.reason.trim(),
 });

 setInventoryForm((prev) => ({
 ...prev,
 blockedUnits: 1,
 reason: "",
 }));
 toast.success("Đã thêm block tồn kho");
 await loadHostData();
 } catch (error) {
 console.error("Cannot create inventory block", error);
 toast.error(error?.response?.data?.error || "Không thể block tồn kho");
 } finally {
 setInventorySaving(false);
 }
 };

 const performDeleteInventoryBlock = async (blockId) => {
 if (!blockId) {
 return;
 }

 setConfirmLoading(true);
 try {
 await deleteHostInventoryBlock(blockId);
 setConfirmDialog(null);
 toast.success("Đã gỡ block tồn kho");
 await loadHostData();
 } catch (error) {
 console.error("Cannot delete inventory block", error);
 toast.error(error?.response?.data?.error || "Không thể xóa block tồn kho");
 } finally {
 setConfirmLoading(false);
 }
 };

 const handleDeleteInventoryBlockRequest = (block) => {
 setConfirmDialog({
 type: "inventory-block",
 id: block.id,
 title: "Gỡ block tồn kho này?",
 description:
 "Thông tin block tồn kho sẽ bị xóa và phòng sẽ trở lại trạng thái mở bán theo tồn kho hiện có.",
 confirmLabel: "Gỡ block",
 });
 };

 const closeConfirmDialog = () => {
 if (confirmLoading) {
 return;
 }

 setConfirmDialog(null);
 };

 const handleConfirmDialog = async () => {
 if (!confirmDialog?.id) {
 return;
 }

 if (confirmDialog.type === "hotel") {
 await performDeleteHotel(confirmDialog.id);
 return;
 }

 if (confirmDialog.type === "room") {
 await performDeleteRoom(confirmDialog.id);
 return;
 }

 if (confirmDialog.type === "inventory-block") {
 await performDeleteInventoryBlock(confirmDialog.id);
 }
 };

 return (
 <main className="host-page">
 <ConfirmDialog
 open={Boolean(confirmDialog)}
 title={confirmDialog?.title || ""}
 description={confirmDialog?.description || ""}
 confirmLabel={confirmDialog?.confirmLabel || "Xóa"}
 loading={confirmLoading}
 onClose={closeConfirmDialog}
 onConfirm={handleConfirmDialog}
 />

 <section className="host-shell">
 <header className="host-header">
 <div>
 <p className="host-tag">Người cho thuê</p>
 <h1>Quản lý hotel, loại phòng và tồn kho theo ngày</h1>
 <p>
 Quản lý thông tin khách sạn, nhiều loại phòng, chính sách hủy và lịch tồn
 kho để mô phỏng một hệ thống vận hành thực tế hơn.
 </p>
 </div>

 <button type="button" className="host-back-btn" onClick={() => navigate("/")}>
 Về trang chủ
 </button>
 </header>

 {showMissingPayoutWarning ? (
 <section className="host-alert host-alert-warning">
 <div className="host-alert-content">
 <strong>Bạn chưa cấu hình STK nhận cọc</strong>
 <p>
 Khách đặt phòng đang chưa thấy thông tin STK cá nhân của bạn. Cập nhật ngay để nhận
 chuyển khoản cọc đúng tài khoản.
 </p>
 </div>
 <button
 type="button"
 className="host-alert-btn"
 onClick={() => navigate("/account?focus=profile")}
 >
 Cập nhật STK ngay
 </button>
 </section>
 ) : null}

 <HostDashboardSection
 dashboardLoading={dashboardLoading}
 hostDashboard={hostDashboard}
 currencyFormatter={currencyFormatter}
 formatDate={formatDate}
 formatDateTime={formatDateTime}
 />

 {loading ? (
 <div className="host-state">đang tải dữ liệu đăng phòng...</div>
 ) : (
 <>
 <div className="host-grid">
 <HostHotelsSection
 editingHotelId={editingHotelId}
 resetHotelForm={resetHotelForm}
 handleSubmitHotel={handleSubmitHotel}
 savingHotel={savingHotel}
 hotelForm={hotelForm}
 handleHotelChange={handleHotelChange}
 hotels={hotels}
 approvalMeta={approvalMeta}
 formatDateTime={formatDateTime}
 handleEditHotel={handleEditHotel}
 handleDeleteHotelRequest={handleDeleteHotelRequest}
 />

 <HostRoomsSection
 editingRoomId={editingRoomId}
 resetRoomForm={resetRoomForm}
 handleSubmitRoom={handleSubmitRoom}
 savingRoom={savingRoom}
 hotels={hotels}
 roomForm={roomForm}
 handleRoomChange={handleRoomChange}
 rooms={rooms}
 hotelsById={hotelsById}
 inventoryRoomId={inventoryRoomId}
 currencyFormatter={currencyFormatter}
 handleEditRoom={handleEditRoom}
 setInventoryRoomId={setInventoryRoomId}
 handleDeleteRoomRequest={handleDeleteRoomRequest}
 />
 </div>

 <HostInventorySection
 rooms={rooms}
 inventoryRoomId={inventoryRoomId}
 setInventoryRoomId={setInventoryRoomId}
 hotelsById={hotelsById}
 selectedInventoryRoom={selectedInventoryRoom}
 inventoryRange={inventoryRange}
 handleInventoryRangeChange={handleInventoryRangeChange}
 handleSubmitInventoryBlock={handleSubmitInventoryBlock}
 inventoryForm={inventoryForm}
 handleInventoryFormChange={handleInventoryFormChange}
 inventorySaving={inventorySaving}
 inventoryLoading={inventoryLoading}
 inventoryCalendar={inventoryCalendar}
 formatDate={formatDate}
 inventoryBlocks={inventoryBlocks}
 handleDeleteInventoryBlockRequest={handleDeleteInventoryBlockRequest}
 />
 </>
 )}
 </section>
 </main>
 );
}

export default HostRooms;



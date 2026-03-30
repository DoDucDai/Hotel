import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";
import {
  createHostHotel,
  createHostInventoryBlock,
  createHostRoom,
  deleteHostHotel,
  deleteHostInventoryBlock,
  deleteHostRoom,
  getHostInventoryBlocks,
  getHostRoomInventory,
  getMyHostHotels,
  getMyHostRooms,
  updateHostHotel,
  updateHostRoom,
} from "../services/hostService";
import "./HostRooms.css";

const initialHotelForm = {
  name: "",
  address: "",
  city: "",
  starRating: 3,
  amenities: "",
  freeCancellationBeforeDays: 3,
  lateCancellationRefundRate: 50,
};

const initialRoomForm = {
  hotelId: "",
  name: "",
  capacity: 1,
  price: 0,
  roomType: "STANDARD",
  bedType: "",
  description: "",
  totalUnits: 1,
  amenities: "",
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value, amount) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function normalizeList(payload) {
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

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
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

function approvalMeta(status) {
  switch (status) {
    case "APPROVED":
      return { label: "Da duyet", className: "success" };
    case "REJECTED":
      return { label: "Bi tu choi", className: "danger" };
    default:
      return { label: "Cho duyet", className: "pending" };
  }
}

function HostRooms() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);

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

  const loadHostData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, roomsRes] = await Promise.all([getMyHostHotels(), getMyHostRooms()]);
      const hotelList = normalizeList(hotelsRes?.data);
      const roomList = normalizeList(roomsRes?.data);

      setHotels(hotelList);
      setRooms(roomList);

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
      toast.error("Khong the tai du lieu dang phong");
    } finally {
      setLoading(false);
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
        toast.error("Khoang ngay xem ton kho khong hop le");
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
        toast.error("Khong the tai ton kho theo ngay");
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
        toast.error("Vui long nhap day du thong tin khach san");
        return;
      }

      if (editingHotelId) {
        await updateHostHotel(editingHotelId, payload);
        toast.success("Da cap nhat khach san");
      } else {
        await createHostHotel(payload);
        toast.success("Da tao khach san moi");
      }

      resetHotelForm();
      await loadHostData();
    } catch (error) {
      console.error("Cannot save hotel", error);
      toast.error(error?.response?.data?.error || "Khong the luu khach san");
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
      toast.success("Da xoa khach san");
      if (editingHotelId === hotelId) {
        resetHotelForm();
      }
      setConfirmDialog(null);
      await loadHostData();
    } catch (error) {
      console.error("Cannot delete hotel", error);
      toast.error(error?.response?.data?.error || "Khong the xoa khach san");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDeleteHotelRequest = (hotel) => {
    setConfirmDialog({
      type: "hotel",
      id: hotel.id,
      title: "Xoa khach san nay?",
      description:
        "Khach san va cac loai phong thuoc khach san nay se bi xoa khoi he thong dang phong cua ban.",
      confirmLabel: "Xoa khach san",
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
        toast.error("Vui long chon khach san va ten phong");
        return;
      }

      if (!Number.isFinite(payload.capacity) || payload.capacity < 1) {
        toast.error("Suc chua phai lon hon hoac bang 1");
        return;
      }

      if (!Number.isFinite(payload.price) || payload.price < 0) {
        toast.error("Gia phong khong hop le");
        return;
      }

      if (editingRoomId) {
        await updateHostRoom(editingRoomId, payload);
        toast.success("Da cap nhat loai phong");
      } else {
        await createHostRoom(payload);
        toast.success("Da tao loai phong moi");
      }

      resetRoomForm();
      await loadHostData();
    } catch (error) {
      console.error("Cannot save room", error);
      toast.error(error?.response?.data?.error || "Khong the luu phong");
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
      toast.success("Da xoa phong");
      if (editingRoomId === roomId) {
        resetRoomForm();
      }
      setConfirmDialog(null);
      await loadHostData();
    } catch (error) {
      console.error("Cannot delete room", error);
      toast.error(error?.response?.data?.error || "Khong the xoa phong");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDeleteRoomRequest = (room) => {
    setConfirmDialog({
      type: "room",
      id: room.id,
      title: "Xoa loai phong nay?",
      description:
        "Loai phong nay se bi go khoi he thong va khong con duoc hien cho nguoi dung dat.",
      confirmLabel: "Xoa phong",
    });
  };

  const handleSubmitInventoryBlock = async (event) => {
    event.preventDefault();

    if (!inventoryRoomId) {
      toast.error("Hay chon mot loai phong de block ton kho");
      return;
    }

    if (!inventoryForm.startDate || !inventoryForm.endDate) {
      toast.error("Vui long chon day du khoang ngay block");
      return;
    }

    if (new Date(inventoryForm.endDate) < new Date(inventoryForm.startDate)) {
      toast.error("Ngay ket thuc block phai sau ngay bat dau");
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
      toast.success("Da them block ton kho");
      await loadHostData();
    } catch (error) {
      console.error("Cannot create inventory block", error);
      toast.error(error?.response?.data?.error || "Khong the block ton kho");
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
      toast.success("Da go block ton kho");
      await loadHostData();
    } catch (error) {
      console.error("Cannot delete inventory block", error);
      toast.error(error?.response?.data?.error || "Khong the xoa block ton kho");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDeleteInventoryBlockRequest = (block) => {
    setConfirmDialog({
      type: "inventory-block",
      id: block.id,
      title: "Go block ton kho nay?",
      description:
        "Thong tin block ton kho se bi xoa va phong se tro lai trang thai mo ban theo ton kho hien co.",
      confirmLabel: "Go block",
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
        confirmLabel={confirmDialog?.confirmLabel || "Xoa"}
        loading={confirmLoading}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialog}
      />

      <section className="host-shell">
        <header className="host-header">
          <div>
            <p className="host-tag">Nguoi cho thue</p>
            <h1>Quan ly hotel, loai phong va ton kho theo ngay</h1>
            <p>
              Quan ly thong tin khach san, nhieu loai phong, chinh sach huy va lich ton
              kho de mo phong mot he thong van hanh thuc te hon.
            </p>
          </div>

          <button type="button" className="host-back-btn" onClick={() => navigate("/")}>
            Ve trang chu
          </button>
        </header>

        {loading ? (
          <div className="host-state">Dang tai du lieu dang phong...</div>
        ) : (
          <>
            <div className="host-grid">
              <section className="host-card">
              <div className="card-head">
                <h2>{editingHotelId ? "Chinh sua khach san" : "Tao khach san moi"}</h2>
                {editingHotelId && (
                  <button type="button" className="ghost-btn" onClick={resetHotelForm}>
                    Huy sua
                  </button>
                )}
              </div>

              <form className="host-form" onSubmit={handleSubmitHotel}>
                <label>
                  <span>Ten khach san</span>
                  <input
                    name="name"
                    value={hotelForm.name}
                    onChange={handleHotelChange}
                    placeholder="Vi du: Happy Stay"
                    required
                  />
                </label>

                <label>
                  <span>Dia chi</span>
                  <input
                    name="address"
                    value={hotelForm.address}
                    onChange={handleHotelChange}
                    placeholder="So nha, duong, phuong"
                    required
                  />
                </label>

                <label>
                  <span>Thanh pho</span>
                  <input
                    name="city"
                    value={hotelForm.city}
                    onChange={handleHotelChange}
                    placeholder="Ha Noi, Da Nang..."
                    required
                  />
                </label>

                <div className="field-row">
                  <label>
                    <span>So sao</span>
                    <input
                      name="starRating"
                      type="number"
                      min="1"
                      max="5"
                      value={hotelForm.starRating}
                      onChange={handleHotelChange}
                      required
                    />
                  </label>

                  <label>
                    <span>Tien nghi</span>
                    <input
                      name="amenities"
                      value={hotelForm.amenities}
                      onChange={handleHotelChange}
                      placeholder="Wifi, Bai do xe, Le tan 24/7"
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    <span>Huy mien phi truoc (ngay)</span>
                    <input
                      name="freeCancellationBeforeDays"
                      type="number"
                      min="0"
                      value={hotelForm.freeCancellationBeforeDays}
                      onChange={handleHotelChange}
                    />
                  </label>

                  <label>
                    <span>Hoan tien tre (%)</span>
                    <input
                      name="lateCancellationRefundRate"
                      type="number"
                      min="0"
                      max="100"
                      value={hotelForm.lateCancellationRefundRate}
                      onChange={handleHotelChange}
                    />
                  </label>
                </div>

                <button type="submit" disabled={savingHotel}>
                  {savingHotel
                    ? "Dang luu..."
                    : editingHotelId
                    ? "Luu khach san"
                    : "Tao khach san"}
                </button>
              </form>

              <div className="host-list">
                <h3>Khach san cua ban</h3>
                {hotels.length === 0 ? (
                  <p className="inline-note">Ban chua tao khach san nao.</p>
                ) : (
                  hotels.map((hotel) => {
                    const meta = approvalMeta(hotel.approvalStatus);

                    return (
                      <article key={hotel.id} className="list-item list-item-stack">
                        <div className="list-item-main">
                          <div className="list-item-top">
                            <strong>{hotel.name}</strong>
                            <span className={`status-chip ${meta.className}`}>{meta.label}</span>
                          </div>
                          <p>{hotel.address}</p>
                          <small>
                            {hotel.city} - {hotel.starRating || 3} sao
                            {Array.isArray(hotel.amenities) && hotel.amenities.length
                              ? ` - ${hotel.amenities.join(", ")}`
                              : ""}
                          </small>
                          <div className="list-item-meta">
                            <span>
                              Huy mien phi truoc {hotel.freeCancellationBeforeDays ?? 0} ngay
                            </span>
                            <span>
                              Hoan tien muon {hotel.lateCancellationRefundRate ?? 0}%
                            </span>
                            <span>
                              Duyet luc {hotel.approvedAt ? formatDateTime(hotel.approvedAt) : "-"}
                            </span>
                          </div>
                          {hotel.approvalNote ? (
                            <p className="approval-note">Ghi chu admin: {hotel.approvalNote}</p>
                          ) : null}
                        </div>
                        <div className="item-actions">
                          <button type="button" onClick={() => handleEditHotel(hotel)}>
                            Sua
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteHotelRequest(hotel)}
                          >
                            Xoa
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              </section>

              <section className="host-card">
              <div className="card-head">
                <h2>{editingRoomId ? "Chinh sua loai phong" : "Tao loai phong moi"}</h2>
                {editingRoomId && (
                  <button type="button" className="ghost-btn" onClick={resetRoomForm}>
                    Huy sua
                  </button>
                )}
              </div>

              <form className="host-form" onSubmit={handleSubmitRoom}>
                <label>
                  <span>Chon khach san</span>
                  <select
                    name="hotelId"
                    value={roomForm.hotelId}
                    onChange={handleRoomChange}
                    required
                    disabled={!hotels.length}
                  >
                    {!hotels.length ? (
                      <option value="">Can tao khach san truoc</option>
                    ) : null}
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Ten phong</span>
                  <input
                    name="name"
                    value={roomForm.name}
                    onChange={handleRoomChange}
                    placeholder="Phong Deluxe, Phong doi..."
                    required
                  />
                </label>

                <div className="field-row">
                  <label>
                    <span>Loai phong</span>
                    <input
                      name="roomType"
                      value={roomForm.roomType}
                      onChange={handleRoomChange}
                      placeholder="STANDARD, DELUXE, SUITE..."
                    />
                  </label>

                  <label>
                    <span>Loai giuong</span>
                    <input
                      name="bedType"
                      value={roomForm.bedType}
                      onChange={handleRoomChange}
                      placeholder="1 king bed, 2 queen..."
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    <span>Suc chua</span>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={roomForm.capacity}
                      onChange={handleRoomChange}
                      required
                    />
                  </label>

                  <label>
                    <span>Gia / dem (VND)</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="10000"
                      value={roomForm.price}
                      onChange={handleRoomChange}
                      required
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    <span>Tong so phong</span>
                    <input
                      name="totalUnits"
                      type="number"
                      min="1"
                      value={roomForm.totalUnits}
                      onChange={handleRoomChange}
                      required
                    />
                  </label>

                  <label>
                    <span>Tien nghi phong</span>
                    <input
                      name="amenities"
                      value={roomForm.amenities}
                      onChange={handleRoomChange}
                      placeholder="May lanh, Ban cong, Bon tam..."
                    />
                  </label>
                </div>

                <label>
                  <span>Mo ta ngan</span>
                  <textarea
                    name="description"
                    value={roomForm.description}
                    onChange={handleRoomChange}
                    placeholder="Mo ta diem khac biet cua loai phong nay"
                  />
                </label>

                <button type="submit" disabled={savingRoom || !hotels.length}>
                  {savingRoom
                    ? "Dang luu..."
                    : editingRoomId
                    ? "Luu loai phong"
                    : "Tao loai phong"}
                </button>
              </form>

              <div className="host-list">
                <h3>Danh sach loai phong da dang</h3>
                {rooms.length === 0 ? (
                  <p className="inline-note">Chua co phong nao duoc dang.</p>
                ) : (
                  rooms.map((room) => {
                    const hotel = hotelsById[room.hotelId];
                    const activeInventory = inventoryRoomId === room.id;
                    return (
                      <article key={room.id} className="list-item list-item-stack">
                        <div className="list-item-main">
                          <div className="list-item-top">
                            <strong>{room.name}</strong>
                            <span className={`status-chip ${activeInventory ? "info" : "neutral"}`}>
                              {room.roomType || "STANDARD"}
                            </span>
                          </div>
                          <p>{hotel?.name || "Khach san khong ton tai"}</p>
                          <small>
                            {room.capacity} khach -{" "}
                            {Number.isFinite(Number(room.price))
                              ? currencyFormatter.format(Number(room.price))
                              : "-"}
                          </small>
                          <div className="list-item-meta">
                            <span>Tong so phong: {room.totalUnits || 1}</span>
                            <span>Con trong: {room.availableUnits ?? room.totalUnits ?? 1}</span>
                            <span>{room.bedType || "Chua khai bao loai giuong"}</span>
                          </div>
                          {room.description ? (
                            <p className="approval-note">{room.description}</p>
                          ) : null}
                        </div>
                        <div className="item-actions item-actions-stack">
                          <button type="button" onClick={() => handleEditRoom(room)}>
                            Sua
                          </button>
                          <button
                            type="button"
                            className={activeInventory ? "active" : ""}
                            onClick={() => setInventoryRoomId(room.id)}
                          >
                            Ton kho
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteRoomRequest(room)}
                          >
                            Xoa
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              </section>
            </div>

            <section className="host-card host-card-wide">
              <div className="card-head">
                <div>
                  <h2>Lich phong theo ngay va quan ly ton kho</h2>
                  <p className="inline-note">
                    Block phong bao tri, khoa phong dip le va xem ton kho con trong theo tung ngay.
                  </p>
                </div>

                <label className="inventory-room-picker">
                  <span>Loai phong dang xem</span>
                  <select
                    value={inventoryRoomId}
                    onChange={(event) => setInventoryRoomId(event.target.value)}
                    disabled={!rooms.length}
                  >
                    {!rooms.length ? <option value="">Chua co loai phong</option> : null}
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {hotelsById[room.hotelId]?.name || "Khach san"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!selectedInventoryRoom ? (
                <p className="inline-note">Tao it nhat 1 loai phong de bat dau quan ly ton kho.</p>
              ) : (
                <>
                  <div className="inventory-toolbar">
                    <div className="inventory-summary">
                      <strong>{selectedInventoryRoom.name}</strong>
                      <span>{selectedInventoryRoom.roomType || "STANDARD"}</span>
                      <p>
                        Tong {selectedInventoryRoom.totalUnits || 1} phong tai{" "}
                        {hotelsById[selectedInventoryRoom.hotelId]?.name || "-"}
                      </p>
                    </div>

                    <div className="inventory-range">
                      <label>
                        <span>Tu ngay</span>
                        <input
                          type="date"
                          name="startDate"
                          value={inventoryRange.startDate}
                          onChange={handleInventoryRangeChange}
                        />
                      </label>
                      <label>
                        <span>Den ngay</span>
                        <input
                          type="date"
                          name="endDate"
                          value={inventoryRange.endDate}
                          onChange={handleInventoryRangeChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="inventory-grid">
                    <form className="host-form inventory-form" onSubmit={handleSubmitInventoryBlock}>
                      <h3>Tao block ton kho</h3>

                      <div className="field-row">
                        <label>
                          <span>Bat dau</span>
                          <input
                            type="date"
                            name="startDate"
                            value={inventoryForm.startDate}
                            onChange={handleInventoryFormChange}
                          />
                        </label>

                        <label>
                          <span>Ket thuc</span>
                          <input
                            type="date"
                            name="endDate"
                            value={inventoryForm.endDate}
                            onChange={handleInventoryFormChange}
                          />
                        </label>
                      </div>

                      <label>
                        <span>So phong block</span>
                        <input
                          type="number"
                          min="1"
                          max={selectedInventoryRoom.totalUnits || 1}
                          name="blockedUnits"
                          value={inventoryForm.blockedUnits}
                          onChange={handleInventoryFormChange}
                        />
                      </label>

                      <label>
                        <span>Ly do</span>
                        <textarea
                          name="reason"
                          value={inventoryForm.reason}
                          onChange={handleInventoryFormChange}
                          placeholder="Vi du: bao tri phong, khoa ban dip le, su kien noi bo"
                        />
                      </label>

                      <button type="submit" disabled={inventorySaving}>
                        {inventorySaving ? "Dang block..." : "Them block ton kho"}
                      </button>
                    </form>

                    <div className="inventory-side">
                      <div className="inventory-table-wrap">
                        <div className="table-section-head">
                          <h3>Lich ton kho</h3>
                          <span>{inventoryCalendar.length} ngay</span>
                        </div>

                        {inventoryLoading ? (
                          <p className="inline-note">Dang tai lich ton kho...</p>
                        ) : inventoryCalendar.length === 0 ? (
                          <p className="inline-note">Chua co du lieu ton kho trong khoang ngay nay.</p>
                        ) : (
                          <table className="inventory-table">
                            <thead>
                              <tr>
                                <th>Ngay</th>
                                <th>Tong</th>
                                <th>Da dat</th>
                                <th>Block</th>
                                <th>Con trong</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryCalendar.map((day) => (
                                <tr key={day.date}>
                                  <td>{formatDate(day.date)}</td>
                                  <td>{day.totalUnits}</td>
                                  <td>{day.bookedUnits}</td>
                                  <td>{day.blockedUnits}</td>
                                  <td>
                                    <span
                                      className={`status-chip ${
                                        Number(day.availableUnits) > 0 ? "success" : "danger"
                                      }`}
                                    >
                                      {day.availableUnits}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="inventory-block-list">
                        <div className="table-section-head">
                          <h3>Danh sach block</h3>
                          <span>{inventoryBlocks.length} muc</span>
                        </div>

                        {inventoryBlocks.length === 0 ? (
                          <p className="inline-note">Chua co block ton kho nao cho loai phong nay.</p>
                        ) : (
                          inventoryBlocks.map((block) => (
                            <article key={block.id} className="inventory-block-item">
                              <div>
                                <strong>
                                  {formatDate(block.startDate)} - {formatDate(block.endDate)}
                                </strong>
                                <p>Block {block.blockedUnits} phong</p>
                                <small>{block.reason || "Khong co ghi chu"}</small>
                              </div>
                              <button
                                type="button"
                                className="ghost-btn danger"
                                onClick={() => handleDeleteInventoryBlockRequest(block)}
                              >
                                Go block
                              </button>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default HostRooms;

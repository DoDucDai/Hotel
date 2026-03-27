import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import {
  createHostHotel,
  createHostRoom,
  deleteHostHotel,
  deleteHostRoom,
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
};

const initialRoomForm = {
  hotelId: "",
  name: "",
  capacity: 1,
  price: 0,
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

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

function HostRooms() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [hotelForm, setHotelForm] = useState(initialHotelForm);
  const [roomForm, setRoomForm] = useState(initialRoomForm);

  const [editingHotelId, setEditingHotelId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");

  const [savingHotel, setSavingHotel] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);

  const hotelsById = useMemo(() => {
    return hotels.reduce((acc, hotel) => {
      if (hotel?.id) {
        acc[hotel.id] = hotel;
      }
      return acc;
    }, {});
  }, [hotels]);

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

  const handleHotelChange = (event) => {
    const { name, value } = event.target;
    setHotelForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoomChange = (event) => {
    const { name, value } = event.target;
    setRoomForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetHotelForm = () => {
    setEditingHotelId("");
    setHotelForm(initialHotelForm);
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
        amenities: hotelForm.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (!payload.name || !payload.address || !payload.city) {
        toast.error("Vui long nhap day du thong tin khach san");
        setSavingHotel(false);
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
    });
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm("Xoa khach san nay se xoa ca cac phong da dang. Ban chac chan?")) {
      return;
    }

    try {
      await deleteHostHotel(hotelId);
      toast.success("Da xoa khach san");
      if (editingHotelId === hotelId) {
        resetHotelForm();
      }
      await loadHostData();
    } catch (error) {
      console.error("Cannot delete hotel", error);
      toast.error(error?.response?.data?.error || "Khong the xoa khach san");
    }
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
      };

      if (!payload.hotelId || !payload.name) {
        toast.error("Vui long chon khach san va ten phong");
        setSavingRoom(false);
        return;
      }

      if (!Number.isFinite(payload.capacity) || payload.capacity < 1) {
        toast.error("Suc chua phai lon hon hoac bang 1");
        setSavingRoom(false);
        return;
      }

      if (!Number.isFinite(payload.price) || payload.price < 0) {
        toast.error("Gia phong khong hop le");
        setSavingRoom(false);
        return;
      }

      if (editingRoomId) {
        await updateHostRoom(editingRoomId, payload);
        toast.success("Da cap nhat phong");
      } else {
        await createHostRoom(payload);
        toast.success("Da dang phong moi");
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
    });
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Ban co chac chan muon xoa phong nay?")) {
      return;
    }

    try {
      await deleteHostRoom(roomId);
      toast.success("Da xoa phong");
      if (editingRoomId === roomId) {
        resetRoomForm();
      }
      await loadHostData();
    } catch (error) {
      console.error("Cannot delete room", error);
      toast.error(error?.response?.data?.error || "Khong the xoa phong");
    }
  };

  return (
    <main className="host-page">
      <section className="host-shell">
        <header className="host-header">
          <div>
            <p className="host-tag">Nguoi cho thue</p>
            <h1>Dang phong len he thong</h1>
            <p>
              Quan ly thong tin khach san va phong cua ban. Chi ban moi co the sua
              hoac xoa cac phong da dang.
            </p>
          </div>

          <button type="button" className="host-back-btn" onClick={() => navigate("/")}>
            Ve trang chu
          </button>
        </header>

        {loading ? (
          <div className="host-state">Dang tai du lieu dang phong...</div>
        ) : (
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
                  hotels.map((hotel) => (
                    <article key={hotel.id} className="list-item">
                      <div>
                        <strong>{hotel.name}</strong>
                        <p>{hotel.address}</p>
                        <small>
                          {hotel.city} - {hotel.starRating || 3} sao
                          {Array.isArray(hotel.amenities) && hotel.amenities.length
                            ? ` - ${hotel.amenities.join(", ")}`
                            : ""}
                        </small>
                      </div>
                      <div className="item-actions">
                        <button type="button" onClick={() => handleEditHotel(hotel)}>
                          Sua
                        </button>
                        <button type="button" className="danger" onClick={() => handleDeleteHotel(hotel.id)}>
                          Xoa
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="host-card">
              <div className="card-head">
                <h2>{editingRoomId ? "Chinh sua phong" : "Dang phong moi"}</h2>
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

                <button type="submit" disabled={savingRoom || !hotels.length}>
                  {savingRoom
                    ? "Dang luu..."
                    : editingRoomId
                    ? "Luu phong"
                    : "Dang phong"}
                </button>
              </form>

              <div className="host-list">
                <h3>Danh sach phong da dang</h3>
                {rooms.length === 0 ? (
                  <p className="inline-note">Chua co phong nao duoc dang.</p>
                ) : (
                  rooms.map((room) => {
                    const hotel = hotelsById[room.hotelId];
                    return (
                      <article key={room.id} className="list-item">
                        <div>
                          <strong>{room.name}</strong>
                          <p>{hotel?.name || "Khach san khong ton tai"}</p>
                          <small>
                            {room.capacity} khach -{" "}
                            {Number.isFinite(Number(room.price))
                              ? currencyFormatter.format(Number(room.price))
                              : "-"}
                          </small>
                        </div>
                        <div className="item-actions">
                          <button type="button" onClick={() => handleEditRoom(room)}>
                            Sua
                          </button>
                          <button type="button" className="danger" onClick={() => handleDeleteRoom(room.id)}>
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
        )}
      </section>
    </main>
  );
}

export default HostRooms;

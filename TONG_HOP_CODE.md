# 📦 TỔNG HỢP CODE - WEBSITE ĐẶT PHÒNG KHÁCH SẠN

## 📋 Mô tả
Website đặt phòng khách sạn giống Agoda, xây dựng bằng React + TypeScript + Tailwind CSS

### Tính năng chính:
- ✅ Thanh tìm kiếm khách sạn (điểm đến, check-in/out, số khách)
- ✅ Hiển thị các điểm đến phổ biến
- ✅ Danh sách khách sạn nổi bật với đánh giá, giá cả
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Animation và hover effects
- ✅ Header và Footer đầy đủ

---

## 📁 CẤU TRÚC THỨ MỤC

```
project/
├── src/
│   └── app/
│       ├── App.tsx                          # Trang chính
│       └── components/
│           ├── SearchBar.tsx                # Component thanh tìm kiếm
│           ├── DestinationCard.tsx          # Component card điểm đến
│           └── HotelCard.tsx                # Component card khách sạn
├── package.json                             # Dependencies
└── README.md
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT

### 1. Tạo React project mới:
```bash
npm create vite@latest my-hotel-booking -- --template react-ts
cd my-hotel-booking
```

### 2. Cài đặt dependencies:
```bash
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer @tailwindcss/vite
npx tailwindcss init
```

### 3. Copy các file code bên dưới vào project

### 4. Chạy project:
```bash
npm run dev
```

---

## 📄 CODE CÁC FILE

### 1️⃣ **package.json** (phần dependencies cần thiết)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.487.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.12",
    "@vitejs/plugin-react": "^4.7.0",
    "tailwindcss": "^4.1.12",
    "typescript": "^5.6.3",
    "vite": "^6.3.5"
  }
}
```

---

### 2️⃣ **src/app/App.tsx** (Trang chính - 271 dòng)

```tsx
import { useState } from 'react';
import { Search, MapPin, Calendar, Users, Star, Wifi, Coffee, Utensils, Car } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { DestinationCard } from './components/DestinationCard';
import { HotelCard } from './components/HotelCard';

export default function App() {
  const [searchQuery, setSearchQuery] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2
  });

  const popularDestinations = [
    {
      name: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 1243
    },
    {
      name: 'Bangkok',
      country: 'Thailand',
      image: 'https://images.unsplash.com/photo-1575380591643-b2c92368dc6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 2156
    },
    {
      name: 'Singapore',
      country: 'Singapore',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 892
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 1567
    },
    {
      name: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw2fHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 1834
    },
    {
      name: 'London',
      country: 'UK',
      image: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxjaXR5JTIwc2t5bGluZSUyMGRlc3RpbmF0aW9uJTIwdHJhdmVsfGVufDF8fHx8MTc3OTU2NTYxOHww&ixlib=rb-4.1.0&q=80&w=1080',
      properties: 1923
    }
  ];

  const featuredHotels = [
    {
      id: 1,
      name: 'Grand Palace Hotel',
      location: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1683290844875-0eee4089069a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3OTUxNDUyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.8,
      reviews: 1256,
      price: 299,
      amenities: ['wifi', 'parking', 'restaurant', 'pool']
    },
    {
      id: 2,
      name: 'Seaside Resort & Spa',
      location: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1678913308053-316cee77afe9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3OTUxNDUyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.9,
      reviews: 2134,
      price: 189,
      amenities: ['wifi', 'pool', 'spa', 'restaurant']
    },
    {
      id: 3,
      name: 'Blue Heritage Hotel',
      location: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1723465308831-29da05e011f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3OTUxNDUyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.7,
      reviews: 987,
      price: 245,
      amenities: ['wifi', 'breakfast', 'view', 'restaurant']
    },
    {
      id: 4,
      name: 'Modern City Suites',
      location: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1771293549382-62829fad8f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3OTUxNDUyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.6,
      reviews: 743,
      price: 210,
      amenities: ['wifi', 'gym', 'parking', 'restaurant']
    },
    {
      id: 5,
      name: 'Luxury Tower Hotel',
      location: 'Dubai, UAE',
      image: 'https://images.unsplash.com/photo-1634041441461-a1789d008830?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3OTUxNDUyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.9,
      reviews: 1876,
      price: 425,
      amenities: ['wifi', 'pool', 'spa', 'restaurant']
    },
    {
      id: 6,
      name: 'Boutique Garden Hotel',
      location: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHJvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3Nzk1NjU2MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.8,
      reviews: 1432,
      price: 320,
      amenities: ['wifi', 'breakfast', 'garden', 'restaurant']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">TravelBooker</h1>
              <nav className="hidden md:flex gap-6">
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Hotels</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Flights</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Packages</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Deals</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-700 hover:text-blue-600 transition-colors">Sign In</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Up</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Stay</h2>
            <p className="text-xl text-blue-100">Search from millions of hotels worldwide</p>
          </div>

          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">Popular Destinations</h3>
              <p className="text-gray-600 mt-2">Explore trending cities around the world</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDestinations.map((destination, index) => (
              <DestinationCard key={index} destination={destination} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">Featured Hotels</h3>
              <p className="text-gray-600 mt-2">Hand-picked properties with excellent ratings</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Book With Us</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Best Price Guarantee</h4>
              <p className="text-gray-600">Find a lower price? We'll refund the difference</p>
            </div>

            <div className="bg-white p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Verified Reviews</h4>
              <p className="text-gray-600">Read authentic reviews from real travelers</p>
            </div>

            <div className="bg-white p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">24/7 Support</h4>
              <p className="text-gray-600">Get help anytime, anywhere you travel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">TravelBooker</h4>
              <p className="text-sm">Your trusted partner for finding the perfect accommodation worldwide.</p>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cancellation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Partners</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">List Your Property</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Affiliate Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Advertising</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners Hub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 TravelBooker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

### 3️⃣ **src/app/components/SearchBar.tsx** (105 dòng)

```tsx
import { MapPin, Calendar, Users, Search } from 'lucide-react';

interface SearchQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface SearchBarProps {
  searchQuery: SearchQuery;
  setSearchQuery: (query: SearchQuery) => void;
}

export function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  const handleSearch = () => {
    console.log('Searching with:', searchQuery);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where to?
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="City or hotel name"
              value={searchQuery.destination}
              onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Check-in Date */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-in
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={searchQuery.checkIn}
              onChange={(e) => setSearchQuery({ ...searchQuery, checkIn: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check-out
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={searchQuery.checkOut}
              onChange={(e) => setSearchQuery({ ...searchQuery, checkOut: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guests
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={searchQuery.guests}
              onChange={(e) => setSearchQuery({ ...searchQuery, guests: Number(e.target.value) })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
              <option value={5}>5+ Guests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full md:w-auto mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Search className="w-5 h-5" />
        Search Hotels
      </button>
    </div>
  );
}
```

---

### 4️⃣ **src/app/components/DestinationCard.tsx** (38 dòng)

```tsx
import { MapPin } from 'lucide-react';

interface Destination {
  name: string;
  country: string;
  image: string;
  properties: number;
}

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <h4 className="text-2xl font-bold">{destination.name}</h4>
        </div>
        <p className="text-sm text-gray-200">{destination.country}</p>
        <p className="text-sm text-gray-300 mt-2">{destination.properties.toLocaleString()} properties</p>
      </div>
    </div>
  );
}
```

---

### 5️⃣ **src/app/components/HotelCard.tsx** (92 dòng)

```tsx
import { Star, MapPin, Wifi, Car, Utensils, Coffee } from 'lucide-react';

interface Hotel {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  amenities: string[];
}

interface HotelCardProps {
  hotel: Hotel;
}

const amenityIcons: Record<string, JSX.Element> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
  pool: <Coffee className="w-4 h-4" />,
  spa: <Coffee className="w-4 h-4" />,
  gym: <Coffee className="w-4 h-4" />,
  breakfast: <Utensils className="w-4 h-4" />,
  view: <MapPin className="w-4 h-4" />,
  garden: <MapPin className="w-4 h-4" />
};

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">{hotel.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h4 className="font-semibold text-lg mb-1 text-gray-900 group-hover:text-blue-600 transition-colors">
          {hotel.name}
        </h4>

        <div className="flex items-center gap-1 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{hotel.location}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-gray-900">{hotel.rating}</span>
            <span className="text-gray-600">({hotel.reviews.toLocaleString()} reviews)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {hotel.amenities.slice(0, 4).map((amenity, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-xs"
            >
              {amenityIcons[amenity]}
              <span className="capitalize">{amenity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Starting from</p>
            <p className="text-2xl font-bold text-blue-600">
              ${hotel.price}
              <span className="text-sm font-normal text-gray-600">/night</span>
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 TAILWIND CONFIG (nếu cần)

Nếu Tailwind chưa hoạt động, tạo file `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Và thêm vào `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 📌 GHI CHÚ QUAN TRỌNG

1. **Images**: Đang dùng Unsplash API, nếu không load được thì thay bằng ảnh local
2. **Icons**: Sử dụng `lucide-react` package
3. **Responsive**: Đã tối ưu cho mobile, tablet, desktop
4. **State Management**: Hiện tại dùng useState đơn giản, có thể nâng cấp lên Redux/Zustand
5. **API**: Chưa kết nối backend, có thể thêm axios để call API thật

---

## 🔧 TÍNH NĂNG CÓ THỂ MỞ RỘNG

- [ ] Kết nối API backend thật
- [ ] Thêm trang chi tiết khách sạn
- [ ] Hệ thống đăng nhập/đăng ký
- [ ] Giỏ hàng và thanh toán
- [ ] Lọc và sắp xếp kết quả tìm kiếm
- [ ] Google Maps integration
- [ ] Đa ngôn ngữ (i18n)
- [ ] Dark mode

---

## 📞 HỖ TRỢ

Nếu có vấn đề khi setup, kiểm tra:
1. Node version >= 18
2. npm hoặc pnpm đã cài đặt
3. Đã chạy `npm install` đầy đủ
4. Port 5173 chưa bị chiếm dụng

---

**🎉 Chúc bạn code vui vẻ!**

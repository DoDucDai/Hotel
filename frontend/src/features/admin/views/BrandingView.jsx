import React, { useState, useEffect } from "react";
import { useBranding } from "../../../context/BrandingContext";
import BrandLogo from "../../../components/BrandLogo";
import { useToast } from "../../../components/ToastProvider";

export default function BrandingView() {
  const toast = useToast();
  const {
    brandName,
    brandSlogan,
    brandTabTitle,
    brandLogoStyle,
    brandColor,
    updateBranding,
    resetBranding,
  } = useBranding();

  // Local state for interactive editing before save
  const [name, setName] = useState(brandName);
  const [slogan, setSlogan] = useState(brandSlogan);
  const [tabTitle, setTabTitle] = useState(brandTabTitle);
  const [logoStyle, setLogoStyle] = useState(brandLogoStyle);
  const [color, setColor] = useState(brandColor);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if context changes externally
  useEffect(() => {
    setName(brandName);
    setSlogan(brandSlogan);
    setTabTitle(brandTabTitle);
    setLogoStyle(brandLogoStyle);
    setColor(brandColor);
  }, [brandName, brandSlogan, brandTabTitle, brandLogoStyle, brandColor]);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate luxury saving micro-animation
    setTimeout(() => {
      updateBranding({
        brandName: name.trim() || "StayLuxe",
        brandSlogan: slogan.trim() || "Find your premium stay",
        brandTabTitle: tabTitle.trim() || "StayLuxe | Kênh đặt phòng khách sạn cao cấp",
        brandLogoStyle: logoStyle,
        brandColor: color,
      });
      setIsSaving(false);
      toast.success("Đã áp dụng và lưu cấu hình thương hiệu thành công!");
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục thương hiệu mặc định?")) {
      resetBranding();
      toast.success("Đã khôi phục bộ thương hiệu StayLuxe mặc định!");
    }
  };

  // Color options definitions
  const colorOptions = [
    { id: "indigo", name: "Classic Indigo", hex: "#1170E4", secondary: "#002F6C" },
    { id: "gold", name: "Luxury Gold", hex: "#B38F4D", secondary: "#1E293B" },
    { id: "emerald", name: "Forest Emerald", hex: "#10B981", secondary: "#064E3B" },
    { id: "rosewood", name: "Warm Rosewood", hex: "#BE123C", secondary: "#4C0519" },
  ];

  // Selected color details for dynamic preview styles
  const activeColorDetails = colorOptions.find((c) => c.id === color) || colorOptions[0];

  return (
    <section className="admin-branding-section">
      <style>{`
        .admin-branding-section {
          padding: 1.5rem;
          animation: fadeUp 0.4s ease-out;
        }
        .branding-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .branding-grid {
            grid-template-columns: 1fr;
          }
        }
        .branding-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }
        .branding-card h3 {
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .branding-card p.subtitle {
          color: #64748B;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .branding-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .form-group input {
          font-family: inherit;
          padding: 12px 14px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.95rem;
          background: #F8FAFC;
          transition: all 0.2s ease;
        }
        .form-group input:focus {
          border-color: ${activeColorDetails.hex};
          background: #ffffff;
          box-shadow: 0 0 0 3px \${activeColorDetails.hex}1a;
        }
        
        /* Logo style selector grid */
        .logo-selector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 6px;
        }
        .logo-option-card {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          background: #F8FAFC;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .logo-option-card:hover {
          border-color: #CBD5E1;
          transform: translateY(-2px);
          background: #ffffff;
        }
        .logo-option-card.active {
          border-color: ${activeColorDetails.hex};
          background: \${activeColorDetails.hex}05;
          box-shadow: 0 4px 12px \${activeColorDetails.hex}15;
        }
        .logo-option-card span.logo-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          text-transform: capitalize;
        }
        .logo-option-card.active span.logo-label {
          color: ${activeColorDetails.hex};
        }

        /* Color theme selector grid */
        .color-selector-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }
        .color-option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          cursor: pointer;
          background: #F8FAFC;
          transition: all 0.2s ease;
        }
        .color-option-row:hover {
          border-color: #CBD5E1;
          background: #ffffff;
        }
        .color-option-row.active {
          border-color: ${activeColorDetails.hex};
          background: \${activeColorDetails.hex}05;
        }
        .color-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .color-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }
        .color-option-row.active .color-name {
          color: ${activeColorDetails.hex};
        }
        .color-indicator {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .color-option-row.active .color-indicator {
          border-color: ${activeColorDetails.hex};
          background: ${activeColorDetails.hex};
        }

        /* Actions block */
        .branding-actions {
          display: flex;
          gap: 12px;
          margin-top: 1.5rem;
        }
        .btn-brand-save {
          flex: 1;
          background: ${activeColorDetails.hex};
          color: #ffffff;
          font-weight: 700;
          padding: 14px;
          border-radius: 10px;
          font-size: 0.95rem;
          box-shadow: 0 4px 12px \${activeColorDetails.hex}25;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s ease;
        }
        .btn-brand-save:hover:not(:disabled) {
          background: ${activeColorDetails.secondary};
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }
        .btn-brand-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-brand-reset {
          background: #F1F5F9;
          color: #475569;
          font-weight: 600;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        .btn-brand-reset:hover {
          background: #E2E8F0;
          color: #1E293B;
        }

        /* Preview container styling */
        .preview-sticky {
          position: sticky;
          top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .preview-badge {
          background: \${activeColorDetails.hex}15;
          color: ${activeColorDetails.hex};
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        /* Interactive browser mockup */
        .browser-mockup {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        .browser-bar {
          background: #E2E8F0;
          height: 38px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #CBD5E1;
        }
        .browser-dots {
          display: flex;
          gap: 6px;
        }
        .browser-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #A0AEC0;
        }
        .browser-dot.red { background: #FC8181; }
        .browser-dot.yellow { background: #F6AD55; }
        .browser-dot.green { background: #68D391; }
        
        .browser-tab {
          background: #ffffff;
          height: 28px;
          border-radius: 8px 8px 0 0;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          max-width: 220px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.02);
        }
        .browser-tab-fav {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, ${activeColorDetails.hex} 0%, ${activeColorDetails.secondary} 100%);
          color: #ffffff;
          border-radius: 4px;
          width: 14px;
          height: 14px;
          font-size: 0.5rem;
        }
        
        /* Navbar preview mockup */
        .mock-navbar-shell {
          background: #ffffff;
          border-bottom: 1px solid #E2E8F0;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mock-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mock-logo-mark {
          background: linear-gradient(135deg, ${activeColorDetails.hex} 0%, ${activeColorDetails.secondary} 100%);
          box-shadow: 0 4px 10px \${activeColorDetails.hex}30;
        }
        .mock-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          text-align: left;
        }
        .mock-logo-text strong {
          color: #0F172A;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .mock-logo-text small {
          color: #64748B;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .mock-menu {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
        }
        .mock-menu span.active {
          color: ${activeColorDetails.hex};
        }
        
        .mock-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mock-btn-cta {
          background: ${activeColorDetails.hex};
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          box-shadow: 0 2px 6px \${activeColorDetails.hex}20;
        }
        
        /* Dummy body preview */
        .mock-body {
          padding: 24px;
          background: #F8FAFC;
          text-align: center;
        }
        .mock-body-hero {
          background: #ffffff;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .mock-body-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: ${activeColorDetails.hex};
          background: \${activeColorDetails.hex}10;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .mock-body-hero h4 {
          font-size: 1.1rem;
          color: #0F172A;
          margin: 0;
          font-weight: 800;
        }
        .mock-body-hero p {
          font-size: 0.78rem;
          color: #64748B;
          margin: 0;
          max-width: 280px;
          line-height: 1.4;
        }
        .mock-body-btn {
          background: ${activeColorDetails.hex};
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 4px 10px \subactive;
        }
      `}</style>

      <div className="branding-grid">
        {/* Form settings */}
        <article className="branding-card">
          <h3>
            ⚙️ Cấu hình thương hiệu
          </h3>
          <p className="subtitle">
            Cài đặt các thuộc tính nhận diện toàn website. Các thay đổi sẽ được lưu trữ cục bộ và áp dụng tức thì.
          </p>

          <form className="branding-form" onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="brand-name-input">Tên thương hiệu (Website Name)</label>
              <input
                id="brand-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: StayLuxe, RoyalStay..."
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="brand-slogan-input">Khẩu hiệu phụ (Brand Slogan)</label>
              <input
                id="brand-slogan-input"
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ví dụ: Find your perfect stay..."
                maxLength={45}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="brand-tab-input">Tiêu đề tab trình duyệt (Browser Tab Title)</label>
              <input
                id="brand-tab-input"
                type="text"
                value={tabTitle}
                onChange={(e) => setTabTitle(e.target.value)}
                placeholder="Tiêu đề hiển thị trên thanh tab trình duyệt..."
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label>Phong cách thiết kế Logo (Logo Mark Style)</label>
              <div className="logo-selector-grid">
                {[
                  { id: "crown", label: "Hoàng Gia", icon: "👑" },
                  { id: "compass", label: "La Bàn", icon: "🧭" },
                  { id: "key", label: "Chìa Khóa", icon: "🔑" },
                  { id: "palm", label: "Resort", icon: "🌴" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`logo-option-card ${logoStyle === opt.id ? "active" : ""}`}
                    onClick={() => setLogoStyle(opt.id)}
                  >
                    <BrandLogo
                      logoStyle={opt.id}
                      width={30}
                      height={30}
                      className={logoStyle === opt.id ? "mock-logo-mark" : ""}
                      style={{
                        background: logoStyle === opt.id ? undefined : "#CBD5E1",
                      }}
                    />
                    <span className="logo-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tông màu nhấn chủ đạo (Theme Primary Color)</label>
              <div className="color-selector-list">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`color-option-row ${color === opt.id ? "active" : ""}`}
                    onClick={() => setColor(opt.id)}
                  >
                    <div className="color-meta">
                      <span className="color-swatch" style={{ background: opt.hex }} />
                      <span className="color-name">{opt.name}</span>
                    </div>
                    <span className="color-indicator" />
                  </button>
                ))}
              </div>
            </div>

            <div className="branding-actions">
              <button type="submit" className="btn-brand-save" disabled={isSaving}>
                {isSaving ? "Đang áp dụng..." : "💾 Lưu & Áp dụng"}
              </button>
              <button type="button" className="btn-brand-reset" onClick={handleReset}>
                Khôi phục mặc định
              </button>
            </div>
          </form>
        </article>

        {/* Live Preview Column */}
        <div className="preview-sticky">
          <div className="preview-header">
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>✨ Live Preview (Thời gian thực)</h3>
            <span className="preview-badge">Chưa lưu lưu</span>
          </div>

          <div className="browser-mockup">
            {/* Browser frame */}
            <div className="browser-bar">
              <div className="browser-dots">
                <span className="browser-dot red" />
                <span className="browser-dot yellow" />
                <span className="browser-dot green" />
              </div>
              <div className="browser-tab">
                <span className="browser-tab-fav">
                  👑
                </span>
                {tabTitle || "StayLuxe | Kênh đặt phòng"}
              </div>
            </div>

            {/* Mock Header/Navbar */}
            <div className="mock-navbar-shell">
              <div className="mock-logo">
                <BrandLogo logoStyle={logoStyle} width={30} height={30} className="mock-logo-mark" />
                <div className="mock-logo-text">
                  <strong>{name || "StayLuxe"}</strong>
                  <small>{slogan || "Find your premium stay"}</small>
                </div>
              </div>
              <div className="mock-menu">
                <span className="active">Trang chủ</span>
                <span>Khách sạn</span>
              </div>
              <div className="mock-actions">
                <span className="mock-btn-cta">Đặt phòng</span>
              </div>
            </div>

            {/* Mock Landing body */}
            <div className="mock-body">
              <div className="mock-body-hero">
                <span className="mock-body-badge">Trải nghiệm đặt phòng mới</span>
                <h4>Chào mừng bạn đến với {name || "StayLuxe"}</h4>
                <p>Khung tìm kiếm khách sạn và ưu đãi độc quyền đang đợi khám phá phá.</p>
                <button type="button" className="mock-body-btn" style={{ background: activeColorDetails.hex }}>
                  Tìm khách sạn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

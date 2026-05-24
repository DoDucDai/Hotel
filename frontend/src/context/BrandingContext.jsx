import { createContext, useContext, useEffect, useState } from "react";

const BrandingContext = createContext(null);

const DEFAULT_BRANDING = {
  brandName: "StayLuxe",
  brandSlogan: "Find your premium stay",
  brandTabTitle: "StayLuxe | Kênh đặt phòng khách sạn cao cấp",
  brandLogoStyle: "crown",
  brandColor: "indigo",
};

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(() => {
    try {
      const saved = localStorage.getItem("site_branding");
      return saved ? { ...DEFAULT_BRANDING, ...JSON.parse(saved) } : DEFAULT_BRANDING;
    } catch (e) {
      console.error("Failed to parse branding from localStorage", e);
      return DEFAULT_BRANDING;
    }
  });

  // Apply browser tab title
  useEffect(() => {
    if (branding.brandTabTitle) {
      document.title = branding.brandTabTitle;
    }
  }, [branding.brandTabTitle]);

  // Apply theme color class to body
  useEffect(() => {
    const body = document.body;
    // Remove existing theme classes
    const themeClasses = ["theme-indigo", "theme-gold", "theme-emerald", "theme-rosewood"];
    themeClasses.forEach((cls) => body.classList.remove(cls));
    
    // Add current theme class
    body.classList.add(`theme-${branding.brandColor || "indigo"}`);
  }, [branding.brandColor]);

  const updateBranding = (newSettings) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("site_branding", JSON.stringify(updated));
      return updated;
    });
  };

  const resetBranding = () => {
    localStorage.setItem("site_branding", JSON.stringify(DEFAULT_BRANDING));
    setBranding(DEFAULT_BRANDING);
  };

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        updateBranding,
        resetBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}

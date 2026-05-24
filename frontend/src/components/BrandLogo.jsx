import React from "react";

export default function BrandLogo({ logoStyle = "crown", width = 38, height = 38, className = "" }) {
  // Common container style to match old .logo-mark design
  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: "10px", // var(--radius-md) equivalent
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };


  // Render SVG based on chosen brand style
  const renderSvg = () => {
    switch (logoStyle) {
      case "compass":
        return (
          <svg
            viewBox="0 0 24 24"
            width="60%"
            height="60%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg compass-svg"
          >
            <style>{`
              @keyframes rotateCompass {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .compass-svg:hover {
                animation: rotateCompass 6s linear infinite;
              }
            `}</style>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="12" cy="12" r="8" />
            <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" opacity="0.8" />
            <circle cx="12" cy="12" r="1.5" fill="#fff" />
          </svg>
        );

      case "key":
        return (
          <svg
            viewBox="0 0 24 24"
            width="60%"
            height="60%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg key-svg"
          >
            <style>{`
              @keyframes wiggleKey {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-8deg); }
                75% { transform: rotate(8deg); }
              }
              .key-svg:hover {
                animation: wiggleKey 0.6s ease-in-out infinite;
                transform-origin: 30% 70%;
              }
            `}</style>
            {/* Key head */}
            <circle cx="7.5" cy="16.5" r="4.5" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
            {/* Key shaft */}
            <path d="M10.5 13.5L20 4" />
            {/* Key teeth */}
            <path d="M16.5 7.5L19 10M19 5L21.5 7.5" />
          </svg>
        );

      case "palm":
        return (
          <svg
            viewBox="0 0 24 24"
            width="62%"
            height="62%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg palm-svg"
          >
            <style>{`
              @keyframes swayPalm {
                0%, 100% { transform: skewX(0deg); }
                50% { transform: skewX(4deg); }
              }
              .palm-svg:hover {
                animation: swayPalm 1.5s ease-in-out infinite;
                transform-origin: bottom center;
              }
            `}</style>
            {/* Elegant Arch Frame */}
            <path d="M5 20V10C5 6.13401 8.13401 3 12 3C15.866 3 19 6.13401 19 10V20" strokeWidth="1.5" opacity="0.3" />
            {/* Palm Trunk */}
            <path d="M12 21C12 17 11 12 8 9" strokeWidth="2.5" />
            {/* Palm Fronds */}
            <path d="M8 9C8 9 4.5 9 3 11" strokeWidth="1.8" />
            <path d="M8 9C8 9 5.5 6 4 7" strokeWidth="1.8" />
            <path d="M8 9C8 9 8 5 7.5 4" strokeWidth="1.8" />
            
            <path d="M12 21C12 17 13 13 16 11" strokeWidth="2.5" />
            <path d="M16 11C16 11 19.5 11 21 13" strokeWidth="1.8" />
            <path d="M16 11C16 11 18.5 8 20 9" strokeWidth="1.8" />
            <path d="M16 11C16 11 16 7 15.5 6" strokeWidth="1.8" />
          </svg>
        );

      case "crown":
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            width="62%"
            height="62%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg crown-svg"
          >
            <style>{`
              @keyframes bounceCrown {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
              }
              .crown-svg:hover {
                animation: bounceCrown 0.8s ease-in-out infinite;
              }
            `}</style>
            {/* Solid crown path */}
            <path
              d="M3 16L5 7L10 11L12 5L14 11L19 7L21 16H3Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Bottom band */}
            <path d="M3 19H21" strokeWidth="2.5" />
            {/* Crown tip circles */}
            <circle cx="5" cy="6" r="1" fill="currentColor" />
            <circle cx="12" cy="4" r="1" fill="currentColor" />
            <circle cx="19" cy="6" r="1" fill="currentColor" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`brand-logo-container brand-logo-style-${logoStyle} ${className}`}
      style={containerStyle}
      aria-hidden="true"
    >
      {renderSvg()}
    </span>
  );
}

"use client";

import React, { useState } from "react";

export default function FloatingWhatsApp() {
  const [isHovered, setIsHovered] = useState(false);

  const phone = "923054311118";
  const ownerName = "Muhammad Abdullah";
  const message = "Hello Muhammad Abdullah,\n\nI would like to place an order.";
  const encodedMsg = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Tooltip */}
      <div
        style={{
          background: "#1E293B",
          color: "#FFFFFF",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "8px 14px",
          borderRadius: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateX(0) scale(1)" : "translateX(10px) scale(0.95)",
          pointerEvents: "none",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          whiteSpace: "nowrap",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        Chat with {ownerName} 👋
      </div>

      {/* Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${ownerName} on WhatsApp`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isHovered
            ? "0 8px 24px rgba(37, 211, 102, 0.45)"
            : "0 4px 16px rgba(37, 211, 102, 0.35)",
          transform: isHovered ? "scale(1.08) translateY(-2px)" : "scale(1)",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          textDecoration: "none",
          position: "relative",
        }}
      >
        {/* SVG WhatsApp Icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.12-.56.12-.17.25-.66.8-.81.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z" />
        </svg>

        {/* Pulse ring animation */}
        <span
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "2px solid #25D366",
            animation: "wa-pulse 2s infinite",
            pointerEvents: "none",
          }}
        />
        <style jsx global>{`
          @keyframes wa-pulse {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(1.45);
              opacity: 0;
            }
          }
        `}</style>
      </a>
    </div>
  );
}

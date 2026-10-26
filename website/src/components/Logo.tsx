import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 40, className = "", style = {} }: LogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white shadow-lg transition-transform duration-300 hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: "0 8px 20px -4px rgba(217, 119, 6, 0.4)",
        ...style,
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a8 8 0 0 0-8 8v12h16V10a8 8 0 0 0-8-8z" />
        <path d="M12 6v4" />
        <circle cx="12" cy="14" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

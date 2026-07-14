import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 48, className = "", style = {} }: LogoProps) {
  return (
    <img
      src="/logo.jpg"
      alt="Karachi Naseeb Baryani & Pulao"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{
        borderRadius: "50%",
        border: "2px solid var(--saffron, #D97706)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        ...style,
      }}
    />
  );
}


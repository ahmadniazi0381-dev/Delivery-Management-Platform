"use client";

import React, { useState, useRef, useEffect } from "react";

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  title?: string;
  why?: string;
  shortcut?: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  children,
  content,
  title,
  why,
  shortcut,
  position = "top",
  delay = 150,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "bottom":
        return { top: "100%", left: "50%", transform: "translateX(-50%) translateY(8px)" };
      case "left":
        return { right: "100%", top: "50%", transform: "translateY(-50%) translateX(-8px)" };
      case "right":
        return { left: "100%", top: "50%", transform: "translateY(-50%) translateX(8px)" };
      case "top":
      default:
        return { bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-8px)" };
    }
  };

  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            ...getPositionStyles(),
            zIndex: 9999,
            pointerEvents: "none",
            background: "rgba(15, 23, 42, 0.95)",
            color: "#f8fafc",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.75rem",
            lineHeight: "1.4",
            maxWidth: "240px",
            whiteSpace: "normal",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          {title && (
            <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#60a5fa", marginBottom: "3px" }}>
              {title}
            </div>
          )}
          <div>{content}</div>
          {why && (
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "4px", fontStyle: "italic" }}>
              💡 {why}
            </div>
          )}
          {shortcut && (
            <div style={{ marginTop: "5px", display: "flex", justifyContent: "flex-end" }}>
              <kbd
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "0.65rem",
                  fontFamily: "monospace",
                  color: "#cbd5e1",
                }}
              >
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

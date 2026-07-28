"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  sublabel?: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  searchable = true,
  disabled = false,
  style,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch("");
      setFocusedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        setIsOpen(true);
        e.preventDefault();
      } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        onChange(filteredOptions[focusedIndex].value);
        setIsOpen(false);
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        position: "relative",
        width: "100%",
        ...style,
      }}
    >
      {label && <label className="form-label">{label}</label>}

      {/* Select Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          height: "44px",
          padding: "0 14px",
          borderRadius: "10px",
          background: "var(--bg-card)",
          border: isOpen ? "1px solid #6366f1" : "1px solid var(--border)",
          boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.2)" : "none",
          color: selectedOption ? "var(--text-primary)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          outline: "none",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: "var(--text-secondary)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        />
      </button>

      {/* Dropdown Options Container */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: label ? "calc(100% + 4px)" : "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 3000,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
            overflow: "hidden",
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column",
            animation: "fadeInSelect 0.15s ease-out",
          }}
        >
          <style>{`
            @keyframes fadeInSelect {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Search Bar */}
          {searchable && options.length > 5 && (
            <div
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={14} style={{ color: "var(--text-secondary)" }} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter options..."
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ overflowY: "auto", padding: "6px" }}>
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "12px",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected
                        ? "#6366f1"
                        : isFocused
                        ? "var(--text-primary)"
                        : "var(--text-primary)",
                      background: isSelected
                        ? "rgba(99,102,241,0.12)"
                        : isFocused
                        ? "var(--bg-secondary)"
                        : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            background: "var(--bg-secondary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} color="#6366f1" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

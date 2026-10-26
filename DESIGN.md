# DESIGN.md — Food Delivery Platform Design System

## 1. Executive Summary & Design Philosophy

The **Food Delivery Platform** visual identity blends energetic culinary warmth with modern commercial SaaS precision. It moves away from generic template paradigms into an intentional, high-end visual language built on three core pillars:

1. **Tactile Surfaces & Double-Bezel Architecture**: Layered cards with subtle outer stroke, soft drop shadow, and nested inner containers (`rounded-3xl` outer, `rounded-2xl` inner).
2. **Intentional Motion Physics**: Hardware-accelerated transitions (`transform`, `opacity`) using natural deceleration curves (`cubic-bezier(0.32, 0.72, 0, 1)` and spring physics `cubic-bezier(0.16, 1, 0.3, 1)`).
3. **Calibrated Color & Contrast**: Warm saffron and amber accents paired with deep espresso neutrals in light mode, and rich OLED surfaces (`#0F0804`, `#1F1008`) in dark mode.

---

## 2. Typography Architecture

- **Primary Font**: `Plus Jakarta Sans` (weights: 300, 400, 500, 600, 700, 800)
- **Display Font**: `Poppins` (weights: 700, 800, 900)
- **Scale**:
  - **Display / Hero**: `clamp(2.5rem, 6vw, 4.25rem)` / Line height `1.05` / Weight `800`
  - **Section Titles (H1/H2)**: `clamp(1.75rem, 4vw, 2.5rem)` / Line height `1.15` / Weight `800`
  - **Card Headers (H3)**: `1.25rem` / Line height `1.3` / Weight `700`
  - **Body Text**: `0.95rem` – `1.05rem` / Line height `1.65` / Weight `400-500`
  - **Labels & Microcopy**: `0.75rem` – `0.85rem` / Tracking `0.05em` / Upper / Weight `600-700`

---

## 3. Color & Surface Palette

### Light Mode
- `--bg-primary`: `#FFFBF5` (Warm Cream Neutral)
- `--bg-secondary`: `#FEF9F0` (Soft Card Surface)
- `--bg-card`: `#FFFFFF` (Pure White Card Surface)
- `--saffron`: `#D97706` (Energetic Primary Accent)
- `--saffron-light`: `#F59E0B` (Bright Highlight)
- `--maroon`: `#7C2D12` (Deep Text & Gradient Base)
- `--text-primary`: `#1C0A00` (High Contrast Espresso)
- `--text-secondary`: `#6B4226` (Warm Muted Brown)

### Dark Mode (`[data-theme="dark"]`)
- `--bg-primary`: `#0F0804` (OLED Deep Base)
- `--bg-secondary`: `#1A0D06` (Elevated Surface)
- `--bg-card`: `#1F1008` (Dark Layered Card)
- `--text-primary`: `#FEF3C7` (Warm Off-White)
- `--text-secondary`: `#D4A574` (Muted Warm Gold)

---

## 4. Motion Design System

All motion MUST strictly follow the hardware-accelerated transform/opacity principles:

| Purpose | Duration | Easing Curve | CSS Utility |
|---|---|---|---|
| **Micro-Interactions** (Button Press, Toggle) | `150ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | `transition-all duration-150` |
| **State Changes** (Hover Lift, Scale) | `280ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | `transition-all duration-300` |
| **Page Entrance / Modals** | `450ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `animate-scale-in` / `animate-fade-up` |
| **Cart Badge Count Pulse** | `600ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `animate-bounce` / `spring-bounce` |

### Reduced Motion Respect
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Key Workflows & Visual Specs

1. **Homepage Hero**: Split composition with prominent typography on left, floating 3D showcase cards on right, and magnetic CTA buttons.
2. **Menu Cards (`FoodCard.tsx`)**: Outer glass stroke, hover image scale (`1.05`), state-morphing button (`Add` → `Added! ✓`), and inline quantity adjusters when in cart.
3. **Checkout Experience (`checkout/page.tsx`)**: 4-step visual indicator (`Cart → Address → Delivery → Payment`), payment gateway selector cards with active border glow.
4. **Order Timeline (`track/page.tsx`)**: Animated 6-step progress bar (`Placed` → `Confirmed` → `Preparing` → `Ready` → `Out for Delivery` → `Delivered`) bound to real WebSocket backend state.
5. **Admin Console (`dashboard/page.tsx`)**: Modern SaaS sidebar, Kanban order status tabs with amber pulse on pending orders, and reject reason modal dialog.

# BrickBook Design System Specification

This document defines the canonical visual foundation, design tokens, responsive layout rules, and component specifications for **BrickBook**. 

> [!IMPORTANT]
> **Strict Palette Mandate**: The colors defined in this document represent the immutable source of truth. **Do not introduce dark mode, terracotta themes, or alternative palettes.**

---

## 1. Application Shell & Responsive Viewport

BrickBook is engineered as a **mobile-first, handheld-optimized application**:

- **Shell Maximum Width**: Exactly **`400px`**.
- **Desktop / Tablet Presentation**: On viewports wider than 400px, the application shell is centered horizontally with auto margins (`mx-auto`).
- **Outer Viewport Background**: `#e5e7eb` (Outer backdrop giving contrast to the centered shell).
- **Application Shell Background**: `#f3f4f6` (Inner view container background).
- **Elevation Layer**: Rounded white cards (`#ffffff`) floating over `#f3f4f6`.
- **Bottom Navigation Dock**: Fixed at the bottom of the 400px container with background `#fde8d0`.

```
Desktop Screen (> 400px) [Outer Viewport: #e5e7eb]
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                 ┌─────────────────────────┐                 │
│                 │  Header (#213547 Navy)  │                 │
│                 ├─────────────────────────┤                 │
│                 │                         │                 │
│                 │   White Cards (#ffffff) │                 │
│                 │   over #f3f4f6          │                 │
│                 │   Max-width: 400px      │                 │
│                 │                         │                 │
│                 ├─────────────────────────┤                 │
│                 │ Bottom Nav (#fde8d0)    │                 │
│                 │ [Dash] [Prod] [Cust]    │                 │
│                 └─────────────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical Color Tokens

All design tokens must strictly adhere to the original hex values:

| Token Name | Hex Code | Semantic Role & Usage |
| :--- | :--- | :--- |
| `--color-navy` | `#213547` | Header background, high-contrast titles, primary brand identity |
| `--color-primary-amber` | `#d97706` | Primary action buttons, active tab indicators, key badges |
| `--color-amber-hover` | `#b45309` | Hover, focus, and pressed states for primary amber actions |
| `--color-main-bg` | `#f3f4f6` | Application interior background (within 400px shell) |
| `--color-outer-viewport` | `#e5e7eb` | Outer canvas backdrop surrounding the 400px shell on wide screens |
| `--color-peach-cream` | `#f7ebe1` | Accent card surfaces, alert callout backgrounds, curing highlights |
| `--color-bottom-nav` | `#fde8d0` | Fixed bottom navigation bar background |
| `--color-card-white` | `#ffffff` | Elevated surface cards, modal dialogs, input field backgrounds |
| `--color-text-primary` | `#111827` | Primary body text, labels, form input values |
| `--color-text-secondary` | `#1a2b3c` | Secondary subtitle text, table column headers, metadata |
| `--color-success` | `#059669` | 14-day curing completed, ready stock badges, settled invoices |
| `--color-warning` | `#d97706` | In-curing status (1-13 days remaining), low stock indicators |
| `--color-danger` | `#dc2626` | Insufficient stock error, overdue payments, validation failures |
| `--color-upi` | `#4f46e5` | UPI payment mode badge and transaction icon |
| `--color-bank` | `#7e22ce` | Bank Transfer / Cheque payment mode badge and transaction icon |

### CSS Custom Properties Setup (for Tailwind CSS v4)
```css
:root {
  --color-navy: #213547;
  --color-primary-amber: #d97706;
  --color-amber-hover: #b45309;
  --color-main-bg: #f3f4f6;
  --color-outer-viewport: #e5e7eb;
  --color-peach-cream: #f7ebe1;
  --color-bottom-nav: #fde8d0;
  --color-card-white: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #1a2b3c;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-upi: #4f46e5;
  --color-bank: #7e22ce;
}
```

---

## 3. Typography & Hierarchy

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Scale**:
  - **Screen / Page Title**: `1.25rem` (20px), bold (`font-bold`), color: `#213547` (Navy).
  - **Section Heading**: `1.125rem` (18px), semi-bold (`font-semibold`), color: `#213547` (Navy).
  - **Card Title / Metric**: `1rem` (16px), semi-bold (`font-semibold`), color: `#111827`.
  - **Body / Form Value**: `0.875rem` (14px), regular (`font-normal`), color: `#111827`.
  - **Subtext / Helper Label**: `0.75rem` (12px), medium (`font-medium`), color: `#1a2b3c`.
  - **Metric Numbers / Large Stat**: `1.5rem` to `1.75rem` (24px - 28px), bold (`font-bold`).

---

## 4. Navigation Architecture: Exactly Three Bottom Tabs

The bottom navigation bar is fixed at the base of the `400px` container. It consists of **exactly three tabs**:

1. **Dashboard**
   - Icon: LayoutDashboard / Home
   - Purpose: Real-time overview of Ready vs. Curing stock, today's output, recent dispatches, and quick balance stats.
2. **Production**
   - Icon: Factory / Blocks
   - Purpose: Daily production batch logging, production multiplier yields, 14-day curing calendar, duplicate date checks.
3. **Customers**
   - Icon: Users / Wallet
   - Purpose: Customer accounts, dispatch orders, Kerala vehicle logging, running balance ledger, and payment tracking (Cash/UPI/Bank).

### Bottom Navigation Specs
- **Height**: `64px` (with safe-area padding for mobile home indicators).
- **Background**: `#fde8d0`.
- **Border**: Top border `1px solid rgba(217, 119, 6, 0.2)` (subtle amber accent).
- **Active Tab**: Icon and text in `#d97706` (Primary Amber), with a small pill indicator or bold label.
- **Inactive Tab**: Icon and text in `#213547` with 70% opacity.

---

## 5. Component Specifications

### A. Rounded White Cards (`#ffffff`)
- **Background**: `#ffffff`.
- **Border Radius**: `rounded-2xl` (`16px`) or `rounded-xl` (`12px`).
- **Padding**: `16px` (`p-4`).
- **Shadow**: Subtle elevation `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`.
- **Border**: `1px solid #e5e7eb`.

### B. Highlight / Accent Cards (`#f7ebe1`)
- **Background**: `#f7ebe1` (Peach cream).
- **Border**: `1px solid rgba(217, 119, 6, 0.25)`.
- **Usage**: Curing batch status cards, critical alerts, featured production metrics.

### C. Buttons
1. **Primary Button**:
   - Background: `#d97706` (Primary Amber)
   - Hover / Active: `#b45309` (Amber Hover)
   - Text: `#ffffff`, font-semibold
   - Height: `44px` minimum (mobile touch target compliant)
   - Border radius: `rounded-xl` (`12px`)
2. **Secondary / Outline Button**:
   - Background: `transparent` or `#ffffff`
   - Border: `1.5px solid #213547` (Navy)
   - Text: `#213547`, font-semibold
3. **Danger Button**:
   - Background: `#dc2626`
   - Text: `#ffffff`

### D. Form Controls
- **Input Fields**:
  - Background: `#ffffff`
  - Border: `1px solid #d1d5db` (Gray-300)
  - Focus Ring: `2px solid #d97706` (Primary Amber) with zero offset
  - Height: `44px`
  - Text: `#111827`, placeholder in `#9ca3af`
- **Labels**:
  - Text: `#1a2b3c`, font-medium, size `14px` (`text-sm`)
- **Error States**:
  - Border: `1.5px solid #dc2626`
  - Error Text: `12px` in `#dc2626` with `aria-invalid="true"`

### E. Badges & Payment Indicators
- **Ready Stock Badge**: Background `#d1fae5`, Text `#059669` (Success)
- **Curing Badge**: Background `#fef3c7`, Text `#d97706` (Warning)
- **UPI Payment Badge**: Background `#e0e7ff`, Text `#4f46e5` (UPI)
- **Bank Transfer Badge**: Background `#f3e8ff`, Text `#7e22ce` (Bank)
- **Cash Payment Badge**: Background `#e5e7eb`, Text `#1f2937`

---

## 6. Accessibility & Touch Standards

- **Target Standard**: WCAG 2.1 AA.
- **Minimum Touch Target**: `44px x 44px` for all interactive elements (buttons, inputs, navigation tabs).
- **Contrast Ratios**:
  - Primary amber (`#d97706`) on white passes 3.0:1 for large text/icons; for small text, high-contrast navy (`#213547`) or dark text (`#111827`) is used.
  - White text on Navy (`#213547`) exceeds 12.0:1 contrast.
  - Text `#111827` on main background `#f3f4f6` exceeds 14.0:1 contrast.
- **Focus Rings**: Visual outline `2px solid #d97706` applied to all keyboard focus states (`focus-visible`).

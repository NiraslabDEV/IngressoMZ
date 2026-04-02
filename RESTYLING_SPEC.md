# IngressoMZ — Apple Design Language Restyling Specification

**Last Updated:** April 2, 2026  
**Target Theme:** Dark mode with blue accents (Apple-inspired sophistication)

---

## Part 1: Global Color Mapping

### Primary Color Replacement Rules

| Current | New | Usage |
|---|---|---|
| `text-orange-500` | `text-white` (logo), `text-blue-400` (accents) | Logo primary changes to white; accent elements become blue |
| `text-orange-400` | `text-blue-400` | Hero subtitle & accent highlights |
| `text-orange-300` | `text-blue-300` | Secondary accents, lighter shades |
| `text-orange-600` | `text-blue-400` / `text-blue-300` | CTAs, hover states |
| `text-orange-700` | `text-blue-300` | Enhanced hover state |
| `bg-orange-500` | `bg-blue-400` | Primary buttons |
| `hover:bg-orange-600` | `hover:bg-blue-300` | Button hover states |
| `bg-orange-100` / `bg-orange-50` | `bg-gray-900` / `bg-gray-800` | Empty state gradients |
| `bg-orange-500/20` | `bg-blue-400/20` | Transparent accents in alerts |

### Background & Text Color Updates

| Current | New | Context |
|---|---|---|
| `bg-white` | `bg-gray-900` / `bg-black` | Card backgrounds |
| `text-gray-900` | `text-white` | Primary text on dark |
| `text-gray-500` | `text-gray-400` / `text-gray-300` | Secondary text |
| `text-gray-200` | `text-gray-300` | Tertiary text |
| `bg-gray-100` | `bg-gray-800/50` | Subtle dividers, subtle backgrounds |
| `border-gray-100` | `border-gray-800` / `border-gray-800/50` | Card, section borders |
| `border-white/20` | `border-gray-800/50` (navbar), `border-white/10` (subtle) | Navbar & dividers |
| `hover:bg-gray-50` | `hover:bg-gray-800` | Hover states on dark |
| `focus:ring-orange-400` | `focus:ring-blue-400` | Focus indicators |

### Specifics per Component

---

## Part 2: Navbar (`src/app/[locale]/layout.tsx`)

### Current Implementation Issues
```
Header:
- bg-white/10 backdrop-blur-md border-b border-white/20
  → Needs stronger consistency & darker tone

Logo:
- text-orange-500 hover:scale-105
  → Should be white, blue on hover

Nav links:
- text-gray-200 hover:text-white (correct for dark theme)
  → Stays the same

Register button:
- bg-white/20 hover:bg-white/30 text-white
  → Should be filled blue button
```

### Changes Required

**Line 24: Header className**
```diff
- background="bg-white/10 backdrop-blur-md border-b border-white/20"
+ background="bg-black/40 backdrop-blur-md border-b border-gray-800/50"
```
**Reasoning:** More sophisticated dark tone, subtle border matches Apple aesthetic

**Line 28–30: Logo**
```diff
- className="text-xl font-bold text-orange-500 hover:scale-105 transition-transform"
+ className="text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200"
```
**Reasoning:** White text for sophistication, blue hover for accent interactivity

**Line 32–35: Nav links (already good, minor tweak)**
```diff
- className="text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200"
+ className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
```
**Reasoning:** Slightly lighter secondary gray for better readability on dark

**Line 47–51: Register button (MAJOR CHANGE)**
```diff
- className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors duration-200 backdrop-blur-sm"
+ className="bg-blue-400 hover:bg-blue-300 text-black text-sm font-medium px-5 py-2 rounded-full transition-colors duration-200 font-semibold"
```
**Reasoning:** Filled blue button is now the primary CTA, white text becomes black for contrast, removed backdrop-blur (not needed on solid)

---

## Part 3: Homepage Hero (`src/app/[locale]/page.tsx` — Lines 152–170)

### Current State
```
Hero title uses:
- text-orange-400 for span (accent highlight)
- Hero already dark (good)
```

### Changes Required

**Line 154: Hero subtitle (color class only)**
```diff
- className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4 animate-fade-in"
+ className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4 animate-fade-in"
```

**Line 159: Hero accent highlight (title span)**
```diff
- <span className="text-orange-400">Garante o teu lugar.</span>
+ <span className="text-blue-400">Garante o teu lugar.</span>
```

**Line 163: Hero CTA button (primary call-to-action)**
```diff
- className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-full hover:scale-105 transition-transform duration-200 text-base"
+ className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors duration-200 text-base"
```
**Reasoning:** Changed hover from scale transform to background shade for Apple-like subtlety

**Line 165: Hero secondary button**
```diff
- className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors duration-200 text-base backdrop-blur-sm"
+ className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors duration-200 text-base"
```
**Reasoning:** Keep styling, just remove redundant backdrop-blur

---

## Part 4: Stats Bar (`src/app/[locale]/page.tsx` — Lines 172–186)

### Current State (NEEDS MAJOR REWORK)
```
section className="border-b border-gray-100"
- White/light background implied
- text-gray-900 for stats (dark text on light)
```

### Changes Required

**Line 171: Stats section wrapper**
```diff
- className="border-b border-gray-100"
+ className="bg-gray-950 border-b border-gray-800/50"
```

**Line 173: Grid container (add background)**
```diff
- className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8 text-center"
+ className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-8 text-center"
```

**Line 175: Stats number**
```diff
- className="text-3xl font-bold text-gray-900"
+ className="text-3xl font-bold text-white"
```

**Line 176: Stats label**
```diff
- className="text-sm text-gray-500 mt-1"
+ className="text-sm text-gray-400 mt-1"
```

**Line 179: Duplicate — same changes as L175**
```diff
- className="text-3xl font-bold text-gray-900"
+ className="text-3xl font-bold text-white"
```

**Line 180: Duplicate — same changes as L176**
```diff
- className="text-sm text-gray-500 mt-1"
+ className="text-sm text-gray-400 mt-1"
```

**Line 183: Duplicate — Stats number**
```diff
- className="text-3xl font-bold text-gray-900"
+ className="text-3xl font-bold text-white"
```

**Line 184: Duplicate — Stats label**
```diff
- className="text-sm text-gray-500 mt-1"
+ className="text-sm text-gray-400 mt-1"
```

---

## Part 5: Section Titles & Subtitles (Homepage Main Content)

### LocationLine 199: "Em destaque" section

**Line 199: Section title**
```diff
- className="text-3xl font-bold tracking-tight text-gray-900"
+ className="text-3xl font-bold tracking-tight text-white"
```

**Line 200: Section subtitle**
```diff
- className="text-gray-500 mt-2 mb-10"
+ className="text-gray-400 mt-2 mb-10"
```

### Line 223: "Proximos eventos" section (duplicate changes)

**Line 223: Section title**
```diff
- className="text-3xl font-bold tracking-tight text-gray-900"
+ className="text-3xl font-bold tracking-tight text-white"
```

**Line 224: Section subtitle**
```diff
- className="text-gray-500 mt-2 mb-10"
+ className="text-gray-400 mt-2 mb-10"
```

---

## Part 6: EventCard Component (`src/app/[locale]/page.tsx` — Lines 7–99)

### Current Implementation (Light theme card)
```
This is the most critical component to redesign for dark theme.
```

### Changes Required

**Line 29: EventCard wrapper (CRITICAL)**
```diff
- className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
+ className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-gray-700 transition-all duration-300"
```
**Reasoning:**
- Dark background (`bg-gray-900`)
- Dark border (`border-gray-800`)
- Hover: subtle blue-tinted shadow (Apple aesthetic), match border tone change

**Line 33: Image placeholder background**
```diff
- className="relative aspect-[4/3] bg-gray-100 overflow-hidden"
+ className="relative aspect-[4/3] bg-gray-800 overflow-hidden"
```

**Line 63: Featured badge**
```diff
- className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full"
+ className="absolute top-3 left-3 bg-blue-400 text-black text-xs font-semibold px-3 py-1 rounded-full"
```
**Reasoning:** Orange → Blue, white text → black for contrast on blue

**Line 65: Date badge**
```diff
- className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium px-2.5 py-1 rounded-full"
+ className="absolute top-3 right-3 bg-gray-800 backdrop-blur-sm text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full"
```
**Reasoning:** Dark badge, light text for consistency

**Line 83: Music icon (placeholder image)**
```diff
- className="w-12 h-12 text-orange-300"
+ className="w-12 h-12 text-blue-400"
```

**Line 85: Empty state gradient**
```diff
- className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center"
+ className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
```

**Line 92: Event title**
```diff
- className="font-semibold text-gray-900 line-clamp-1"
+ className="font-semibold text-white line-clamp-1"
```

**Line 95: Venue text**
```diff
- className="text-sm text-gray-500 mt-1 line-clamp-1"
+ className="text-sm text-gray-400 mt-1 line-clamp-1"
```

**Line 99: Price display**
```diff
- className="text-lg font-bold text-gray-900"
+ className="text-lg font-bold text-blue-400"
```
**Reasoning:** Price becomes blue accent for visual hierarchy

**Line 105: "Ver evento" CTA**
```diff
- className="text-sm text-orange-600 font-medium group-hover:text-orange-700"
+ className="text-sm text-blue-400 font-medium group-hover:text-blue-300"
```

---

## Part 7: Empty State (`src/app/[locale]/page.tsx` — Lines 225–234)

### Current Implementation
```
Button: bg-gray-900 (dark on dark — low contrast)
Text: text-gray-400
```

### Changes Required

**Line 229: Empty state text**
```diff
- className="text-gray-400 mb-6"
+ className="text-gray-300 mb-6"
```
**Reasoning:** Slightly lighter for better readability

**Line 230: Empty state CTA button**
```diff
- className="inline-block bg-gray-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
+ className="inline-block bg-blue-400 text-black font-semibold px-6 py-3 rounded-full hover:bg-blue-300 transition-colors"
```
**Reasoning:** Blue button for consistent CTA design, black text for contrast

---

## Part 8: Footer (`src/app/[locale]/page.tsx` — Lines 246–267)

### Current State (Already dark, minor tweaks needed)

**Line 247: Footer background — verify consistency**
```
Already: bg-gray-950 ✓
```

**Line 251: Heading text**
```
Already: text-white ✓
```

**Line 254: Section headings**
```
Already: text-white ✓
```

**Line 259: Links hover state**
```diff
- className="hover:text-white transition-colors"
+ className="hover:text-blue-400 transition-colors"
```
**Reasoning:** Add blue hover accent for consistency

**Line 264: Border**
```
Already: border-gray-800 ✓
```

---

## Part 9: UserMenu Component (`src/components/UserMenu.tsx`)

### Current Issues
```
- Avatar: bg-orange-500 (orange badge)
- Menu: bg-white (light background, needs dark redesign)
- Text: text-gray-900 (dark text on light)
```

### Changes Required

**Line 41: Avatar badge**
```diff
- className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-semibold flex items-center justify-center select-none"
+ className="w-8 h-8 rounded-full bg-blue-400 text-black text-sm font-semibold flex items-center justify-center select-none"
```

**Line 45: User name display (navbar)**
```diff
- className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate"
+ className="hidden sm:block text-sm text-gray-300 max-w-[120px] truncate"
```

**Line 51: Dropdown icon color**
```
Already: text-gray-400 ✓
```

**Line 56: Menu container (CRITICAL)**
```diff
- className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
+ className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-xl shadow-lg border border-gray-800 py-1 z-50"
```

**Line 57–60: User info section (heading area)**
```diff
- className="px-4 py-3 border-b border-gray-100"
- <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
- <p className="text-xs text-gray-500 truncate">{email}</p>
+ className="px-4 py-3 border-b border-gray-800"
+ <p className="text-sm font-medium text-white truncate">{name}</p>
+ <p className="text-xs text-gray-400 truncate">{email}</p>
```

**Line 63: Account link**
```diff
- className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
+ className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
```

**Line 64: Icon color**
```diff
- className="w-4 h-4 text-gray-400"
+ className="w-4 h-4 text-gray-500"
```

**Line 71: Logout button**
```diff
- className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
+ className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
```

---

## Part 10: Auth & Account Pages (Secondary Priority)

### `src/app/[locale]/error.tsx`
```diff
- className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
+ className="bg-blue-400 text-black px-6 py-2 rounded-lg hover:bg-blue-300"
```

### `src/app/[locale]/account/page.tsx` — Line 144
```diff
- className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
+ className="w-full bg-blue-400 hover:bg-blue-300 disabled:opacity-50 text-black font-medium py-2.5 rounded-lg transition-colors"
```

### `src/app/globals.css` — Line 18
```diff
- @apply bg-orange-500/20 text-orange-900;
+ @apply bg-blue-400/20 text-blue-300;
```

### `src/app/[locale]/buyer/tickets/page.tsx` — Lines 67, 86, 131
```diff
- Line 67: bg-orange-500 hover:bg-orange-600 → bg-blue-400 hover:bg-blue-300
- Line 86: text-orange-100 → text-blue-100
- Line 131: text-orange-600 hover:underline → text-blue-400 hover:underline (or text-blue-300)
```

### `src/app/[locale]/events/[id]/page.tsx` — Lines 51, 121
```diff
- Line 51: text-orange-200 → text-gray-300 (or text-gray-400)
- Line 121: text-orange-600 → text-blue-400
```

### `src/app/[locale]/auth/register/page.tsx` — Line 68
```diff
- className="text-orange-600 hover:underline font-medium"
+ className="text-blue-400 hover:text-blue-300 font-medium"
```

---

## Part 11: Organizer Pages (Secondary Priority)

All orange → blue transitions apply. Key pages:
- `src/app/[locale]/organizer/dashboard/page.tsx`
- `src/app/[locale]/organizer/events/page.tsx`
- `src/app/[locale]/organizer/events/new/page.tsx`
- `src/app/[locale]/organizer/events/[id]/edit/page.tsx`
- `src/app/[locale]/organizer/events/[id]/checkin/page.tsx`

---

## Part 12: Global CSS Updates (`src/app/globals.css`)

### Alert/Info styling
```diff
- .alert { @apply bg-orange-500/20 text-orange-900; }
+ .alert { @apply bg-blue-400/20 text-blue-300; }
```

### Add system dark mode support (if not already present)
```css
@media (prefers-color-scheme: dark) {
  /* Ensure defaults work */
  body {
    @apply bg-black text-white;
  }
}
```

---

## Part 13: Button & Link Components (Consistency Pattern)

### Primary CTA Button Pattern
```
Color: bg-blue-400 hover:bg-blue-300
Text: text-black font-semibold
Border: none
Rounded: rounded-full or rounded-lg (per design)
```

### Secondary CTA Button Pattern
```
Color: border border-gray-800 bg-gray-900 hover:bg-gray-800
Text: text-white
Border: border-gray-800
Rounded: rounded-full or rounded-lg
```

### Link Pattern (in dark context)
```
Color: text-blue-400 hover:text-blue-300
Underline: optional on hover
```

---

## Part 14: Tailwind Configuration Check

### Ensure these utilities exist or are extended properly in `tailwind.config.ts`

```typescript
// Already present (verify):
- text-blue-400, text-blue-300 ✓
- bg-blue-400, bg-blue-300 ✓
- hover:text-blue-* ✓
- border-gray-800 ✓
- hover:shadow-blue-500/10 ✓
- hover:bg-red-950/30 ✓
```

If any are missing, add to `theme.extend.colors` or use arbitrary values like `shadow-blue-500/10`.

---

## Part 15: Implementation Priority & Rollout

### **PHASE 1** (Critical — Homepage & Navigation)
1. Navbar (`src/app/[locale]/layout.tsx`)
2. Homepage hero & stats (`src/app/[locale]/page.tsx` top section)
3. EventCard component (widest impact)
4. Footer consistency check

**Expected Impact:** Immediate visual transformation, affects all users

### **PHASE 2** (High — User-Facing Pages)
1. UserMenu component
2. Auth pages (login, register)
3. Buyer pages (tickets, orders)
4. Event detail page

**Expected Impact:** Seamless experience for buyers

### **PHASE 3** (Medium — Organizer Features)
1. Organizer dashboard
2. Event creation/edit pages
3. Check-in page

**Expected Impact:** Organizer workflow consistency

### **PHASE 4** (Polish — Edge Cases)
1. Error pages
2. Empty states
3. Global CSS utilities
4. Minor color refinements

**Expected Impact:** Professional polish, edge case handling

---

## Part 16: Verification Checklist

After implementation, verify:

- [ ] **Color Contrast:** All text meets WCAG AA (4.5:1 for body text, 3:1 for large text)
  - White (`text-white`) on `bg-gray-900`? ✓ (15:1)
  - Blue-400 (`text-blue-400`) on `bg-gray-900`? ✓ (5.5:1)
  - Gray-300/400 on `bg-gray-900`/`bg-black`? ✓ (8:1 / 10:1)

- [ ] **Consistency:** All orange usages replaced with blue (except in logos/brand that required white)

- [ ] **Hover States:** All interactive elements have clear hover feedback
  - Buttons → background shade change
  - Links → color change to lighter blue

- [ ] **Dark Mode Support:** Test in browser dark mode if applicable

- [ ] **Mobile Responsive:** Navbar collapses, cards stack properly

- [ ] **Screenshots for Comparison:** Before/after of key sections

---

## Part 17: Color Palette Reference

### Final Approved Colors
```css
/* Backgrounds */
--bg-primary: #000000 (bg-black)
--bg-secondary: #111111 (bg-gray-950)
--bg-tertiary: #1f2937 (bg-gray-900)
--bg-subtle: #1f2937/50 (bg-gray-900/50)
--bg-hover: #374151 (bg-gray-700 or hover:bg-gray-800)

/* Text */
--text-primary: #ffffff (text-white)
--text-secondary: #d1d5db (text-gray-300)
--text-tertiary: #9ca3af (text-gray-400)
--text-disabled: #6b7280 (text-gray-500)

/* Accents */
--accent-primary: #60a5fa (text-blue-400 / bg-blue-400)
--accent-hover: #93c5fd (text-blue-300 / hover:bg-blue-300)
--accent-dark: #3b82f6 (text-blue-500 — backup if needed)

/* Borders */
--border-primary: #1f2937 (border-gray-800)
--border-subtle: #1f2937/50 (border-gray-800/50)
--border-lighter: rgba(255, 255, 255, 0.1) (border-white/10)

/* Alerts/Overlays */
--bg-alert: rgba(96, 165, 250, 0.2) (bg-blue-400/20)
--text-alert: #93c5fd (text-blue-300)
```

---

## Quick Reference: All File Changes Summary

| File | Changes | Priority |
|---|---|---|
| `src/app/[locale]/layout.tsx` | Navbar bg, logo color, button styling | 🔴 P1 |
| `src/app/[locale]/page.tsx` | Hero, stats, EventCard, footer, empty states | 🔴 P1 |
| `src/components/UserMenu.tsx` | Avatar, menu bg/text, links | 🟠 P2 |
| `src/app/[locale]/error.tsx` | Button color | 🟡 P4 |
| `src/app/[locale]/account/page.tsx` | Submit button | 🟡 P3 |
| `src/app/globals.css` | Alert styling | 🟡 P4 |
| `src/app/[locale]/buyer/tickets/page.tsx` | Button, text colors | 🟠 P2 |
| `src/app/[locale]/events/[id]/page.tsx` | Text & price colors | 🟠 P2 |
| `src/app/[locale]/auth/register/page.tsx` | Link color | 🟠 P2 |
| `src/app/[locale]/organizer/*` | All orange → blue | 🟡 P3 |

---

## Notes for Developers

1. **Backdrop-blur cleanup:** Some buttons/cards have redundant `backdrop-blur-sm` on solid backgrounds — remove for consistency
2. **Shadow refinements:** Hover states use `hover:shadow-blue-500/10` instead of standard shadows (check Tailwind supports this syntax)
3. **Testing dark mode:** Ensure all components work on both OS-level dark mode and in browsers with forced dark mode
4. **Print styles:** Ensure stylesheet handles print media if needed
5. **Hover transitions:** Keep `duration-200` consistent across all hover states
6. **Focus states:** Update `:focus-within` and `:focus-visible` to use `focus:ring-blue-400`

---

**End of Specification**

# IngressoMZ — Apple Design Restyling — Quick Implementation Checklist

## 🎯 Quick Color Swap Rules

```
GLOBAL REPLACEMENTS:
- All orange-* classes → blue-*
- All bg-white → bg-gray-900 or bg-black
- All text-gray-900 → text-white
- All gray-500 → gray-400
- All border-white/20 → border-gray-800/50
- All border-gray-100 → border-gray-800
```

---

## 📋 File-by-File Checklist

### PHASE 1: Critical — Homepage & Navigation

#### [ ] `src/app/[locale]/layout.tsx`
- [ ] Line 24: Header → `bg-black/40 backdrop-blur-md border-b border-gray-800/50`
- [ ] Line 28: Logo → `text-white hover:text-blue-400`
- [ ] Line 47: Register button → `bg-blue-400 hover:bg-blue-300 text-black font-semibold`

#### [ ] `src/app/[locale]/page.tsx` — Hero Section
- [ ] Line 154: Hero subtitle → `text-blue-400`
- [ ] Line 159: Accent highlight → `text-blue-400`
- [ ] Line 163: Primary button → `hover:bg-gray-100` (not scale)

#### [ ] `src/app/[locale]/page.tsx` — Stats Bar (Lines 171–186)
- [ ] Line 171: Section → `bg-gray-950 border-b border-gray-800/50`
- [ ] Lines 175, 179, 183: Stats numbers → `text-white`
- [ ] Lines 176, 180, 184: Stats labels → `text-gray-400`

#### [ ] `src/app/[locale]/page.tsx` — EventCard Component (Lines 7–99)
- [ ] Line 29: Card wrapper → `bg-gray-900 border-gray-800 hover:shadow-blue-500/10`
- [ ] Line 33: Image placeholder → `bg-gray-800`
- [ ] Line 63: Featured badge → `bg-blue-400 text-black`
- [ ] Line 65: Date badge → `bg-gray-800 text-gray-300`
- [ ] Line 83: Icon → `text-blue-400` (music/placeholder)
- [ ] Line 85: Gradient → `from-gray-800 to-gray-900`
- [ ] Line 92: Title → `text-white`
- [ ] Line 95: Venue → `text-gray-400`
- [ ] Line 99: Price → `text-blue-400` ⭐ (key accent)
- [ ] Line 105: "Ver evento" CTA → `text-blue-400 hover:text-blue-300`

#### [ ] `src/app/[locale]/page.tsx` — Section Headers (Lines 199, 223)
- [ ] Line 199: "Em destaque" title → `text-white`
- [ ] Line 200: Subtitle → `text-gray-400`
- [ ] Line 223: "Proximos eventos" title → `text-white`
- [ ] Line 224: Subtitle → `text-gray-400`

#### [ ] `src/app/[locale]/page.tsx` — Empty State (Lines 226–234)
- [ ] Line 229: Text → `text-gray-300`
- [ ] Line 230: Button → `bg-blue-400 hover:bg-blue-300 text-black`

#### [ ] `src/app/[locale]/page.tsx` — Footer (Lines 259)
- [ ] Line 259+: Links → `hover:text-blue-400 transition-colors`

---

### PHASE 2: High Priority — User-Facing Components

#### [ ] `src/components/UserMenu.tsx`
- [ ] Line 41: Avatar → `bg-blue-400 text-black`
- [ ] Line 45: Username → `text-gray-300`
- [ ] Line 56: Menu container → `bg-gray-900 border-gray-800`
- [ ] Line 57: Header border → `border-gray-800`
- [ ] Line 58: Name → `text-white`
- [ ] Line 59: Email → `text-gray-400`
- [ ] Line 63: Account link → `text-gray-300 hover:bg-gray-800`
- [ ] Line 71: Logout → `text-red-400 hover:bg-red-950/30`

#### [ ] `src/app/[locale]/buyer/tickets/page.tsx`
- [ ] Line 67: Button → `bg-blue-400 hover:bg-blue-300 text-black`
- [ ] Line 86: Tier name → `text-blue-100`
- [ ] Line 131: Resend link → `text-blue-400 hover:text-blue-300`

#### [ ] `src/app/[locale]/events/[id]/page.tsx`
- [ ] Line 51: Organizer text → `text-gray-300`
- [ ] Line 121: Price → `text-blue-400`

#### [ ] `src/app/[locale]/auth/register/page.tsx`
- [ ] Line 68: Login link → `text-blue-400 hover:text-blue-300`

---

### PHASE 3: Medium Priority — Organizer Features

#### [ ] `src/app/[locale]/organizer/dashboard/page.tsx`
- [ ] All `bg-orange-*` → `bg-blue-*`
- [ ] All `text-orange-*` → `text-blue-*`
- [ ] White backgrounds → gray-900

#### [ ] `src/app/[locale]/organizer/events/page.tsx`
- [ ] Orange → blue throughout
- [ ] White cards → gray-900 cards

#### [ ] `src/app/[locale]/organizer/events/new/page.tsx`
- [ ] Submit button → `bg-blue-400 hover:bg-blue-300 text-black`

#### [ ] `src/app/[locale]/organizer/events/[id]/edit/page.tsx`
- [ ] All buttons & inputs orange → blue

#### [ ] `src/app/[locale]/organizer/events/[id]/checkin/page.tsx`
- [ ] Scan/camera UI → blue accents

---

### PHASE 4: Polish — Edge Cases

#### [ ] `src/app/[locale]/error.tsx`
- [ ] Line 17: Button → `bg-blue-400 hover:bg-blue-300 text-black`

#### [ ] `src/app/[locale]/account/page.tsx`
- [ ] Line 144: Save button → `bg-blue-400 hover:bg-blue-300 text-black`

#### [ ] `src/app/globals.css`
- [ ] Alert styling → `bg-blue-400/20 text-blue-300`

---

## 🎨 Color Reference Quick Copy-Paste

### Navbar Button
```html
bg-blue-400 hover:bg-blue-300 text-black font-semibold
```

### Card/Container
```html
bg-gray-900 border border-gray-800
```

### Primary Text
```html
text-white
```

### Secondary Text
```html
text-gray-300 or text-gray-400
```

### Accent Text (Links, CTAs, Prices)
```html
text-blue-400 hover:text-blue-300
```

### Hover on Dark Background
```html
hover:bg-gray-800 or hover:bg-gray-700
```

### Badge/Highlight
```html
bg-blue-400 text-black
```

---

## ✅ Testing Checklist

After implementation:

- [ ] **Navbar:** Logo white, button blue, links gray → white on hover
- [ ] **Hero:** Subtitles blue, accents blue, buttons white
- [ ] **Stats:** White numbers, gray labels, dark background
- [ ] **EventCards:** Dark background, blue price, blue "[Ver evento]" link
- [ ] **Footer:** Dark background, light text, blue link hovers
- [ ] **UserMenu:** Blue avatar, dark menu, light text
- [ ] **All CTAs:** Consistently blue (`bg-blue-400` with `text-black`)
- [ ] **Contrast:** Check WCAG compliance (text should be readable)
- [ ] **Mobile:** Responsive on small screens
- [ ] **Links:** All orange → blue, all white backgrounds → dark

---

## 🚀 Implementation Order (Optimized)

**Day 1 (2–3 hours):**
1. `Layout.tsx` (Navbar) — visible immediately
2. `page.tsx` EventCard component — highest impact
3. `UserMenu.tsx` — secondary UI element

**Day 2 (2–3 hours):**
4. `page.tsx` Hero, stats, sections, footer
5. `globals.css` — alerts & global styles

**Day 3 (2–3 hours):**
6. `buyer/tickets/page.tsx`, `events/[id]/page.tsx`
7. `auth/register/page.tsx`

**Day 4 (2–3 hours):**
8. All organizer pages (dashboard, events, edit, checkin)
9. Error pages, account pages

---

## 📊 Before/After Color Matrix

| Component | Before | After | Why |
|---|---|---|---|
| Logo | `text-orange-500` | `text-white` | Professional, Apple-like |
| Buttons | `bg-orange-500`/`bg-white/20` | `bg-blue-400` | Unified, clean CTA |
| Card backgrounds | `bg-white` | `bg-gray-900` | Dark mode consistency |
| Card borders | `border-gray-100` | `border-gray-800` | Subtle on dark |
| Text primary | `text-gray-900` | `text-white` | Dark theme |
| Text secondary | `text-gray-500` | `text-gray-400` | Better contrast |
| Pricing | `text-gray-900` | `text-blue-400` | Highlight value |
| Links | `text-orange-600` | `text-blue-400` | Accent consistency |

---

**Total files to change:** ~15  
**Total className changes:** ~80–100  
**Estimated time:** 6–8 hours (P1+P2+P3+P4)


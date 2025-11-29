# QNQ Lottery Design Guidelines

## Design Approach

**Reference-Based Approach**: Draw inspiration from premium financial platforms (Revolut, Wise) and established Asian betting platforms for trustworthiness and clarity. Emphasize professional credibility through clean layouts, clear hierarchy, and premium details while maintaining operational simplicity.

**Core Principles**:
- Premium credibility through refined details, not decoration
- Information clarity over visual complexity
- Fast-loading, lightweight components
- Mobile-first responsive design

---

## Typography System

**Font Stack**: Use Google Fonts CDN
- **Primary**: Inter (Latin characters) - 400, 500, 600, 700
- **Thai Support**: Noto Sans Thai - 400, 500, 600, 700
- **Accent/Logo**: Urbanist Bold - 700, 800

**Type Scale**:
- **Hero/Logo**: text-4xl to text-6xl, font-bold (800)
- **Page Titles**: text-3xl to text-4xl, font-bold (700)
- **Section Headers**: text-2xl to text-3xl, font-semibold (600)
- **Card Titles**: text-lg to text-xl, font-semibold (600)
- **Body Text**: text-base, font-normal (400)
- **Captions/Labels**: text-sm to text-xs, font-medium (500)
- **Numbers/Amounts**: text-lg to text-2xl, font-bold (700) - tabular numbers

---

## Layout System

**Spacing Primitives**: Use Tailwind units 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-4 to gap-6
- Element margins: m-2, m-4, m-6

**Container Strategy**:
- Max-width: max-w-7xl for main content
- Padding: px-4 on mobile, px-6 on tablet, px-8 on desktop
- Cards: Consistent rounded-2xl with p-6 to p-8

**Grid Systems**:
- Betting form: Single column on mobile, 2-column on desktop (lg:grid-cols-2)
- Lottery results: Grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Affiliate stats: Grid-cols-2 md:grid-cols-4
- History tables: Full-width responsive tables with horizontal scroll

---

## Component Library

### Navigation
- **Top Navigation**: Sticky header with logo left, language toggle, user menu right
- **Mobile**: Hamburger menu with slide-out drawer
- **Logo**: QNQ Lottery with geometric icon (diamond/crown motif), height h-10 to h-12

### Betting Calculator Interface
- **Lottery Type Selector**: Dropdown with icons (Lucide: TrendingUp, Globe, DollarSign)
- **Bet Type Buttons**: Pill-shaped button group (9 options), active state with subtle glow
- **Number Input**: Large, centered input fields (text-2xl) with number pad feel
- **Amount Input**: Currency input with +/- controls, shows multiplier
- **Blocked Numbers Alert**: Red badge with X icon next to blocked numbers
- **Cart Summary Card**: Sticky bottom card on mobile, sidebar on desktop

### Results Display Cards
- **Result Card**: Glass morphism card with gradient border
- **API Results**: Live badge with pulse animation
- **External Links**: Card with "View Results" CTA, opens new window, external link icon
- **Draw Date/Time**: Prominent display with countdown timer for upcoming draws

### Affiliate Dashboard
- **Referral Code Display**: Large copy-able code in bordered container
- **Stats Cards**: 4-card grid showing referrals, earnings, pending, total
- **Earnings Table**: Striped table with pagination
- **Share Buttons**: Icon-only buttons for social sharing (if links available)

### Profile & History
- **Balance Card**: Large card at top with balance, deposit/withdraw CTAs
- **Transaction Tabs**: Tab interface for Bets/Deposits/Withdrawals
- **Bet History Items**: Card list with lottery type badge, numbers, status badge (pending/won/lost)
- **Filters**: Dropdown filters for date range, lottery type, bet type

### Forms & Inputs
- **Input Fields**: Rounded-lg borders, focus ring, floating labels
- **Buttons**: 3 variants - Primary (solid), Secondary (outline), Ghost (text)
- **File Upload**: Drag-and-drop zone for slip uploads with preview
- **Payment Info**: QR code display in centered card, bank details in read-only fields

### Admin Panel
- **Blocked Numbers Manager**: Table with add/remove actions, toggle switches
- **Payout Rate Settings**: Input grid for each bet type
- **Status Indicators**: Color-coded badges (active/blocked)

---

## Images Strategy

**Logo/Branding**:
- QNQ Lottery logo: Geometric design combining letters Q, N, Q with luxury crown or diamond element
- Icon-only version for mobile/favicon
- Place in top-left of navigation

**Hero Section (Homepage)**:
- No traditional hero image - lead directly with betting interface
- Background: Subtle gradient with geometric pattern overlay
- Focus on calculator interface as primary visual

**Results Page**:
- Lottery type icons from Lucide React
- No decorative images - focus on data clarity
- Flag icons for international lotteries (from CDN if available)

**Profile/Affiliate**:
- Avatar placeholders from UI Avatars or similar service
- No background images - clean data presentation

**General Image Rules**:
- Use Lucide React icons exclusively
- No external icon CDNs
- Lazy load all images
- Optimize for mobile-first loading

---

## Animations & Interactions

**Minimal Animation Strategy**:
- Hover states: Subtle scale (scale-105) on buttons
- Active states: scale-95 on clickable elements
- Loading: Subtle spinner, no complex animations
- Transitions: Quick duration-200 for state changes
- Cart badge: Gentle bounce animation when items added

**No Animations**:
- Page transitions
- Scroll-triggered effects
- Complex lottery result reveals
- Decorative background movements

---

## Accessibility & Responsiveness

- Minimum touch target: 44x44px on mobile
- High contrast ratios for all text
- Focus visible states on all interactive elements
- ARIA labels for icon-only buttons
- Screen reader support for lottery numbers and amounts
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## Multi-Language Implementation

- Language toggle in navigation (TH/EN flag icons or text)
- All labels, buttons, error messages translated
- Number formatting: Thai numeral support where appropriate
- Currency display: ฿ for Thai Baht
- Date formatting: DD/MM/YYYY for Thai, localized for English
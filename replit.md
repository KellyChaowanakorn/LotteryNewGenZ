# QNQ Lottery System

## Overview

QNQ Lottery is a comprehensive online lottery betting platform that supports multiple lottery types including Thai Government lottery, stock-based lotteries (Thai, Nikkei, Dow Jones, FTSE, DAX), international lotteries (Laos, Hanoi, Malaysia, Singapore), and quick-draw games (Yeekee, Keno). The system provides a complete betting workflow with cart management, payment processing, affiliate program, user wallet management, and administrative controls including blocked number management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript using Vite as the build tool
- Single Page Application (SPA) with client-side routing via Wouter
- Component library built on Radix UI primitives with shadcn/ui design system
- Styling via Tailwind CSS with custom design tokens for theming (light/dark mode support)

**State Management**
- Zustand for global state management with persistence middleware
- TanStack Query (React Query) for server state management and caching
- Separate stores for: cart items, user authentication, admin authentication, blocked numbers, and i18n (internationalization)

**Key Design Decisions**
- Mobile-first responsive design following design guidelines inspired by premium financial platforms
- Thai-English bilingual support with persistent language preferences
- Real-time cart management with local persistence
- Premium credibility through refined details rather than decoration

### Backend Architecture

**Server Framework**
- Express.js HTTP server with custom middleware
- HTTP server wrapped for potential WebSocket upgrades
- RESTful API design pattern

**Database & ORM**
- PostgreSQL database (configured for Neon serverless)
- Drizzle ORM for type-safe database queries
- Schema-first approach with shared TypeScript types between client and server
- Database migrations managed via Drizzle Kit

**Key Features**
- Blocked numbers management by lottery type and bet type
- Payout rate calculation system with configurable rates
- Session-based authentication (prepared for express-session integration)
- Transaction management for deposits, withdrawals, bets, winnings, and affiliate commissions

**API Structure**
- `/api/blocked-numbers` - CRUD operations for managing blocked lottery numbers
- User, bet, transaction, and affiliate management endpoints (referenced in client code)
- Rate limiting and security middleware ready for production

### Data Models

**Core Entities**
1. **User** - Authentication, balance, referral codes, affiliate earnings
2. **Bet** - Lottery type, bet type, numbers, amounts, status tracking
3. **BlockedNumber** - System-wide number restrictions by lottery and bet type
4. **Transaction** - Financial movements (deposits, withdrawals, winnings, affiliate commissions)
5. **Affiliate** - Referral tracking between users

**Lottery Types** - 12 supported types with localized names and draw schedules
**Bet Types** - 9 bet variations with different payout multipliers (3.2x to 4500x)

### Authentication & Authorization

**User Authentication**
- Client-side mock authentication for development
- Prepared for server-side session management with connect-pg-simple
- Separate admin authentication system
- Protected routes and conditional UI rendering

**Security Considerations**
- Credential-based API requests
- CORS configuration prepared
- Rate limiting infrastructure ready
- Input validation via Zod schemas

## External Dependencies

### Third-Party Services

**Payment Integration**
- PromptPay QR code generation for deposits
- Manual payment verification via slip upload
- Bank transfer support (KBank configured as example)
- Prepared for Stripe integration (dependency installed)

**Lottery Results**
- External API integration planned for live lottery results
- Mock data structure for 12 lottery types
- Real-time update capability via polling/WebSocket

### Key NPM Packages

**UI & Styling**
- `@radix-ui/*` - Headless UI component primitives
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library

**Data & Forms**
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation

**Database**
- `@neondatabase/serverless` - Neon PostgreSQL driver
- `drizzle-orm` - TypeScript ORM
- `drizzle-zod` - Schema to Zod converter

**Utilities**
- `date-fns` - Date manipulation
- `qrcode.react` - QR code generation
- `nanoid` - Unique ID generation
- `zustand` - State management

### Font Dependencies
- Google Fonts CDN: Inter (primary), Noto Sans Thai (Thai support), Urbanist (accent/logo)

## Recent Changes

### PostgreSQL Database Integration (Nov 29, 2025)
- Migrated from in-memory storage to PostgreSQL database using Drizzle ORM
- Updated schema.ts with proper Drizzle table definitions using pgTable
- Implemented DatabaseStorage class replacing MemStorage for all CRUD operations
- All routes now properly parse integer IDs for database operations
- Tables created: users, bets, blocked_numbers, transactions, affiliates
- User IDs are now integers (serial primary key) instead of strings
- Added proper foreign key relationships between tables
- Affiliate system properly tracks referrals and calculates 20% commission on bets

### Password Security Update (Nov 29, 2025)
- Implemented secure password hashing using Node.js crypto module (scrypt algorithm)
- New passwords are stored as `salt:hash` format with 32-byte salt and 64-byte key
- Login verification uses timing-safe comparison to prevent timing attacks
- Backward compatible: old plaintext passwords still work for existing users
- New file: server/password.ts with hashPassword() and verifyPassword() functions

### Lottery Results Page Enhancement (Nov 29, 2025)
- Thai Government lottery: Live API integration from rayriffy.com
- External links for all 12 lottery types to official/trusted result sources:
  - Thai Stock: SET.or.th (ตลาดหลักทรัพย์แห่งประเทศไทย)
  - International stocks: Investing.com
  - Regional lotteries: Official lottery sites

### Payout Rates Error Handling Enhancement (Nov 29, 2025)
- Storage layer now throws explicit errors when payout rates are missing instead of silently using defaults
- Bet creation endpoint catches payout rate errors and returns user-friendly "System configuration error" message
- Admin UI shows blocking error state when payout settings are incomplete or fail to load
- Displays count of found rates vs expected rates (e.g., "Found 7/9 rates") to help diagnose issues
- Initialization of payout rates occurs at server startup via initializePayoutRates()

### Telegram Notification System (Nov 29, 2025)
- Real-time notifications via Telegram Bot API for all financial transactions
- New file: server/telegram.ts with notification functions
- Environment secrets: TELEGRAM_TOKEN and CHAT_ID stored in Replit Secrets
- Notification types implemented:
  1. **Customer Deposit Request** - Sent when user submits deposit request (shows "📎 มีสลิปแนบ" or "⚠️ ไม่มีสลิป")
  2. **Customer Withdrawal Request** - Sent when user submits withdrawal request
  3. **Customer Bet Placement** - Sent when user purchases lottery tickets (includes lottery type, bet type, numbers, amount)
  4. **Admin Approval** - Sent when admin approves deposit/withdrawal
  5. **Admin Rejection** - Sent when admin rejects deposit/withdrawal
- All notifications include: username, user ID, amount, timestamp, transaction type
- Bet notifications include detailed breakdown of each bet item
- Admin action notifications include transaction ID for reference

### Smart Checkout Flow (Nov 29, 2025)
- **Balance-aware checkout**: Users with sufficient balance place bets directly; insufficient balance users see deposit modal
- **Atomic transaction for bet placement**: 
  - New storage method `createBetsWithBalanceDeduction` uses Drizzle transaction for all-or-nothing operation
  - Creates all bets, deducts balance, and logs transaction in single atomic operation
  - If any operation fails, entire transaction rolls back automatically
- **Server-side validation**: Balance check performed inside transaction to prevent race conditions
- **Frontend reliability**: Removed manual balance updates; relies on react-query cache invalidation to sync with server
- **Flow**: Deposit → Admin approval → Balance credited → User shops → Smart checkout based on balance

### Admin Slip Viewing (Nov 29, 2025)
- Added slip image viewer in Admin page using Dialog component
- Admins can view payment slips before approving/rejecting deposit requests
- Shows "ดูสลิป" button when slip is available

### Betting Limits System (Nov 29, 2025)
- Admin-configurable max bet amounts per number with optional lottery type associations
- Schema: `betLimits` table (id, number, maxAmount, isActive) with `betLimitLotteryTypes` join table (betLimitId, lotteryType)
- Storage methods: CRUD for bet limits with transaction-safe operations
- API endpoints: `/api/bet-limits` (GET all, POST create, PUT update, DELETE remove)
- Admin UI: New "Limits" tab with form to add limits (number, lottery types, max amount) and table to manage existing limits
- Enforcement: Checks limits before bet creation in `/api/bets`, returns descriptive error with max/current/remaining amounts
- Limits can apply to all lottery types (no associations) or specific selected types
- Per-draw enforcement: Sums existing bets for same number/lottery/draw date when checking limits

### Bet Type Enable/Disable System (Nov 29, 2025)
- Admin-configurable global toggle for each bet type (3 ตัวบน, 2 ตัวบน, วิ่งบน, etc.)
- Schema: `betTypeSettings` table (id, betType, isEnabled, updatedAt)
- Storage methods: `initializeBetTypeSettings()`, `getBetTypeSettings()`, `updateBetTypeSetting()`, `isBetTypeEnabled()`
- API endpoints: `GET /api/bet-type-settings`, `PATCH /api/bet-type-settings/:betType`
- Admin UI: New "ประเภท" (Types) tab with toggle switches for each of the 9 bet types
- Enforcement: Each cart item validated via `isBetTypeEnabled()` before processing in `/api/bets`
- Validation order: bet type enabled → payout rate → blocked numbers → bet limits
- All bet types initialized as enabled on server startup
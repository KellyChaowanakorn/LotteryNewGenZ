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
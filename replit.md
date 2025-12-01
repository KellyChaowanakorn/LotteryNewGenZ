# QNQ Lottery System

## Overview
QNQ Lottery is an online betting platform supporting diverse lottery types including Thai Government, stock-based (Thai, Nikkei, Dow Jones, FTSE, DAX), international (Laos, Hanoi, Malaysia, Singapore), and quick-draw games (Yeekee, Keno). It offers a complete betting experience with cart management, payment processing, an affiliate program, user wallet, and administrative controls like blocked number management. The system aims for a premium user experience with robust backend functionality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is a React 18 SPA with TypeScript, built using Vite. It leverages Radix UI and shadcn/ui for components, styled with Tailwind CSS, supporting custom theming and light/dark modes. State management uses Zustand for global state and TanStack Query for server state. The design is mobile-first, responsive, and supports Thai-English bilingualism.

### Backend Architecture
The backend is an Express.js server with a RESTful API design. It uses PostgreSQL (Neon serverless) with Drizzle ORM for type-safe queries. Key features include blocked number management, configurable payout rates, session-based authentication, and robust transaction management. API endpoints manage blocked numbers, users, bets, transactions, and affiliates, with security middleware in place.

### Data Models
Core entities include `User`, `Bet`, `BlockedNumber`, `Transaction`, and `Affiliate`. The system supports 12 lottery types and 9 bet variations with defined payout multipliers.

### Authentication & Authorization
The system supports both user and admin authentication with protected routes. Security considerations include credential-based API requests, CORS configuration, rate limiting, and input validation via Zod schemas.

### Key Features
- **Smart Checkout Flow**: Automatically handles sufficient/insufficient balance scenarios, integrating with deposit modals. Bet placement is an atomic transaction.
- **Winner Verification System**: Automates winner processing upon lottery result input, credits user balances, and provides admin and user interfaces for winner review and self-checking.
- **Betting Limits System**: Allows administrators to configure maximum bet amounts per number, enforceable by lottery type.
- **Bet Type Enable/Disable**: Administrators can globally toggle the availability of each of the 9 bet types.
- **Affiliate Program**: Commissions are based on a percentage of referred users' deposits.
- **Deposit Bonus System**: Automatically applies a bonus for deposits exceeding a certain threshold.
- **Permutation Calculator**: A dedicated page for generating permutations for multi-digit bets, including duplicate handling and potential winnings display.

## External Dependencies

### Third-Party Services
- **Payment Integration**: PromptPay QR code generation, manual slip upload verification, bank transfer support (e.g., KBank). Prepared for Stripe integration.
- **Lottery Results**: Planned integration with external APIs for live lottery results.
- **Messaging**: Telegram Bot API for real-time notifications on financial transactions and winner processing.

### Key NPM Packages
- **UI & Styling**: `@radix-ui/`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
- **Data & Forms**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`.
- **Utilities**: `date-fns`, `qrcode.react`, `nanoid`, `zustand`.

### Font Dependencies
- Google Fonts CDN: Inter, Noto Sans Thai, Urbanist.
# Walrus Storage Marketplace

> A decentralized marketplace for buying and selling Walrus storage resources on the Sui blockchain

## The Problem

When users need decentralized storage on the Walrus network, they typically purchase it directly from the system at full price. However, this creates several inefficiencies:

- **Over-provisioning**: Users often buy more storage than they actually need, leading to wasted capacity
- **Inflexible allocation**: Storage comes in fixed increments that may not match actual requirements
- **Sunk costs**: Users who've purchased storage for long periods but no longer need it have no way to recoup their investment
- **No price discovery**: There's no secondary market to establish fair market prices based on supply and demand
- **Timing mismatches**: Users may need storage for different time periods (epochs) than what's available from the system

This results in poor resource utilization across the network and higher costs for users who could benefit from existing, underutilized storage capacity.

## The Solution

The Walrus Storage Marketplace creates a **secondary market** where users can buy and sell pre-existing storage resources. Think of it like a used car marketplace, but for decentralized storage:

- **Sellers** can list their unused or partially-used storage and set their own prices, recouping some of their initial investment
- **Buyers** can browse available storage, compare prices, and potentially save money compared to buying new storage from the system
- **Flexible splitting** allows buyers to purchase exactly what they need—either by storage size (bytes) or time period (epochs)
- **Smart optimization** automatically finds the cheapest way to fulfill storage needs by combining marketplace purchases with new system reservations when necessary

For example, if you need 1MB of storage for 40 epochs:
- The marketplace might have someone selling 2MB for 50 epochs at a discount
- You could buy a portion of that (1MB for 40 epochs) at a lower price than buying new
- The seller keeps the remainder listed, and you get storage at a better price
- Everyone wins through better resource allocation

## How It Works

The marketplace is built on a three-tier architecture that combines blockchain smart contracts, real-time indexing, and intelligent optimization:

### Smart Contracts (Move on Sui)

The marketplace smart contract (`contracts/marketplace.move`) handles all storage transactions:

- **List Storage**: Sellers can list their Walrus storage resources with custom pricing (price per byte per epoch)
- **Buy Full Storage**: Purchase an entire listing in one transaction
- **Buy Partial Storage**: Purchase just what you need:
  - By **epoch range**: Buy storage for specific time periods (e.g., epochs 10-50)
  - By **size**: Buy a portion of the total storage (e.g., 500KB out of 1MB)
- **Automatic Splitting**: When partial purchases occur, the contract automatically splits the storage and re-lists the remainder
- **Fee System**: Configurable marketplace fees support platform sustainability

All transactions are atomic, trustless, and emit events for real-time tracking.

### Backend (NestJS + PostgreSQL)

The backend (`back-end/`) provides three core services:

1. **Sui Indexer**: Polls the blockchain every 5 seconds to detect marketplace events (listings, purchases, delistings), processes them, and stores them in PostgreSQL for fast querying

2. **Walrus Integration**: Interfaces with the Walrus network to fetch current storage costs and system state, enabling cost comparisons

3. **Storage Optimizer**: The secret sauce—an intelligent algorithm that:
   - Analyzes all active marketplace listings
   - Calculates Walrus system costs
   - Runs multiple optimization strategies (greedy, dynamic programming, hybrid)
   - Returns the cheapest way to fulfill a storage request
   - Generates Programmable Transaction Block (PTB) metadata for seamless frontend execution

The backend also provides real-time WebSocket updates, so users see marketplace changes instantly.

### Frontend (Next.js + React)

The web application (`front-end/`) provides an intuitive interface for:

- **Reserving Storage**: Enter your storage needs and see the optimized allocation plan with cost savings
- **Browsing Listings**: View all available storage, filter by price, size, and duration
- **Managing Your Assets**: See your owned storage and blob objects in one place
- **Listing Storage**: Put your unused storage up for sale with custom pricing
- **Real-time Updates**: Instant notifications when listings change or purchases occur

The frontend integrates with Sui wallets (Sui Wallet, Suiet, Ethos, etc.) and constructs complex Programmable Transaction Blocks to execute optimization plans in a single atomic transaction.

### High-Level Flow

```
1. User enters storage requirements (size + duration)
   ↓
2. Frontend calls Backend Optimizer API
   ↓
3. Optimizer queries marketplace listings from database
   ↓
4. Algorithm finds cheapest combination of:
   - Marketplace purchases (full or partial)
   - New system reservations (if needed)
   ↓
5. Returns optimized plan + cost comparison
   ↓
6. Frontend constructs Programmable Transaction Block (PTB)
   ↓
7. User approves transaction in wallet
   ↓
8. Smart contract executes:
   - Transfers storage objects
   - Splits/fuses storage as needed
   - Processes payments
   - Emits events
   ↓
9. Backend indexer detects events
   ↓
10. Database updated + WebSocket broadcast
   ↓
11. All connected clients see real-time updates
```

## Key Features

- **Secondary Market**: Buy and sell existing Walrus storage resources
- **Flexible Splitting**: Purchase storage by exact size or time period needed
- **Smart Optimization**: Algorithm automatically finds the cheapest allocation strategy
- **Cost Transparency**: Always see optimized price vs. system-only price comparison
- **Real-time Updates**: WebSocket-powered live marketplace data
- **Event Sourcing**: Complete audit trail of all marketplace activity
- **Trustless Transactions**: Smart contracts ensure secure, atomic operations
- **Programmable Transactions**: Complex multi-step operations in a single transaction
- **Multi-Wallet Support**: Works with all major Sui wallets
- **Pro-rated Pricing**: Fair pricing calculations for partial purchases

## Technology Stack

### Smart Contracts
- **Move** (Sui blockchain smart contract language)
- **Sui Framework** (blockchain primitives)
- **Walrus Storage Framework** (storage resource types)

### Backend
- **NestJS** (Node.js framework)
- **PostgreSQL** (database)
- **Prisma ORM** (database toolkit)
- **Socket.io** (WebSocket for real-time updates)
- **@mysten/sui** (Sui blockchain SDK)
- **@mysten/walrus** (Walrus storage SDK)

### Frontend
- **Next.js 15** (React framework)
- **React 19** (UI library)
- **TypeScript** (type safety)
- **TailwindCSS 4** (styling)
- **Radix UI** (component library)
- **Sui dApp Kit** (wallet integration)
- **TanStack React Query** (data fetching)
- **Socket.io Client** (real-time updates)
- **Recharts** (analytics visualization)

## Project Structure

```
storage-marketplace/
├── contracts/           # Sui Move smart contracts
│   ├── marketplace.move # Core marketplace logic
│   └── README.md       # Contract documentation
│
├── back-end/           # NestJS backend API & indexer
│   ├── src/
│   │   ├── sui-indexer/        # Blockchain event indexer
│   │   ├── walrus/             # Walrus integration
│   │   └── storage-optimizer/  # Optimization algorithm
│   └── README.md       # Backend setup & API docs
│
├── front-end/          # Next.js web application
│   ├── app/            # Pages & routes
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── README.md       # Frontend setup guide
│
├── scripts/            # Development & testing utilities
│   └── test-walrus-upload.sh  # Upload test files to Walrus
│
└── example/            # Algorithm examples & documentation
    ├── walrus-storage-optimizer.ts  # Core optimization logic
    └── walrus-storage-example.ts    # Usage examples
```

Each component has its own detailed README with setup instructions, API documentation, and development guides.

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Sui CLI** (for smart contract development)
- **Walrus CLI** (for storage operations)
- **PostgreSQL** (for backend database)

### Quick Setup

1. **Smart Contracts**: See [contracts/README.md](contracts/README.md) for deploying the marketplace contract

2. **Backend**: See [back-end/README.md](back-end/README.md) for setting up the API server and indexer

3. **Frontend**: See [front-end/README.md](front-end/README.md) for running the web application

### Resources

- [Walrus Documentation](https://docs.walrus.xyz)
- [Sui Documentation](https://docs.sui.io)
- [Move Language Guide](https://move-language.github.io/move/)

## Architecture Highlights

### Event-Driven Design

The marketplace uses an **event-sourced architecture** where all state changes are captured as immutable events. The backend maintains two types of tables:

- **Event History**: Append-only logs of every marketplace action (never modified)
- **Current State**: Derived views of active listings (updated based on events)

This provides complete auditability while enabling fast queries for the frontend.

### Optimization Algorithm

The storage optimizer implements multiple strategies:

1. **Greedy Algorithm**: Sort listings by price per byte, select cheapest first
2. **Dynamic Programming**: Find optimal subset of listings
3. **Hybrid Strategy**: Combine marketplace + new system purchase
4. **System-Only**: Baseline comparison (buy everything new)

The backend compares all strategies and returns the cheapest option, along with execution metadata for the frontend to construct the transaction.

### Programmable Transaction Blocks

Complex operations (buying multiple partial listings, fusing storage, etc.) are executed atomically using Sui's Programmable Transaction Block (PTB) feature. The optimizer generates PTB metadata that the frontend uses to construct transactions, ensuring all-or-nothing execution.

---

**Built with ❤️ for the Walrus and Sui ecosystems**

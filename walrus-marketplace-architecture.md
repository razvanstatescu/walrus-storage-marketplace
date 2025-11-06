# Walrus Storage Marketplace - Architecture Design Document

## Project Overview

A decentralized marketplace for trading Walrus Storage objects on Sui blockchain, enabling efficient allocation of storage resources through intelligent optimization algorithms. The marketplace allows users to buy and sell storage capacity with automatic splitting and merging of storage objects to achieve optimal pricing.

## Core Value Proposition

The marketplace solves the problem of inefficient storage allocation by:
- Automatically finding the best combination of available storage objects to fulfill buyer requests
- Enabling sellers to monetize unused storage capacity
- Reducing costs for buyers through intelligent resource optimization

## System Architecture

### Three-Tier Architecture

The system follows a classic three-tier architecture with blockchain integration:

1. **Smart Contract Layer** (Sui Move)
   - Handles all on-chain business logic
   - Manages storage listings and ownership transfers
   - Ensures trustless transactions between parties

2. **Backend Service Layer** (Node.js/TypeScript)
   - Indexes blockchain events for fast querying
   - Runs optimization algorithms for storage allocation
   - Provides REST API for frontend consumption

3. **Frontend Application Layer** (React/Next.js)
   - User interface for buyers and sellers
   - Wallet integration for transaction signing
   - PTB (Programmable Transaction Block) construction

## Component Details

### Smart Contracts (Sui Move)

**Purpose**: Provide trustless marketplace functionality with atomic operations

**Core Responsibilities**:
- Storage listing management (create, update, cancel listings)
- Price calculation based on seller's pricing model
- Atomic purchase transactions with payment distribution
- Storage object splitting when partial purchases occur
- Escrow and release mechanisms for secure trading

**Key Design Decisions**:
- Listings stored on-chain for transparency and decentralization
- Support for two pricing models: fixed total price or per-unit pricing (per MB per epoch)
- Direct integration with Walrus storage system contracts
- Minimal fee structure (simple percentage-based marketplace fee)

**Contract Modules**:
- `storage_market`: Main marketplace logic
- `listing`: Storage listing struct and management
- `pricing`: Price calculation utilities

### Backend Service

**Purpose**: Provide optimization services and indexed data access

**Core Responsibilities**:
- Real-time indexing of Sui blockchain events
- Storage object availability tracking
- Running optimization algorithms for best price discovery
- Caching frequently accessed data
- Providing REST API endpoints for frontend

**Data Storage Strategy**:
- PostgreSQL for persistent storage of indexed data
- Tables for: listings, transactions, storage_objects, price_history
- Optimized indexes on epoch ranges and storage sizes for fast querying

**API Endpoints**:
- `GET /api/storage/available`: Query available storage by requirements
- `POST /api/storage/optimize`: Get optimal allocation for a purchase request
- `GET /api/listings/active`: Retrieve current marketplace listings
- `GET /api/stats`: Marketplace statistics and metrics

**Event Processing**:
- Subscribes to Sui event stream
- Processes: ListingCreated, StorageSold, ListingCancelled events
- Updates local database in near real-time

### Frontend Application

**Purpose**: Provide intuitive user interface for marketplace interactions

**Core Features**:

**Buyer Interface**:
- Storage requirement input (size in MB, epoch duration)
- Real-time price calculation and optimization results
- Visual breakdown of recommended storage allocation
- One-click purchase with transaction preview
- Transaction status tracking

**Seller Interface**:
- Storage object selection from wallet
- Pricing configuration (fixed or dynamic)
- Bulk listing capabilities
- Active listings management dashboard
- Sales history and analytics

**Technical Components**:
- Wallet connection using Sui Wallet Adapter
- PTB builder for complex transaction construction
- Real-time updates via polling or websockets
- Responsive design for mobile and desktop

## Data Flow

### Purchase Flow

1. **Buyer Request**: User inputs storage requirements (size, duration)
2. **Optimization**: Frontend calls backend optimization API
3. **Algorithm Processing**: Backend runs allocation algorithm against available storage
4. **Results Display**: Optimal allocation shown with price breakdown
5. **Transaction Construction**: Frontend builds PTB with multiple operations
6. **Wallet Signing**: User approves transaction in wallet
7. **Execution**: PTB executed atomically on Sui blockchain
8. **Confirmation**: Backend indexes result, frontend shows success

### Listing Flow

1. **Storage Selection**: Seller chooses Storage objects from wallet
2. **Price Setting**: Configures pricing model and amounts
3. **Listing Creation**: Transaction sent to create on-chain listing
4. **Indexing**: Backend captures and indexes new listing
5. **Discovery**: Listing becomes available in optimization algorithm

## Transaction Complexity

### Programmable Transaction Blocks (PTBs)

The marketplace leverages Sui's PTB capability for complex atomic operations:

**Single PTB can contain**:
- Multiple storage purchases from different sellers
- Storage splitting operations (by size or epoch)
- Direct Walrus storage reservations
- Storage merging (fusion) operations
- Payment distributions to multiple parties

**PTB Construction Strategy**:
- Backend provides optimal allocation plan
- Frontend constructs PTB based on allocation
- Operations ordered for dependency management
- Atomic execution ensures all-or-nothing

## Storage Operations

### Core Operations

1. **Split by Epoch**: Divide storage object temporally
2. **Split by Size**: Divide storage object by capacity
3. **Fuse by Period**: Merge adjacent time periods
4. **Fuse by Amount**: Merge same-period storage
5. **Direct Purchase**: Buy from Walrus system
6. **Marketplace Purchase**: Buy from another user

### Operation Selection Logic

The optimization algorithm determines which operations to use based on:
- Available storage objects and their characteristics
- Cost comparison between marketplace and direct Walrus purchase
- Minimize number of operations for gas efficiency
- Preference for larger chunks to reduce complexity

## Security Considerations

### Smart Contract Security
- Reentrancy protection on purchase functions
- Validation of storage object ownership
- Arithmetic overflow protection
- Access control for listing management

### Backend Security
- API rate limiting
- Input validation and sanitization
- Database query parameterization
- Authentication for sensitive endpoints (future)

### Frontend Security
- Transaction simulation before signing
- Clear display of transaction effects
- Wallet connection best practices
- CORS and CSP policies

## Scalability Considerations

### Current MVP Limitations
- Single backend instance
- Basic database indexing
- Synchronous optimization algorithm
- No caching layer

### Future Scaling Path
- Horizontal backend scaling with load balancing
- Redis caching for hot data
- Optimization algorithm parallelization
- Event processing queue (Kafka/RabbitMQ)
- CDN for static frontend assets
- Database read replicas

## Development Priorities

### Phase 1: Core Functionality (Days 1-3)
- Smart contract development and testing
- Basic backend indexer
- Database schema and setup

### Phase 2: Optimization Integration (Days 4-5)
- Algorithm API endpoint
- PTB construction logic
- Price calculation service

### Phase 3: User Interface (Days 6-7)
- Buyer flow implementation
- Seller flow implementation
- Wallet integration
- End-to-end testing

## Technical Stack

### Blockchain
- Sui Network (Testnet for MVP)
- Move language for smart contracts
- Walrus Storage Protocol

### Backend
- Node.js with TypeScript
- Express.js or Fastify
- PostgreSQL database
- Sui SDK for blockchain interaction

### Frontend
- Next.js (React framework)
- Sui Wallet Adapter
- TailwindCSS for styling
- Axios/Fetch for API calls

### Development Tools
- Move CLI for contract compilation
- Sui Explorer for transaction debugging
- Docker for local development
- Jest for testing

## Success Metrics

### MVP Success Criteria
- Successfully list and purchase storage
- Optimization algorithm reduces costs by >20% vs. naive approach
- Support for at least 10 concurrent listings
- Transaction success rate >95%
- Sub-3 second optimization response time

### Key Performance Indicators
- Total storage volume traded
- Average cost savings for buyers
- Number of active listings
- User wallet connections
- Transaction completion rate

## Future Enhancements (Post-MVP)

### Immediate Next Steps
- Auction mechanism for storage
- Reputation system for sellers
- Advanced search and filtering
- Price history charts
- Storage expiration notifications

### Long-term Vision
- Cross-chain storage marketplace
- Storage derivatives and futures
- Automated market making (AMM) for storage
- Storage bundling and packages
- Enterprise features and SLAs

## Risk Mitigation

### Technical Risks
- **Smart contract bugs**: Extensive testing, formal verification consideration
- **Optimization algorithm performance**: Caching, pre-computation strategies
- **Event indexing lag**: Multiple indexer nodes, event replay capability

### Market Risks
- **Low liquidity**: Incentive programs, market making
- **Price volatility**: Price bands, time-weighted pricing
- **Storage fragmentation**: Periodic defragmentation incentives

## Conclusion

This architecture provides a solid foundation for a Walrus Storage Marketplace MVP that can be built within a 7-day timeframe. The design prioritizes core functionality while maintaining extensibility for future enhancements. The optimization algorithm serves as the key differentiator, providing real value to users through intelligent storage allocation.

The modular architecture ensures that each component can be developed and tested independently, enabling parallel development and faster iteration. By focusing on essential features and leveraging existing tools and frameworks, the MVP can demonstrate the marketplace's value proposition while laying groundwork for a more comprehensive platform.
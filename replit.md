# REGMIK ERP System

## Overview

REGMIK ERP is a comprehensive enterprise resource planning system designed specifically for Ukrainian businesses. The system provides 21+ core modules for managing inventory, production, shipping, multi-currency operations, and complete business workflows with full Ukrainian localization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database ORM**: Drizzle ORM with custom migration system
- **Authentication**: Custom session-based auth with PostgreSQL session store
- **File Uploads**: Multer middleware for XML imports
- **API Design**: RESTful endpoints with structured error handling

### Database Design
- **Primary Database**: PostgreSQL with UTF-8 encoding
- **Connection Pooling**: pg pool with connection limits
- **Session Storage**: PostgreSQL-backed sessions table
- **Schema Management**: Custom migration system (bypasses drizzle-kit)

## Key Components

### Core Business Modules
1. **Inventory Management**: Products, components, warehouses, stock tracking
2. **Production Management**: Manufacturing orders, recipes, tech cards, BOM
3. **Order Management**: Sales orders, supplier orders, shipments
4. **Client Management**: Customers, contacts, addresses, Nova Poshta integration
5. **Financial Management**: Multi-currency support, cost calculations, pricing
6. **User Management**: Role-based access control, permissions, audit logs
7. **Reporting & Analytics**: Advanced reports, dashboards, KPI tracking

### Integration Capabilities
- **Nova Poshta API**: Shipping integration with cities/warehouses cache
- **XML Import/Export**: Support for 1C and other ERP system data exchange
- **Sync API**: Bidirectional synchronization with Bitrix24 and 1C systems
- **Email Service**: SMTP integration for notifications and correspondence

### Authentication System
- Simple session-based authentication
- PostgreSQL session storage with automatic cleanup
- Role-based permissions with module access control
- Password reset functionality with email verification

## Data Flow

### Request Flow
1. Client requests → Express middleware → Route handlers
2. Authentication check → Permission validation
3. Database operations via Drizzle ORM
4. Response formatting with error handling
5. UTF-8 encoding for Ukrainian content

### Database Operations
1. Connection pooling manages PostgreSQL connections
2. Drizzle ORM provides type-safe database operations
3. Custom migration system handles schema changes
4. Foreign key constraints ensure data integrity
5. Indexes optimize query performance

### File Processing
1. XML imports processed through Multer → xml2js parser
2. Data validation using Zod schemas
3. Batch processing for large datasets
4. Error logging and rollback capabilities

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm, pg
- **Web Framework**: express, session management
- **UI Components**: @radix-ui components, tailwindcss
- **Validation**: zod, @hookform/resolvers
- **File Processing**: multer, xml2js, @xmldom/xmldom
- **Email**: nodemailer, @sendgrid/mail
- **Authentication**: bcryptjs, crypto

### Development Tools
- **Build**: vite, esbuild, typescript
- **Code Quality**: eslint, prettier
- **Testing**: Built-in validation and error handling

### External APIs
- **Nova Poshta**: Shipping and logistics integration
- **Currency Rates**: National Bank of Ukraine API
- **Email Services**: SMTP/SendGrid for notifications

## Deployment Strategy

### Production Environment
- **Hosting**: Replit with autoscale deployment
- **Database**: Neon PostgreSQL with SSL connection
- **Port Configuration**: 3000 (internal), 5000 (external)
- **Session Management**: PostgreSQL-backed with 7-day TTL
- **Environment Variables**: Secure configuration via .env.production

### Development Workflow
- **Development Server**: `npm run dev` (Vite + Express)
- **Production Build**: `npm run build` (Vite + esbuild)
- **Production Start**: `npm run start` (Node.js server)
- **Database Management**: Custom scripts replace drizzle-kit

### Monitoring & Maintenance
- **Logging**: Structured console logging with timestamps
- **Error Handling**: Comprehensive error catching and reporting
- **Database Health**: Connection monitoring and automatic reconnection
- **Performance**: Query optimization and connection pooling

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

## Recent Changes

### June 24, 2025
- Created universal DataTable component for all system lists with:
  - Advanced pagination with configurable page sizes and first/last page navigation
  - Drag-and-drop column reordering, click-to-sort, resizable columns with persistence
  - Font customization (size, family, weight, style) for rows and headers separately
  - Background and text color customization for rows and headers
  - Unified search and filtering design across all pages
  - Table/cards view toggle with custom card templates
  - Settings persistence in localStorage per table
- Migrated supplier-receipts and components pages to use DataTable
- Removed duplicate pagination and sorting code across pages

### June 23, 2025
- Fixed supplier receipts XML import with external_id field as integer type
- ID_LISTPRIHOD now correctly stores in supplier_receipts.external_id 
- Updated supplier receipt items import to use external_id lookup instead of direct ID
- INDEX_LISTPRIHOD searches supplier_receipts by external_id to find receipt_id
- INDEX_DETAIL uses component SKU for lookup in components table
- Fixed decimal number parsing with comma separator (Ukrainian format)
- Added comprehensive foreign key validation and component auto-creation

### Initial Setup
- June 23, 2025. Initial ERP system setup with Ukrainian localization
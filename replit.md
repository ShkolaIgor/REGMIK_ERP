# REGMIK ERP System

## Overview
REGMIK ERP is a comprehensive enterprise resource planning system tailored for Ukrainian businesses. It offers 21+ core modules covering inventory, production, shipping, multi-currency operations, and complete business workflows with full Ukrainian localization. The vision is to provide a robust, integrated solution that streamlines operations and enhances decision-making for businesses in Ukraine.

## User Preferences
Preferred communication style: Simple, everyday language.
User has Russian-language 1C system and needs integration setup guidance.

## Recent Changes (Updated 2025-08-02)
- **Packing List Section Added**: Created separate "ПАКУВАЛЬНИЙ ЛИСТ - ВСІ ПОЗИЦІЇ" section in production sheets that lists all order items regardless of department assignments
- **Print Layout Optimized**: Maintained landscape orientation with two-column layout for better space utilization in production documents
- **Login Form Enhanced**: Added proper `autocomplete` attributes (`username`, `current-password`) and "Remember me" checkbox for browser password autofill functionality
- **Browser Compatibility Improved**: Fixed form structure to work with browser password managers by adding `name` attributes and `method="post"`
- **UI Consistency Maintained**: Updated login form while preserving existing design and functionality

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database ORM**: Drizzle ORM
- **Authentication**: Custom session-based with PostgreSQL session store
- **File Uploads**: Multer for XML imports
- **API Design**: RESTful with structured error handling

### Database
- **Primary Database**: PostgreSQL (UTF-8 encoding)
- **Connection Pooling**: pg pool
- **Session Storage**: PostgreSQL-backed sessions table
- **Schema Management**: Custom migration system

### Key Features
- **Core Business Modules**: Inventory, Production, Order, Client, Financial, User management, Reporting, Data Import.
- **Integration Capabilities**: Nova Poshta API, XML Import/Export (1C compatible), Bidirectional Sync API (Bitrix24, 1C), SMTP Email.
- **Authentication**: Session-based, role-based access control, password reset.
- **Data Flow**: Client requests processed via Express, authenticated, validated, and interact with DB via Drizzle ORM. File processing involves Multer for XML, xml2js parsing, and Zod validation.
- **Deployment Strategy**: Designed for Replit with autoscale, Neon PostgreSQL, secure environment variables, and structured logging.
- **UI/UX Decisions**: Consistent visual style across all 11+ pages with gradient headers, animated statistical cards, and unified search/filter components. Supports table/card view toggle and persists user settings.

## External Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm, pg
- **Web Framework**: express, express-session
- **UI Components**: @radix-ui/react-components, tailwindcss, shadcn/ui
- **Validation**: zod, @hookform/resolvers
- **File Processing**: multer, xml2js, @xmldom/xmldom
- **Email**: nodemailer, @sendgrid/mail
- **Authentication**: bcryptjs, crypto
- **External APIs**: Nova Poshta, National Bank of Ukraine (currency rates), 1C, Bitrix24.
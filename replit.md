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

### June 27, 2025
- ✅ **ВИПРАВЛЕНО: Розгортання приходів постачальників** - додано підтримку expandableContent в DataTable
- ✅ **Додано React.Fragment для розгорнутого контенту** - тепер кожен рядок може мати додатковий розгорнутий рядок
- ✅ **Протестовано розгортання позицій** - підтверджено відображення позицій приходу TEST-9999
- ✅ **Покращено структуру таблиці** - коректне відображення стрілочок та розгорнутого вмісту

### June 26, 2025
- ✅ **Повністю виправлено BOM імпорт з XML** - усунуто всі проблеми з foreign key constraint
- ✅ **Впроваджено SKU-базований пошук** - система тепер шукає компоненти тільки за SKU кодами
- ✅ **Виправлено Drizzle ORM помилки** - видалено некоректні поля з запитів getProductComponents
- ✅ **Додано автентифікацію для BOM імпорту** - захищено endpoint з перевіркою авторизації
- ✅ **Застосовано DataTable до BOM** - покращено відображення списку продуктів з коректною типізацією
- ✅ **Протестовано успішний імпорт** - створено тестові дані та підтверджено роботу з реальними XML файлами
- ✅ **Очищено код від логування** - видалено тимчасові налагоджувальні повідомлення
- ✅ **Застосовано BOM стиль до сторінки Клієнти** - додано професійний header зі статистичними картками
- ✅ **Виправлено проблеми з DataTable** - усунуто React.Fragment помилки та покращено рендеринг
- ✅ **Створено SimpleTable як резервний варіант** - простий компонент для критичних випадків
- ✅ **Повернуто до DataTable на сторінці Клієнти** - відновлено повний функціонал із storageKey
- ✅ **Виправлено пагінацію в DataTable** - примусово встановлено pageSize=10 для коректного відображення

### June 25, 2025
- Додано універсальний DataTable компонент до сторінки Товари з повним функціоналом
- Замінено старий код товарів на DataTable з підтримкою карткового та табличного відображення
- Реалізовано спеціальні шаблони карток для товарів з відображенням цін та статусу
- Виправлено дублювання кнопок пагінації в універсальному компоненті DataTable
- Видалено зайву пагінацію зі сторінки приходів постачальників
- Покращено логіку відображення номерів сторінок у пагінації DataTable
- Виправлено відображення списку постачальників на головній сторінці Постачальники
- Додано детальне логування для API запитів постачальників
- Покращено обробку помилок та станів завантаження у компонентах
- Виправлено API endpoint для отримання списку постачальників з правильною пагінацією
- Додано skeleton loading функціонал до DataTable компоненту для покращення UX
- Виправлено помилки filterCategory та pageSize на сторінці Компоненти
- Реалізовано професійний skeleton loading для табличного та карткового режимів
- Додано анімацію skeleton для заголовків, рядків та карток з реалістичними пропорціями
- Оптимізовано DataTable для великих наборів даних (25,000+ записів)
- Покращено продуктивність пошуку та сортування для сторінки Товари
- Додано інтелектуальну фільтрацію тільки по ключових полях для великих датасетів
- Зменшено розмір сторінки за замовчуванням для великих наборів даних
- Видалено фільтрацію з DataTable, залишено тільки пошук для спрощення інтерфейсу
- Створено новий стиль сторінки Товари як "Каталог товарів" з професійним header
- Додано статистичні картки з інформацією про товари, категорії та ціни
- Виправлено помилку Select.Item з порожнім значенням у формі редагування товару

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
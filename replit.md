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

### July 2, 2025
- ✅ **ВИПРАВЛЕНО КРИТИЧНУ ПРОБЛЕМУ З НУМЕРАЦІЄЮ ЗАМОВЛЕНЬ** - система тепер генерує правильні послідовні номери
- ✅ **Послідовна нумерація**: замість timestamp формату (ORD-1751485965083) тепер генеруються правильні номери (52422, 52423, 52424...)
- ✅ **Розділення полів**: order_number (ERP автогенерація) окремо від invoice_number (номер рахунку з Бітрікс24)
- ✅ **Автоматичне визначення наступного номера**: система знаходить останній числовий номер та інкрементує на 1
- ✅ **Протестовано послідовність**: 52421 → 52422 → 52423 - всі номери генеруються правильно
- ✅ **РЕАЛІЗОВАНО ЗАПОБІГАННЯ ДУБЛІКАТІВ** - система тепер оновлює існуючі замовлення замість створення копій
- ✅ **Пошук за invoice_number**: новий метод getOrderByInvoiceNumber() для виявлення існуючих замовлень
- ✅ **Логіка оновлення**: при повторному отриманні рахунку система оновлює дані та позиції замовлення
- ✅ **Нові методи storage**: updateOrder(), deleteOrderItems(), createOrderItems() для керування замовленнями
- ✅ **Протестовано успішно**: TEST-DUPLICATE-52424 створено → оновлено, RM00-027625 створено → оновлено
- ✅ **Детальне логування**: система показує action: "created" або "updated" в API відповіді
- ✅ **АВТОМАТИЧНЕ СТВОРЕННЯ ТОВАРІВ З БІТРІКС24** - повністю реалізовано функціонал auto-create товарів
- ✅ **API endpoint `/api/bitrix/create-order-from-invoice`** - тепер автоматично створює товари якщо не знайдені
- ✅ **Логіка пошуку товарів** - спочатку шукає за точною назвою, якщо не знайдено → створює новий
- ✅ **SKU генерація** - використовує productCode з Бітрікс24 або автогенерує BTX-timestamp
- ✅ **Ціноутворення** - нові товари отримують ціни з priceAccount з Бітрікс24 даних
- ✅ **Протестовано успішно** - створено товар "Новий товар з Бітрікс24" (SKU: BTX-NEWTST) та замовлення #63
- ✅ **Виправлено дублювання методів** - видалено duplicate getProductProfitability та getTopProfitableProducts
- ✅ **ДЕТАЛЬНЕ ЛОГУВАННЯ ДЛЯ PRODUCTION** - додано повну діагностику Бітрікс24 інтеграції
- ✅ **Логування всіх етапів процесу** - HTTP headers, request body, пошук клієнтів/компаній, обробка товарів
- ✅ **Діагностика помилок** - stack traces, детальні повідомлення та timestamp для всіх critical errors
- ✅ **Тестовий endpoint `/api/bitrix/test-logging`** - для швидкої діагностики отримання даних
- ✅ **ВИРІШЕНО ПРОБЛЕМУ МЕРЕЖЕВОГО З'ЄДНАННЯ** - визначено та усунуто основну причину нефункціональності webhook
- ✅ **Діагностика показала**: PHP скрипт працював правильно, Node.js endpoint працював правильно, проблема - Replit сервер не запущений
- ✅ **Протестовано з production даними** - endpoint успішно приймає та обробляє дані з рахунку РМ00-027625
- ✅ **Створено production deployment інструкцію** - покрокові вказівки для deploy на Replit production
- ✅ **Оновлено PHP скрипт** - підготовлено варіанти URL для development, production та локального тестування
- ✅ **Система готова для production deployment** - повна інтеграція Бітрікс24 з автоматичним створенням товарів, детальним логуванням, правильною нумерацією та вирішеними мережевими проблемами

### June 30, 2025
- ✅ **МАСОВЕ ОЧИЩЕННЯ ЗАСТАРІЛИХ СТОРІНОК** - видалено всі старі версії компонентів системи
- ✅ **Очищено листування** - видалено client-mail-backup, client-mail-broken, client-mail-corrected, client-mail-final
- ✅ **Очищено приходи постачальників** - видалено supplier-receipts-old, clients-old, components-broken, serial-number-settings-old
- ✅ **Виправлено TypeScript помилки** - усунуто помилки типів у сторінці листування з clients.map та порівнянням типів
- ✅ **Виправлено структуру даних** - clientsData?.clients замість прямого масиву для API endpoint /api/clients/search
- ✅ **Виправлено типи clientId** - змінено з string на number у всіх місцях використання
- ✅ **Підтверджено працездатність** - система працює стабільно після очищення, всі сторінки завантажуються без помилок

### June 29, 2025
- ✅ **ЗАВЕРШЕНО МАСОВЕ ОНОВЛЕННЯ СТИЛЮ: Застосовано BOM дизайн до всіх 11 сторінок системи**
- ✅ **Виробництво та планування** - production-planning, production-analytics, production-forecasts
- ✅ **Операційні процеси** - assembly-operations, repairs, cost-calculations, material-shortages
- ✅ **Складське управління** - scanner, serial-numbers, inventory-audits, warehouse-transfers, ordered-products
- ✅ **Уніфіковано візуальний стиль** - всі сторінки мають однакову структуру з градієнтними заголовками
- ✅ **Статистичні картки з анімаціями** - hover ефекти, градієнти та ротація іконок для всіх сторінок
- ✅ **SearchFilters інтеграція** - univerzальний пошук застосовано до всіх сторінок
- ✅ **Кольорові схеми за функціоналом** - production (синій), inventory (зелений), analytics (фіолетовий)
- ✅ **Покращено UX** - великі іконки, читабельні заголовки, професійні кнопки дій
- ✅ **СТВОРЕНО ІНТЕГРАЦІЮ З БІТРІКС24** - повний функціонал синхронізації клієнтів та рахунків
- ✅ **Функції синхронізації** - sendCompanyDataToERP, sendInvoiceToERP аналогічно до 1C інтеграції
- ✅ **API маршрути** - /api/bitrix/sync-company, /api/bitrix/sync-invoice, масова синхронізація
- ✅ **Типізація даних** - повна підтримка TypeScript з інтерфейсами для Бітрікс24 API
- ✅ **Документація** - детальна інструкція з прикладами використання та налаштування
- ✅ **ДОДАНО WEBHOOK ФУНКЦІЇ ДЛЯ ERP** - реалізовано автоматичні виклики в зовнішню ERP систему
- ✅ **sendCompanyDataToERPWebhook** - webhook для компаній з відправкою на https://erp.regmik.ua
- ✅ **sendInvoiceToERPWebhook** - webhook для рахунків з автентифікацією ШкоМ.:100
- ✅ **Webhook endpoints** - /webhook/bitrix/company-to-erp/:id та /webhook/bitrix/invoice-to-erp
- ✅ **Подвійна синхронізація** - локальна ERP база + зовнішня ERP система паралельно
- ✅ **Аналогія з PHP кодом** - точна відповідність sendCompanyInfoTo1C структурі та логіці
- ✅ **ЗАВЕРШЕНО ОБРОБКУ ПОЗИЦІЙ РАХУНКУ** - повна реалізація створення товарів з позицій Бітрікс24
- ✅ **Автоматичне створення товарів** - якщо товар не знайдено за назвою, створюється новий товар
- ✅ **Генерація номерів замовлень** - автоматичне інкрементальне нумерування ORD-XXXXXX
- ✅ **Пошук товарів за назвою** - точний збіг та часткове співпадіння для існуючих товарів
- ✅ **SKU генерація** - використання productCode з Бітрікс24 або автогенерація BTX-timestamp
- ✅ **Створення позицій замовлень** - кожна позиція рахунку стає позицією замовлення ERP
- ✅ **Оновлена документація** - додано опис автоматичного створення товарів та нумерації
- ✅ **ВИПРАВЛЕНО ФОРМУ РЕДАГУВАННЯ КЛІЄНТІВ** - змінено передачу пропу з client на editingClient
- ✅ **ВИПРАВЛЕНО ПОМИЛКУ "Class CRest not found"** - замінено CRest::call на прямі cURL запити
- ✅ **Усунуто залежність від Бітрікс24 REST SDK** - PHP webhook файли тепер працюють самостійно
- ✅ **Створено bitrixApiCall() функцію** - універсальна функція для API запитів до Бітрікс24
- ✅ **Оновлено обидва webhook файли** - bitrix24-webhook-company.php та bitrix24-webhook-invoice.php
- ✅ **Документація виправлення** - створено BITRIX24_CREST_FIX.md з детальним описом змін
- ✅ **ПОВНІСТЮ НАЛАШТОВАНО ЛОКАЛЬНІ WEBHOOK ENDPOINTS** - успішно працюють локальні API маршрути
- ✅ **Endpoint для компаній** - /bitrix/hs/sync/receive_company/ створює клієнтів з правильним client_type_id
- ✅ **Endpoint для рахунків** - /bitrix/hs/sync/receive_invoice/ створює замовлення ERP
- ✅ **Виправлено constraint помилки** - всі обов'язкові поля заповнюються автоматично
- ✅ **Протестовано повну інтеграцію** - створено клієнта (ID: 111) та замовлення (ID: 55)
- ✅ **Локальна архітектура замість зовнішніх викликів** - PHP скрипти викликають локальні endpoints
- ✅ **ЗАВЕРШЕНО СИСТЕМУ ОНОВЛЕННЯ КЛІЄНТІВ ЗА НАЗВОЮ** - успішно реалізовано логіку "update замість duplicate"
- ✅ **Пошук клієнтів за трьома критеріями** - external_id → tax_code → name (точний або повна назва)
- ✅ **Виключення unique полів при оновленні** - externalId та taxCode не передаються в updateClient()
- ✅ **Протестовано оновлення існуючого клієнта** - клієнт ID:111 "АГРОТЕМ, ПП" успішно оновлено
- ✅ **Усунуто database constraint помилки** - система тепер коректно оновлює без порушення унікальності
- ✅ **Подвійна логіка синхронізації** - створення нових + оновлення існуючих клієнтів в одному endpoint
- ✅ **РЕАЛІЗОВАНО УМОВНЕ ОНОВЛЕННЯ TAXCODE** - система розумно оновлює налоговий код тільки коли це безпечно
- ✅ **Запобігання unique constraint помилкам** - taxCode оновлюється тільки якщо клієнт НЕ знайдений за tax_code
- ✅ **Протестовано всі сценарії** - external_id пошук з taxCode оновленням, tax_code пошук без taxCode оновлення
- ✅ **Інтелектуальна логіка foundByTaxCode** - система правильно визначає коли клієнт знайдений за податковим кодом
- ✅ **Збереження цілісності даних** - налоговий код оновлюється безпечно без порушення унікальності

### June 27, 2025
- ✅ **Впроваджено згортальне меню** - замінено старий Layout на сучасний Sidebar компонент
- ✅ **Додано режим "тільки іконки"** - меню згортається показуючи лише іконки без тексту
- ✅ **Створено use-mobile хук** - підтримка адаптивності для мобільних пристроїв
- ✅ **Виправлено expandableContent в DataTable** - додано рендеринг розгорнутих рядків
- ✅ **Зроблено логотип клікабельним** - клік по REGMIK ERP переводить на головну сторінку
- ✅ **Додано кнопку згортання** - SidebarTrigger в header для управління станом меню
- ✅ **РЕВОЛЮЦІЙНА ЗМІНА АРХІТЕКТУРИ: Видалено пошук з DataTable** - створено універсальну систему пошуку
- ✅ **Створено SearchFilters компонент** - універсальний компонент для пошуку та фільтрації всіх сторінок
- ✅ **Застосовано нову архітектуру до всіх сторінок** - products, clients, supplier-receipts, bom тепер використовують SearchFilters
- ✅ **Розділено відповідальність** - DataTable тільки відображає дані, пошук та фільтри обробляються незалежно
- ✅ **Покращено продуктивність** - фільтрація працює на рівні сторінки з оптимізованими запитами
- ✅ **Виправлено фільтрацію клієнтів** - додано стани для типу та статусу з повною функціональністю
- ✅ **Додано фільтрацію до BOM** - SearchFilters з фільтрами за типом товару та статусом активності
- ✅ **ЗАВЕРШЕНО: Застосовано повний стиль BOM до всіх трьох цільових сторінок**
- ✅ **"Рецепти виробництва"** - градієнтний header, статистичні картки, SearchFilters, DataTable
- ✅ **"Технологічні карти"** - повний BOM стиль з іконками та фільтрами за статусом та типом товару
- ✅ **"Управління товарами"** - оновлено заголовок на "Склад товарів" з градієнтним header
- ✅ **Виправлено runtime помилки** - додано null checks для recipe.productId та статистичних розрахунків
- ✅ **Уніфіковано DataTable параметри** - видалено неіснуючі параметри searchableColumns та itemsPerPage
- ✅ **Виправлено використання простору екрану** - змінено container mx-auto на w-full для повноширинного відображення
- ✅ **ЗАВЕРШЕНО: Застосовано повний стиль BOM до сторінки "Замовлення постачальників"**
- ✅ **Створено градієнтний header** - "Склад замовлень постачальників" з кнопками імпорту та створення
- ✅ **Додано статистичні картки** - всього замовлень, активні, загальна сума, очікують підтвердження
- ✅ **Інтегровано SearchFilters** - пошук за номером/постачальником з фільтрами статусу та постачальника
- ✅ **Застосовано DataTable** - повнофункціональна таблиця з колонками, сортуванням та деталями
- ✅ **Додано форматування валюти** - українська локалізація для всіх сум у гривнях

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
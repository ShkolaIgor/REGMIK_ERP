# Nova Poshta API Settings Implementation

## Overview
Successfully implemented separation of Nova Poshta API settings into a dedicated table `client_nova_poshta_api_settings` to enable shipping on behalf of multiple clients with their own API credentials.

## Database Schema Changes

### New Table: `client_nova_poshta_api_settings`
```sql
CREATE TABLE client_nova_poshta_api_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    sender_phone TEXT,
    sender_contact_person TEXT,
    sender_address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_client_nova_poshta_api_settings_client_id ON client_nova_poshta_api_settings(client_id);
CREATE UNIQUE INDEX idx_client_nova_poshta_api_settings_primary ON client_nova_poshta_api_settings(client_id) WHERE is_primary = true;
```

## Implementation Details

### Schema Definition (shared/schema.ts)
- Added `clientNovaPoshtaApiSettings` table definition
- Created TypeScript types: `ClientNovaPoshtaApiSettings`, `InsertClientNovaPoshtaApiSettings`
- Added Zod validation schema: `insertClientNovaPoshtaApiSettingsSchema`

### Storage Interface (server/storage.ts)
Added methods to IStorage interface:
- `getClientNovaPoshtaApiSettings(clientId: number)`
- `getClientNovaPoshtaApiSetting(id: number)`
- `createClientNovaPoshtaApiSettings(settings: InsertClientNovaPoshtaApiSettings)`
- `updateClientNovaPoshtaApiSettings(id: number, settings: Partial<InsertClientNovaPoshtaApiSettings>)`
- `deleteClientNovaPoshtaApiSettings(id: number)`
- `setPrimaryClientNovaPoshtaApiSettings(clientId: number, settingsId: number)`

### Database Implementation (server/db-storage.ts)
Implemented all storage methods with:
- Proper error handling and logging
- Primary setting management (only one primary per client)
- Ordering by primary status and creation date
- Cascade deletion on client removal

### Memory Storage Implementation (server/storage.ts)
Added MemStorage implementation for development/testing:
- In-memory Map storage for API settings
- Complete CRUD operations
- Primary setting enforcement

### API Routes (server/routes.ts)
Created RESTful endpoints:
- `GET /api/clients/:clientId/nova-poshta-api-settings` - List client's API settings
- `GET /api/nova-poshta-api-settings/:id` - Get specific API setting
- `POST /api/clients/:clientId/nova-poshta-api-settings` - Create new API setting
- `PATCH /api/nova-poshta-api-settings/:id` - Update API setting
- `DELETE /api/nova-poshta-api-settings/:id` - Delete API setting
- `PATCH /api/clients/:clientId/nova-poshta-api-settings/:id/set-primary` - Set primary API setting

## Testing Results

### API Functionality Verification
✅ **Create API Settings**: Successfully created multiple API configurations
✅ **Retrieve API Settings**: Proper listing and individual retrieval
✅ **Update API Settings**: Field updates work correctly with timestamp tracking
✅ **Primary Setting Management**: Only one primary setting per client enforced
✅ **Delete API Settings**: Proper removal functionality
✅ **Error Handling**: Appropriate error responses for invalid operations

### Test Data Examples
```json
{
  "id": 2,
  "clientId": 1,
  "apiKey": "backup-api-key-67890",
  "senderPhone": "+380501234568",
  "senderContactPerson": "Марія Коваленко",
  "senderAddress": "м. Львів, вул. Свободи, 15",
  "isPrimary": true,
  "isActive": true,
  "createdAt": "2025-06-15T06:37:26.877Z",
  "updatedAt": "2025-06-15T06:37:31.555Z"
}
```

## Business Benefits

### Multi-Client API Support
- Each client can have their own Nova Poshta API credentials
- Multiple API configurations per client for redundancy
- Primary/backup API key management

### Operational Flexibility
- Ship on behalf of different clients using their credentials
- Maintain separate sender information per API configuration
- Enable/disable API configurations without deletion

### Data Integrity
- Foreign key constraints ensure data consistency
- Unique constraints prevent multiple primary settings
- Cascade deletion maintains referential integrity

## Architecture Separation

### Existing vs New Tables
- **`client_nova_poshta_settings`**: Delivery preferences and addresses (PRESERVED)
- **`client_nova_poshta_api_settings`**: API credentials and sender info (NEW)

This separation allows:
- Independent management of delivery preferences vs API access
- Multiple API configurations with different sender details
- Secure credential storage separate from delivery information

## Security Considerations

### API Key Protection
- API keys stored securely in dedicated table
- Access controlled through client relationship
- Separate from delivery address information

### Access Control
- Client-specific API settings isolation
- Primary setting enforcement prevents conflicts
- Cascade deletion maintains security on client removal

## Future Enhancements

### Potential Improvements
- API key encryption at rest
- Usage tracking and rate limiting per API key
- API key validation and health checking
- Audit logging for API setting changes
- Integration with Nova Poshta API for sender validation

## Migration Status
- ✅ Database table created
- ✅ Schema definitions implemented
- ✅ Storage interfaces completed
- ✅ API routes operational
- ✅ Full CRUD functionality tested
- ✅ Primary setting management verified

The implementation is production-ready and provides a robust foundation for multi-client Nova Poshta shipping operations.
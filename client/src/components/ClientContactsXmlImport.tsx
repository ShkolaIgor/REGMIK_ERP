import React from 'react';
import { ImportWizard } from './ImportWizard';

export function ClientContactsXmlImport() {
  return (
    <ImportWizard 
      importType="client-contacts"
      onProceedToImport={() => {
        // Майстер імпорту вже показав інформацію, тепер можна переходити до імпорту
        console.log("Proceeding to client contacts import...");
      }}
    />
  );
}

export default ClientContactsXmlImport;
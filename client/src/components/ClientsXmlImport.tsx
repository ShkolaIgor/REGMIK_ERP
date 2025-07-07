import React from 'react';
import { ImportWizard } from './ImportWizard';

export function ClientsXmlImport() {
  return (
    <ImportWizard 
      importType="clients"
      onProceedToImport={() => {
        // Майстер імпорту вже показав інформацію, тепер можна переходити до імпорту
        console.log("Proceeding to clients import...");
      }}
    />
  );
}

export default ClientsXmlImport;
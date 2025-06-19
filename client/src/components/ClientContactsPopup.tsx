import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import type { ClientContact } from "@shared/schema";

interface ClientContactsPopupProps {
  clientId: number;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientContactsPopup({ clientId, clientName, isOpen, onClose }: ClientContactsPopupProps) {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/client-contacts/by-client", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client-contacts/by-client/${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client contacts');
      return response.json();
    },
    enabled: isOpen && !!clientId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Контактні особи - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Завантаження контактів...
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              У цього клієнта немає контактних осіб
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contacts.map((contact: ClientContact) => (
                <Card key={contact.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`text-lg ${contact.isPrimary ? 'font-bold' : 'font-semibold'}`}>
                          {contact.fullName}
                        </h3>
                        {contact.position && (
                          <p className="text-sm text-gray-600">{contact.position}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            Основний
                          </Badge>
                        )}
                        {contact.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Активний
                          </Badge>
                        )}
                        {contact.source && (
                          <Badge variant="outline" className="text-xs">
                            {contact.source}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a 
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}

                      {contact.primaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          {contact.primaryPhoneType === 'mobile' ? (
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                            </svg>
                          ) : contact.primaryPhoneType === 'office' ? (
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : contact.primaryPhoneType === 'fax' ? (
                            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10M7 4l-2 14h14l-2-14M7 4h10m-5 3v8m-2-4h4" />
                            </svg>
                          ) : (
                            <Phone className="h-4 w-4 text-gray-600" />
                          )}
                          <a 
                            href={`tel:${contact.primaryPhone}`}
                            className="text-green-600 hover:underline"
                          >
                            {contact.primaryPhone}
                          </a>
                        </div>
                      )}

                      {contact.secondaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          {contact.secondaryPhoneType === 'mobile' ? (
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                            </svg>
                          ) : contact.secondaryPhoneType === 'office' ? (
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : contact.secondaryPhoneType === 'fax' ? (
                            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10M7 4l-2 14h14l-2-14M7 4h10m-5 3v8m-2-4h4" />
                            </svg>
                          ) : (
                            <Phone className="h-4 w-4 text-gray-600" />
                          )}
                          <a 
                            href={`tel:${contact.secondaryPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.secondaryPhone}
                          </a>
                        </div>
                      )}

                      {contact.tertiaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          {contact.tertiaryPhoneType === 'mobile' ? (
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                            </svg>
                          ) : contact.tertiaryPhoneType === 'office' ? (
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : contact.tertiaryPhoneType === 'fax' ? (
                            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10M7 4l-2 14h14l-2-14M7 4h10m-5 3v8m-2-4h4" />
                            </svg>
                          ) : (
                            <Phone className="h-4 w-4 text-gray-600" />
                          )}
                          <a 
                            href={`tel:${contact.tertiaryPhone}`}
                            className="text-orange-600 hover:underline"
                          >
                            {contact.tertiaryPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {contact.notes && (
                      <div className="text-sm">
                        <strong className="text-gray-700">Примітки:</strong>
                        <p className="text-gray-600 mt-1">{contact.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Створено: {new Date(contact.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                      {contact.externalId && (
                        <span className="ml-auto">
                          ID: {contact.externalId}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
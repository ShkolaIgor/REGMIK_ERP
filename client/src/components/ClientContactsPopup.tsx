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
                        <h3 className="font-semibold text-lg">{contact.fullName}</h3>
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
                          <Phone className="h-4 w-4 text-green-600" />
                          <a 
                            href={`tel:${contact.primaryPhone}`}
                            className="text-green-600 hover:underline"
                          >
                            {contact.primaryPhone}
                          </a>
                          <span className="text-xs text-gray-500">
                            ({contact.primaryPhoneType})
                          </span>
                        </div>
                      )}

                      {contact.secondaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <a 
                            href={`tel:${contact.secondaryPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.secondaryPhone}
                          </a>
                          <span className="text-xs text-gray-500">
                            ({contact.secondaryPhoneType})
                          </span>
                        </div>
                      )}

                      {contact.tertiaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-orange-600" />
                          <a 
                            href={`tel:${contact.tertiaryPhone}`}
                            className="text-orange-600 hover:underline"
                          >
                            {contact.tertiaryPhone}
                          </a>
                          <span className="text-xs text-gray-500">
                            ({contact.tertiaryPhoneType})
                          </span>
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
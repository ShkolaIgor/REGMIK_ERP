import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';
import { Client } from '@shared/schema';

interface ClientAutocompleteProps {
  selectedClients: Set<number>;
  onClientToggle: (clientId: number, checked: boolean) => void;
  placeholder?: string;
  className?: string;
}

export function ClientAutocomplete({ 
  selectedClients, 
  onClientToggle, 
  placeholder = "Пошук клієнтів...",
  className = ""
}: ClientAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["/api/clients/all"],
    enabled: true
  });
  
  const clients: Client[] = Array.isArray(clientsData?.clients) ? clientsData.clients : [];
  
  // Фільтруємо клієнтів за пошуковим терміном
  const filteredClients = clients.filter((client: Client) => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.taxCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Обмежуємо до 10 результатів

  // Закриваємо dropdown при кліку поза ним
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleClientToggle = (client: Client, checked: boolean) => {
    onClientToggle(client.id, checked);
    if (checked) {
      // Очищуємо пошук після додавання клієнта
      setSearchTerm('');
    }
  };



  return (
    <div className={`space-y-4 ${className}`}>
      {/* Поле пошуку */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dropdown з результатами пошуку */}
        {isDropdownOpen && (
          <Card 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto border shadow-lg bg-white"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Завантаження...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm.length === 0 ? 'Почніть вводити назву клієнта' : 'Клієнтів не знайдено'}
              </div>
            ) : (
              <div className="p-2">
                {filteredClients.map(client => (
                  <div 
                    key={client.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleClientToggle(client, !selectedClients.has(client.id))}
                  >
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onChange={() => {}} // Контролюється через onClick
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {client.name}
                      </div>
                      {client.taxCode && (
                        <div className="text-xs text-gray-500">
                          ЄДРПОУ: {client.taxCode}
                        </div>
                      )}
                      {client.fullName && client.fullName !== client.name && (
                        <div className="text-xs text-gray-500 truncate">
                          {client.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>


    </div>
  );
}
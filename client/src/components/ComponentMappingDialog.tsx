import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Link, Check } from "lucide-react";

interface Component {
  id: number;
  name: string;
  sku: string;
}

interface ComponentMapping {
  supplierName: string;
  internalComponent: Component;
}

interface ComponentMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: Component[];
  onMapComponent: (mapping: ComponentMapping) => void;
  supplierComponentNames: string[];
}

export function ComponentMappingDialog({
  open,
  onOpenChange,
  components,
  onMapComponent,
  supplierComponentNames
}: ComponentMappingDialogProps) {
  const [supplierName, setSupplierName] = useState('');
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMap = () => {
    if (supplierName && selectedComponentId) {
      const component = components.find(c => c.id.toString() === selectedComponentId);
      if (component) {
        onMapComponent({
          supplierName,
          internalComponent: component
        });
        setSupplierName('');
        setSelectedComponentId('');
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Співставлення компонентів
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Назва компонента у постачальника</Label>
            <Select value={supplierName} onValueChange={setSupplierName}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть або введіть назву постачальника" />
              </SelectTrigger>
              <SelectContent>
                {supplierComponentNames.map((name, index) => (
                  <SelectItem key={index} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="mt-2"
              placeholder="Або введіть нову назву"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>

          <div>
            <Label>Пошук внутрішнього компонента</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Пошук за назвою або артикулом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Внутрішній компонент</Label>
            <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть внутрішній компонент" />
              </SelectTrigger>
              <SelectContent>
                {filteredComponents.map((component) => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{component.name}</span>
                      <Badge variant="secondary">{component.sku}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supplierName && selectedComponentId && (
            <div className="p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Співставлення:</span>
              </div>
              <div className="mt-1 text-sm">
                "{supplierName}" → {components.find(c => c.id.toString() === selectedComponentId)?.name}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>
            <Button onClick={handleMap} disabled={!supplierName || !selectedComponentId}>
              Зберегти співставлення
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
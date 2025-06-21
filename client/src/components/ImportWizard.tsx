import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Info, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ImportWizardProps {
  importType: 'orders' | 'order-items' | 'clients' | 'client-contacts' | 'component-categories' | 'components';
  onProceedToImport: () => void;
}

interface ImportRequirements {
  requiredFields: string[];
  optionalFields: string[];
  dependencies: string[];
  sampleData: Record<string, string>;
  validationRules: string[];
  commonIssues: string[];
}

const IMPORT_CONFIGS: Record<string, ImportRequirements> = {
  'orders': {
    requiredFields: ['PREDPR', 'NAME_PREDPR', 'DATA_ZAKAZ'],
    optionalFields: ['SUMMA', 'DATA_VIDPRAV', 'NAME_TRANSPORT', 'PRIMECH'],
    dependencies: ['Клієнти повинні існувати в системі'],
    sampleData: {
      'PREDPR': 'Назва компанії клієнта',
      'NAME_PREDPR': 'Код клієнта',
      'DATA_ZAKAZ': 'Дата замовлення (YYYY-MM-DD)',
      'SUMMA': 'Сума замовлення',
    },
    validationRules: [
      'PREDPR не може бути пустим',
      'DATA_ZAKAZ повинна бути в правильному форматі',
      'SUMMA повинна бути числом'
    ],
    commonIssues: [
      'Клієнт не знайдений - спочатку імпортуйте клієнтів',
      'Невірний формат дати',
      'Дублікат замовлення'
    ]
  },
  'order-items': {
    requiredFields: ['INDEX_LISTARTICLE', 'NAME_ZAKAZ', 'COUNT_DET'],
    optionalFields: ['CENA', 'PRICE_NET', 'SERIAL_NUMBER', 'COMMENT'],
    dependencies: ['Замовлення повинні існувати', 'Товари повинні існувати'],
    sampleData: {
      'INDEX_LISTARTICLE': 'SKU товару',
      'NAME_ZAKAZ': 'Номер замовлення',
      'COUNT_DET': 'Кількість',
      'CENA': 'Ціна за одиницю',
      'SERIAL_NUMBER': 'Серійні номери через кому або діапазон'
    },
    validationRules: [
      'INDEX_LISTARTICLE повинен відповідати існуючому SKU',
      'NAME_ZAKAZ повинен відповідати існуючому замовленню',
      'COUNT_DET повинна бути позитивним числом'
    ],
    commonIssues: [
      'Товар з SKU не знайдений',
      'Замовлення не знайдене',
      'Невірний формат серійних номерів'
    ]
  },
  'clients': {
    requiredFields: ['PREDPR'],
    optionalFields: ['NAME_PREDPR', 'ADRES', 'NAME_TRANSPORT', 'TELEFON', 'EMAIL'],
    dependencies: [],
    sampleData: {
      'PREDPR': 'Назва компанії',
      'NAME_PREDPR': 'Код компанії',
      'ADRES': 'Адреса',
      'TELEFON': 'Телефон'
    },
    validationRules: [
      'PREDPR не може бути пустим',
      'EMAIL повинен бути валідним (якщо вказано)'
    ],
    commonIssues: [
      'Дублікат назви клієнта',
      'Невірний формат email'
    ]
  },
  'client-contacts': {
    requiredFields: ['FIO', 'ID_TELEPHON', 'INDEX_PREDPR'],
    optionalFields: ['TELEPHON', 'EMAIL', 'DOLGNOST'],
    dependencies: ['Клієнти повинні існувати'],
    sampleData: {
      'FIO': "Ім'я контакту",
      'ID_TELEPHON': 'Унікальний ID контакту',
      'INDEX_PREDPR': 'Код клієнта',
      'TELEPHON': 'Телефон',
      'EMAIL': 'Email'
    },
    validationRules: [
      'FIO не може бути пустим',
      'INDEX_PREDPR повинен відповідати існуючому клієнту'
    ],
    commonIssues: [
      'Клієнт не знайдений',
      'Дублікат ID контакту'
    ]
  },
  'component-categories': {
    requiredFields: ['ID_GROUP', 'GROUP_NAME'],
    optionalFields: [],
    dependencies: [],
    sampleData: {
      'ID_GROUP': 'Унікальний ID категорії',
      'GROUP_NAME': 'Назва категорії компонентів'
    },
    validationRules: [
      'ID_GROUP не може бути пустим',
      'GROUP_NAME не може бути пустим',
      'ID_GROUP повинен бути числом'
    ],
    commonIssues: [
      'Дублікат ID категорії',
      'Пуста назва категорії'
    ]
  },
  'components': {
    requiredFields: ['ID_DETAIL', 'DETAIL'],
    optionalFields: ['INDEX_GROUP', 'COMMENT', 'ACTUAL', 'CODE_CUST'],
    dependencies: ['Категорії компонентів повинні існувати (якщо вказано INDEX_GROUP)'],
    sampleData: {
      'ID_DETAIL': 'SKU компонента',
      'DETAIL': 'Назва компонента',
      'INDEX_GROUP': 'ID категорії компонента',
      'COMMENT': 'Примітки',
      'ACTUAL': 'Активність (T/F)',
      'CODE_CUST': 'Код УКТЗЕД'
    },
    validationRules: [
      'ID_DETAIL не може бути пустим',
      'DETAIL не може бути пустим',
      'INDEX_GROUP повинен бути числом (якщо вказано)',
      'ACTUAL повинен бути T, F, True, False, 1 або 0'
    ],
    commonIssues: [
      'Дублікат SKU компонента',
      'Категорія не знайдена',
      'Невірний формат поля ACTUAL'
    ]
  }
};

const getImportTitle = (type: string) => {
  switch (type) {
    case 'orders': return 'Імпорт замовлень';
    case 'order-items': return 'Імпорт товарів замовлень';
    case 'clients': return 'Імпорт клієнтів';
    case 'client-contacts': return 'Імпорт контактів клієнтів';
    case 'component-categories': return 'Імпорт категорій компонентів';
    case 'components': return 'Імпорт компонентів';
    default: return 'Імпорт даних';
  }
};

export function ImportWizard({ importType, onProceedToImport }: ImportWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});

  const config = IMPORT_CONFIGS[importType];
  
  // Fetch data counts for validation
  const { data: stats } = useQuery({
    queryKey: [`/api/import-stats/${importType}`],
    enabled: isOpen,
    retry: false,
  });

  const steps = [
    {
      title: 'Підготовка файлу',
      description: 'Перевірка формату та обов\'язкових полів'
    },
    {
      title: 'Перевірка залежностей',
      description: 'Валідація зв\'язаних даних'
    },
    {
      title: 'Підтвердження',
      description: 'Готовність до імпорту'
    }
  ];

  const StepFilePreparation = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Обов'язкові поля</h3>
        <div className="grid grid-cols-2 gap-2">
          {config.requiredFields.map(field => (
            <Badge key={field} variant="destructive" className="justify-start">
              {field}
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Додаткові поля</h3>
        <div className="grid grid-cols-2 gap-2">
          {config.optionalFields.map(field => (
            <Badge key={field} variant="secondary" className="justify-start">
              {field}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Приклад даних</h3>
        <div className="bg-gray-50 p-3 rounded text-sm">
          <code>
            {Object.entries(config.sampleData).map(([field, description]) => (
              <div key={field}>{field}: {description}</div>
            ))}
          </code>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Правила валідації</h3>
        <ul className="text-sm space-y-1">
          {config.validationRules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const StepDependencyCheck = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Залежності</h3>
        {config.dependencies.length > 0 ? (
          <ul className="space-y-2">
            {config.dependencies.map((dep, index) => (
              <li key={index} className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                {dep}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Немає залежностей
          </p>
        )}
      </div>

      {stats && (
        <div>
          <h3 className="font-medium mb-2">Статистика системи</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                <div className="text-lg font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2">Типові проблеми</h3>
        <ul className="text-sm space-y-1">
          {config.commonIssues.map((issue, index) => (
            <li key={index} className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const StepConfirmation = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-800">Готово до імпорту</h3>
        </div>
        <p className="text-green-700 text-sm">
          Ваш файл підготовлено згідно з вимогами. Ви можете розпочати імпорт.
        </p>
      </div>

      <div>
        <h3 className="font-medium mb-2">Що відбудеться далі:</h3>
        <ol className="text-sm space-y-1 ml-4">
          <li>1. Файл буде проаналізовано</li>
          <li>2. Дані будуть валідовані</li>
          <li>3. Ви побачите звіт про імпорт</li>
          <li>4. При необхідності можна буде виправити помилки</li>
        </ol>
      </div>
    </div>
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProceed = () => {
    setIsOpen(false);
    onProceedToImport();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <StepFilePreparation />;
      case 1: return <StepDependencyCheck />;
      case 2: return <StepConfirmation />;
      default: return null;
    }
  };

  const getImportTypeLabel = () => {
    switch (importType) {
      case 'orders': return 'замовлень';
      case 'order-items': return 'позицій замовлень';
      case 'clients': return 'клієнтів';
      case 'client-contacts': return 'контактів клієнтів';
      default: return importType;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Майстер імпорту
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Майстер імпорту {getImportTypeLabel()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Крок {currentStep + 1} з {steps.length}
              </span>
              <span className="text-sm font-medium">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {steps.map((step, index) => (
                <span 
                  key={index}
                  className={index <= currentStep ? 'text-blue-600 font-medium' : ''}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Далі
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleProceed} className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Розпочати імпорт
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
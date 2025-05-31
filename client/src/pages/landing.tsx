import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  Warehouse, 
  Settings,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <Package className="h-8 w-8 text-blue-600" />,
      title: "Управління товарами",
      description: "Повний контроль над асортиментом, ціноутворенням та характеристиками продукції"
    },
    {
      icon: <Warehouse className="h-8 w-8 text-green-600" />,
      title: "Складський облік",
      description: "Відстеження залишків, переміщення між складами та інвентаризація"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: "Планування виробництва",
      description: "Техкарти, прогнозування, розрахунок потреб у матеріалах"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      title: "Аналітика та звіти",
      description: "Детальні звіти, графіки продажів та аналіз ефективності"
    },
    {
      icon: <Users className="h-8 w-8 text-red-600" />,
      title: "Управління персоналом",
      description: "Облік працівників, посад та відділів організації"
    },
    {
      icon: <Settings className="h-8 w-8 text-gray-600" />,
      title: "Налаштування системи",
      description: "Гнучкі налаштування під специфіку вашого бізнесу"
    }
  ];

  const benefits = [
    "Автоматизація складських операцій",
    "Контроль собівартості продукції",
    "Планування виробничих потужностей",
    "Оптимізація запасів",
    "Інтеграція з Bitrix24",
    "Багатомовна підтримка"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">REGMIK: ERP</h1>
                <p className="text-sm text-gray-500">Система управління виробництвом</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Увійти в систему
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Професійна система
            <span className="text-blue-600 block">управління виробництвом</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Повний контроль над товарним обліком та виробничими процесами. 
            Автоматизуйте планування, оптимізуйте витрати та підвищуйте ефективність бізнесу.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Розпочати роботу
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              Дізнатися більше
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Функціональні можливості
            </h2>
            <p className="text-xl text-gray-600">
              Всі інструменти для ефективного управління виробництвом в одній системі
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Переваги використання REGMIK: ERP
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Наша система допоможе вам оптимізувати виробничі процеси, 
                знизити витрати та підвищити прибутковість бізнесу.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Готові до старту?
                </h3>
                <p className="text-gray-600 mb-6">
                  Увійдіть в систему та почніть керувати своїм виробництвом професійно
                </p>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Увійти в REGMIK: ERP
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">REGMIK: ERP</span>
            </div>
            <p className="text-gray-400 mb-4">
              Професійна система управління виробництвом та товарним обліком
            </p>
            <p className="text-sm text-gray-500">
              © 2025 REGMIK: ERP. Усі права захищені.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
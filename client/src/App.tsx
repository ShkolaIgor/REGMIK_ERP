import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Production from "@/pages/production";
import Orders from "@/pages/orders";
import Recipes from "@/pages/recipes";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/production" component={Production} />
        <Route path="/orders" component={Orders} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/reports" component={Reports} />
        <Route path="/warehouses" component={() => <div className="p-6">Склади - В розробці</div>} />
        <Route path="/scanner" component={() => <div className="p-6">Сканер штрих-кодів - В розробці</div>} />
        <Route path="/costing" component={() => <div className="p-6">Калькуляція собівартості - В розробці</div>} />
        <Route path="/shortage" component={() => <div className="p-6">Дефіцит матеріалів - В розробці</div>} />
        <Route path="/documents" component={() => <div className="p-6">Документи - В розробці</div>} />
        <Route path="/suppliers" component={() => <div className="p-6">Постачальники - В розробці</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

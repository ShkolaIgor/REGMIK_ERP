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
import TechCards from "@/pages/tech-cards";
import BOM from "@/pages/bom";
import Categories from "@/pages/categories";
import Warehouses from "@/pages/warehouses";
import Reports from "@/pages/reports";
import AdvancedReports from "@/pages/advanced-reports";
import CostCalculations from "@/pages/cost-calculations";
import MaterialShortages from "@/pages/material-shortages";
import SupplierOrders from "@/pages/supplier-orders";
import Suppliers from "@/pages/suppliers";
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
        <Route path="/tech-cards" component={TechCards} />
        <Route path="/bom" component={BOM} />
        <Route path="/categories" component={Categories} />
        <Route path="/warehouses" component={Warehouses} />
        <Route path="/reports" component={Reports} />
        <Route path="/advanced-reports" component={AdvancedReports} />
        <Route path="/scanner" component={() => <div className="p-6">Сканер штрих-кодів - В розробці</div>} />
        <Route path="/costing" component={CostCalculations} />
        <Route path="/shortage" component={MaterialShortages} />
        <Route path="/supplier-orders" component={SupplierOrders} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/documents" component={() => <div className="p-6">Документи - В розробці</div>} />
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

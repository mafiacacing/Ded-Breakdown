import { Switch, Route, useLocation } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import Search from "@/pages/Search";
import Analysis from "@/pages/Analysis";
import Ocr from "@/pages/Ocr";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";

function App() {
  const [location] = useLocation();

  return (
    <AppLayout currentPath={location}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/documents" component={Documents} />
        <Route path="/search" component={Search} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/ocr" component={Ocr} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default App;

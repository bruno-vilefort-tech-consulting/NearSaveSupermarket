import React, { useEffect } from "react";
import { Router, Route, Switch, Link } from "wouter";

// Import existing admin pages from the main client
import AdminLogin from "../../../client/src/pages/admin/login";
import AdminDashboard from "../../../client/src/pages/admin/dashboard";
import AdminSupermarkets from "../../../client/src/pages/admin/supermarkets";
import AdminFinancialStatement from "../../../client/src/pages/admin/financial-statement";
import AdminSupermarketPayments from "../../../client/src/pages/admin/supermarket-payments";

function AdminApp() {
  useEffect(() => {
    // Force Portuguese language context
    console.log('🔧 FORÇANDO IDIOMA PORTUGUÊS NO CONTEXTO ADMIN');
  }, []);

  return (
    <Router base="/admin">
      <Switch>
        <Route path="/" component={AdminLogin} />
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/supermarkets" component={AdminSupermarkets} />
        <Route path="/financial-statement" component={AdminFinancialStatement} />
        <Route path="/supermarket-payments" component={AdminSupermarketPayments} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
              <Link href="/admin" className="text-blue-600 hover:underline">
                Voltar ao login
              </Link>
            </div>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

export default AdminApp;
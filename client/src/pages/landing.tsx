import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="text-white text-2xl" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">FreshSaver</h1>
              <p className="text-gray-600">Portal de Login da Equipe</p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Entre com sua conta Replit para acessar o painel da equipe
                </p>
              </div>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all"
                size="lg"
              >
                Entrar com Replit
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Autenticação segura fornecida pelo Replit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

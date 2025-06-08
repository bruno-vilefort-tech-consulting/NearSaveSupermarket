import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import supermarketImage from "@assets/20250608_0847_Sacolas e Supermercado_remix_01jx7nrwxjfvnvt8tz1f6ermp9_1749383605674.png";

function StaffLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-green/5 to-eco-orange/5 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-center">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-eco-green" />
          <span className="text-xl font-bold">SaveUp</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto">
        {/* Logo/Image */}
        <div className="mb-8">
          <img 
            src={supermarketImage} 
            alt="SaveUp Supermercado" 
            className="w-60 h-60 object-contain"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            SaveUp Supermercados
          </h1>
          <p className="text-gray-600">
            Transforme desperdício em receita
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <Button 
            size="lg"
            className="w-full bg-eco-green hover:bg-eco-green/90 text-white py-4 text-lg"
            onClick={() => setLocation("/staff/register")}
          >
            Cadastrar Supermercado
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="w-full border-eco-green text-eco-green hover:bg-eco-green hover:text-white py-4 text-lg"
            onClick={() => setLocation("/staff/login")}
          >
            Já tenho conta
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-gray-500">
          Plataforma sustentável para supermercados
        </p>
      </footer>
    </div>
  );
}

export default StaffLanding;
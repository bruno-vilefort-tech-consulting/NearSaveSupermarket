import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import shoppingBagsImage from "@assets/20250608_0832_Fundo Transparente_remix_01jx7mygx5e83sfwrt5bjztmnn_1749384214861.png";

function StaffLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-xs w-full text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-eco-green">
            SaveUp
          </h1>
          <p className="text-2xl font-bold text-gray-800">
            Supermercados
          </p>
        </div>

        {/* Shopping Bags Image */}
        <div className="flex justify-center py-4">
          <img 
            src={shoppingBagsImage} 
            alt="Sacolas coloridas de compras" 
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            size="lg"
            className="w-full bg-eco-green hover:bg-eco-green/90 text-white py-4 text-lg font-medium"
            onClick={() => setLocation("/staff/register")}
          >
            Cadastre-se
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="w-full border-eco-green text-eco-green hover:bg-eco-green hover:text-white py-4 text-lg"
            onClick={() => setLocation("/staff/login")}
          >
            Entrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StaffLanding;
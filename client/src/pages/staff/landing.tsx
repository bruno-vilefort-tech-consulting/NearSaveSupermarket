import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

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
          <p className="text-gray-600 text-sm">
            Supermercados
          </p>
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
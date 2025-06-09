import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import deliveryImage from "@assets/20250608_2055_Entregador em Lambreta_remix_01jx8ze4m4f5a9s66kt9rnn9eb_1749427224219.png";

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

        {/* Delivery Image */}
        <div className="flex justify-center py-4">
          <img 
            src={deliveryImage} 
            alt="Entregador em lambreta" 
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            size="lg"
            className="w-full bg-gradient-to-r from-eco-green to-eco-green-dark hover:from-eco-green-dark hover:to-eco-green text-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
            onClick={() => setLocation("/staff/login")}
          >
            Entrar
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="w-full border-2 border-eco-green text-eco-green hover:bg-eco-green hover:text-white py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
            onClick={() => setLocation("/staff/register")}
          >
            Cadastre-se
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StaffLanding;
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users, Leaf } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/staff-login";
  };

  // SVG de compras sustentáveis
  const SustainableShoppingSVG = () => (
    <svg viewBox="0 0 400 300" className="w-full max-w-sm mx-auto">
      {/* Fundo */}
      <rect width="400" height="300" fill="url(#bgGradient)" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      {/* Terra/Base */}
      <ellipse cx="200" cy="280" rx="180" ry="15" fill="#16a34a" opacity="0.3" />
      
      {/* Árvore grande */}
      <rect x="320" y="180" width="12" height="80" fill="#92400e" />
      <circle cx="326" cy="180" r="35" fill="url(#leafGradient)" />
      <circle cx="340" cy="165" r="25" fill="url(#leafGradient)" opacity="0.8" />
      <circle cx="312" cy="165" r="25" fill="url(#leafGradient)" opacity="0.8" />
      
      {/* Carrinho de compras */}
      <rect x="150" y="200" width="60" height="40" rx="5" fill="url(#cartGradient)" />
      <rect x="155" y="190" width="50" height="15" rx="3" fill="url(#cartGradient)" opacity="0.7" />
      <circle cx="165" cy="250" r="8" fill="#374151" />
      <circle cx="195" cy="250" r="8" fill="#374151" />
      <rect x="145" y="185" width="8" height="25" fill="url(#cartGradient)" />
      
      {/* Produtos no carrinho */}
      <rect x="160" y="195" width="12" height="15" rx="2" fill="#fbbf24" />
      <rect x="175" y="195" width="12" height="15" rx="2" fill="#ef4444" />
      <rect x="190" y="195" width="12" height="15" rx="2" fill="#10b981" />
      
      {/* Folhas flutuando */}
      <path d="M80 100 Q85 95 90 100 Q85 105 80 100" fill="#10b981" opacity="0.6" />
      <path d="M120 80 Q125 75 130 80 Q125 85 120 80" fill="#059669" opacity="0.7" />
      <path d="M280 120 Q285 115 290 120 Q285 125 280 120" fill="#10b981" opacity="0.5" />
      
      {/* Plantas pequenas */}
      <circle cx="100" cy="240" r="15" fill="url(#leafGradient)" opacity="0.6" />
      <rect x="98" y="240" width="4" height="20" fill="#92400e" />
      
      <circle cx="260" cy="230" r="12" fill="url(#leafGradient)" opacity="0.7" />
      <rect x="258" y="230" width="4" height="18" fill="#92400e" />
      
      {/* Sol */}
      <circle cx="350" cy="50" r="25" fill="#fbbf24" opacity="0.8" />
      <path d="M350 20 L350 10" stroke="#fbbf24" strokeWidth="2" />
      <path d="M375 35 L383 28" stroke="#fbbf24" strokeWidth="2" />
      <path d="M375 65 L383 72" stroke="#fbbf24" strokeWidth="2" />
      <path d="M325 35 L317 28" stroke="#fbbf24" strokeWidth="2" />
      
      {/* Símbolo de reciclagem */}
      <g transform="translate(50, 150)">
        <path d="M0 0 Q-10 -10 0 -20 Q10 -10 0 0" fill="#10b981" />
        <path d="M15 10 Q25 0 15 -10 Q5 0 15 10" fill="#10b981" />
        <path d="M-15 10 Q-25 0 -15 -10 Q-5 0 -15 10" fill="#10b981" />
      </g>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo Principal */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <Leaf className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
            EcoMart
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            By Up Brasil
          </p>
        </div>

        {/* Imagem Sustentável */}
        <div className="my-8">
          <SustainableShoppingSVG />
        </div>

        {/* Botões de Login */}
        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <Users className="h-6 w-6" />
              <div>
                <div className="font-bold text-lg">Staff do Supermercado</div>
                <div className="text-sm opacity-90">Gerenciar produtos e pedidos</div>
              </div>
            </div>
          </Button>

          <Button 
            onClick={() => window.location.href = '/customer/login'}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <div>
                <div className="font-bold text-lg">Cliente</div>
                <div className="text-sm opacity-90">Comprar com desconto sustentável</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2 pt-6">
          <p className="font-medium">Supermercado Sustentável do Futuro</p>
          <div className="flex items-center justify-center space-x-1 text-xs">
            <Leaf className="h-3 w-3 text-green-500" />
            <span>Zero Desperdício • Recompensas Eco • 100% Sustentável</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

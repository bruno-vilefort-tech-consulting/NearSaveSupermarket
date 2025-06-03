import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Leaf, Award, Clock, Globe, ChevronDown, Star } from "lucide-react";

export default function Landing() {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const handleLanguageSelect = (lang: string) => {
    setIsLanguageMenuOpen(false);
  };

  // Fechar menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      setIsLanguageMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // SVG de compras sustentáveis
  const SustainableShoppingSVG = () => (
    <svg viewBox="0 0 400 300" className="w-full max-w-sm mx-auto">
      {/* Fundo */}
      <rect width="400" height="300" fill="url(#bgGradient)" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Supermercado */}
      <rect x="50" y="150" width="120" height="80" fill="#3b82f6" rx="8" />
      <rect x="60" y="160" width="20" height="30" fill="#1e40af" />
      <rect x="90" y="160" width="20" height="30" fill="#1e40af" />
      <rect x="120" y="160" width="20" height="30" fill="#1e40af" />
      <text x="110" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
        SUPERMERCADO
      </text>

      {/* Pessoa com sacola */}
      <circle cx="250" cy="180" r="15" fill="#fbbf24" />
      <rect x="245" y="195" width="10" height="25" fill="#3b82f6" />
      <rect x="240" y="220" width="7" height="15" fill="#1f2937" />
      <rect x="253" y="220" width="7" height="15" fill="#1f2937" />
      
      {/* Sacola ecológica */}
      <path d="M270 190 L290 190 L290 220 L270 220 Z" fill="url(#leafGradient)" />
      <path d="M275 185 Q280 180 285 185" stroke="url(#leafGradient)" strokeWidth="2" fill="none" />

      {/* Folhas flutuantes */}
      <g transform="translate(320,80) rotate(15)">
        <path d="M0 0 Q10 -5 20 0 Q15 10 0 15 Q-5 7 0 0" fill="url(#leafGradient)" />
      </g>
      <g transform="translate(30,60) rotate(-20)">
        <path d="M0 0 Q8 -3 16 0 Q12 8 0 12 Q-3 6 0 0" fill="url(#leafGradient)" />
      </g>

      {/* Pontos de sustentabilidade */}
      <circle cx="350" cy="50" r="4" fill="#10b981" />
      <circle cx="40" cy="40" r="3" fill="#10b981" />
      <circle cx="360" cy="150" r="3" fill="#10b981" />

      {/* Seta conectando supermercado à pessoa */}
      <path d="M170 190 Q200 180 240 190" stroke="#10b981" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
        </marker>
      </defs>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="relative px-4 py-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="h-10 px-3 bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white/90 flex items-center gap-2"
            >
              <Globe className="h-4 w-4 text-green-600" />
              <ChevronDown className={`h-3 w-3 text-green-600 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isLanguageMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={() => handleLanguageSelect('pt')}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                >
                  🇧🇷 Português
                </button>
                <button
                  onClick={() => handleLanguageSelect('en')}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                >
                  🇺🇸 English
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Compras Sustentáveis<br />
              <span className="text-green-600">Recompensas Reais</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubra supermercados próximos, compre produtos sustentáveis e ganhe pontos eco por cada compra consciente
            </p>
            
            {/* Ilustração SVG */}
            <div className="mb-8">
              <SustainableShoppingSVG />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/customer'}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Encontrar Supermercados
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/staff-login'}
              >
                Sou Supermercado
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Encontre Próximo de Você</h3>
                <p className="text-gray-600">
                  Localize supermercados sustentáveis em um raio de 20km da sua localização com produtos eco-friendly
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Produtos Sustentáveis</h3>
                <p className="text-gray-600">
                  Compre produtos próximos ao vencimento com desconto e contribua para redução do desperdício
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Pontos Eco</h3>
                <p className="text-gray-600">
                  Ganhe pontos a cada compra sustentável e acompanhe seu impacto positivo no meio ambiente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Como Funciona */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Como Funciona</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold">Encontre</h3>
                <p className="text-gray-600 text-sm">Localize supermercados sustentáveis próximos</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold">Escolha</h3>
                <p className="text-gray-600 text-sm">Selecione produtos eco-friendly com desconto</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold">Pague</h3>
                <p className="text-gray-600 text-sm">Finalize com PIX de forma rápida e segura</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold">Ganhe</h3>
                <p className="text-gray-600 text-sm">Acumule pontos eco e faça a diferença</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">O Que Nossos Usuários Dizem</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "Consegui economizar muito comprando produtos próximos ao vencimento. Além disso, me sinto bem sabendo que estou ajudando o meio ambiente!"
                </p>
                <div className="font-semibold text-gray-900">- Maria Silva, São Paulo</div>
              </div>
              <div className="space-y-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "O app é muito fácil de usar e os pontos eco me motivam a fazer compras mais conscientes. Recomendo!"
                </p>
                <div className="font-semibold text-gray-900">- João Santos, Rio de Janeiro</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center space-y-4">
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              <a href="/terms" className="hover:text-green-600">Termos de Uso</a>
              <a href="/privacy-policy" className="hover:text-green-600">Política de Privacidade</a>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 EcoMarket. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
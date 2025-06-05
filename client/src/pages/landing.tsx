import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Users, Leaf, Globe, ChevronDown, Recycle, Heart, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";

export default function Landing() {
  const { t, setLanguage } = useLanguage();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  const handleLogin = () => {
    window.location.href = "/staff-login";
  };

  // Fechar menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const ModernHeroSection = () => (
    <div className="relative text-center space-y-8">
      {/* Logo e Título Principal */}
      <div className="space-y-6">

        
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-eco-gray-dark tracking-tight">
            {t('landing.title')}
          </h1>
          <div className="flex justify-center">
            <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
          </div>
        </div>
      </div>

      {/* Ilustração do Carrinho */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-[40rem] h-auto">
          {/* Definições de gradientes */}
          <defs>
            <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(210 65% 40%)" />
              <stop offset="100%" stopColor="hsl(210 70% 30%)" />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 95% 55%)" />
              <stop offset="100%" stopColor="hsl(25 95% 45%)" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 60% 30%)" />
              <stop offset="100%" stopColor="hsl(160 65% 25%)" />
            </linearGradient>
          </defs>

          {/* Carrinho principal */}
          <rect x="80" y="100" width="80" height="50" rx="8" fill="url(#cartGradient)" />
          <rect x="85" y="85" width="70" height="20" rx="5" fill="url(#cartGradient)" opacity="0.8" />
          
          {/* Alça do carrinho */}
          <rect x="70" y="90" width="15" height="35" rx="3" fill="url(#cartGradient)" />
          
          {/* Rodas */}
          <circle cx="95" cy="165" r="12" fill="hsl(0 0% 30%)" />
          <circle cx="95" cy="165" r="8" fill="hsl(0 0% 20%)" />
          <circle cx="145" cy="165" r="12" fill="hsl(0 0% 30%)" />
          <circle cx="145" cy="165" r="8" fill="hsl(0 0% 20%)" />
          
          {/* Produtos no carrinho */}
          <rect x="90" y="90" width="15" height="20" rx="3" fill="url(#orangeGradient)" />
          <rect x="110" y="95" width="15" height="15" rx="3" fill="url(#greenGradient)" />
          <rect x="130" y="88" width="15" height="22" rx="3" fill="url(#cartGradient)" />
          
          {/* Folhas decorativas */}
          <path d="M200 60 Q205 55 210 60 Q205 65 200 60" fill="url(#greenGradient)" opacity="0.7" />
          <path d="M220 80 Q225 75 230 80 Q225 85 220 80" fill="url(#greenGradient)" opacity="0.6" />
          <path d="M40 70 Q45 65 50 70 Q45 75 40 70" fill="url(#greenGradient)" opacity="0.5" />
          
          {/* Símbolo de reciclagem */}
          <g transform="translate(200, 120)">
            <path d="M0 0 Q-8 -8 0 -16 Q8 -8 0 0" fill="url(#greenGradient)" opacity="0.8" />
            <path d="M12 8 Q20 0 12 -8 Q4 0 12 8" fill="url(#greenGradient)" opacity="0.8" />
            <path d="M-12 8 Q-20 0 -12 -8 Q-4 0 -12 8" fill="url(#greenGradient)" opacity="0.8" />
          </g>
          
          {/* Corações flutuantes */}
          <path d="M50 40 Q45 35 40 40 Q45 45 50 40 Q55 35 60 40 Q55 45 50 40" fill="url(#orangeGradient)" opacity="0.6" />
          <path d="M240 50 Q235 45 230 50 Q235 55 240 50 Q245 45 250 50 Q245 55 240 50" fill="url(#orangeGradient)" opacity="0.5" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-end items-center p-6">
        
        {/* Language Selector */}
        <div className="relative" ref={languageMenuRef}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            className="h-10 px-3 text-eco-gray hover:text-eco-orange hover:bg-eco-gray-light/20 flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <ChevronDown className={`h-3 w-3 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isLanguageMenuOpen && (
            <div className="absolute right-0 top-12 bg-white border border-eco-gray-light rounded-xl shadow-lg py-2 min-w-32 z-10">
              <button
                onClick={() => {
                  setLanguage('pt-BR');
                  setIsLanguageMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-eco-gray-light/20 flex items-center gap-3 text-eco-gray-dark transition-colors"
              >
                <span className="text-lg">🇧🇷</span>
                <span className="font-medium">Português</span>
              </button>
              <button
                onClick={() => {
                  setLanguage('en-US');
                  setIsLanguageMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-eco-gray-light/20 flex items-center gap-3 text-eco-gray-dark transition-colors"
              >
                <span className="text-lg">🇺🇸</span>
                <span className="font-medium">English</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-lg">
          <ModernHeroSection />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8">
        <div className="w-full max-w-lg mx-auto space-y-4">
          <Button 
            onClick={() => window.location.href = '/customer/login'}
            className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-lg"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <span>{t('landing.customerButton')}</span>
            </div>
          </Button>

          <Button 
            onClick={handleLogin}
            variant="outline"
            className="w-full border-2 border-eco-blue text-eco-blue hover:bg-eco-blue hover:text-white font-semibold py-4 rounded-2xl transition-all duration-200 text-lg"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <Users className="h-6 w-6" />
              <span>{t('landing.staffButton')}</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-eco-gray pb-6">
        <div className="flex items-center justify-center space-x-1">
          <span>Menos desperdício, mais sustentabilidade</span>
        </div>
      </div>
    </div>
  );
}

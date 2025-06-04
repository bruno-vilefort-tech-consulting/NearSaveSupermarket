import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Users, Leaf, Globe, ChevronDown, Recycle, Heart, TrendingUp, Apple, Banana, Coffee } from "lucide-react";
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

  // Padrão de fundo com ícones de alimentos
  const FoodPattern = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <div className="absolute top-10 left-10">
        <Apple className="h-8 w-8 text-white rotate-12" />
      </div>
      <div className="absolute top-32 right-16">
        <Coffee className="h-6 w-6 text-white -rotate-12" />
      </div>
      <div className="absolute top-20 right-32">
        <Banana className="h-7 w-7 text-white rotate-45" />
      </div>
      <div className="absolute bottom-40 left-20">
        <Recycle className="h-9 w-9 text-white rotate-12" />
      </div>
      <div className="absolute bottom-32 right-12">
        <Heart className="h-6 w-6 text-white -rotate-12" />
      </div>
      <div className="absolute top-44 left-32">
        <ShoppingCart className="h-7 w-7 text-white rotate-6" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Seção Superior - Laranja com padrão */}
      <div className="relative bg-eco-orange flex-1 overflow-hidden">
        <FoodPattern />
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-6">
          <div className="text-sm text-white/80 font-medium">
            {t('landing.subtitle')}
          </div>
          
          {/* Language Selector */}
          <div className="relative" ref={languageMenuRef}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="h-10 px-3 text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              <ChevronDown className={`h-3 w-3 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {isLanguageMenuOpen && (
              <div className="absolute right-0 top-12 bg-white border border-eco-gray-light rounded-xl shadow-lg py-2 min-w-32 z-20">
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

        {/* Logo e Título */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pb-8">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Leaf className="h-12 w-12 text-eco-orange" />
              </div>
            </div>
            
            {/* Título */}
            <h1 className="text-5xl font-bold text-white tracking-tight mb-8">
              {t('landing.title')}
            </h1>
            
            {/* Badges/Selos */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-2">
                  <Recycle className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-sm">JUNTOS CONTRA O</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-8 py-3">
                  <span className="text-white font-bold text-lg">DESPERDÍCIO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior - Branca */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-20 px-6 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          {/* Chamada Principal */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-eco-gray-dark">
              BORA FAZER PARTE DO<br />
              MOVIMENTO ECOMART?
            </h2>
            <p className="text-eco-gray">
              clique abaixo para salvar alimentos!
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/customer/login'}
              className="w-full bg-eco-orange hover:bg-eco-orange-dark text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              Cadastrar
            </Button>

            <Button 
              onClick={handleLogin}
              variant="outline"
              className="w-full border-2 border-eco-orange text-eco-orange hover:bg-eco-orange/5 font-bold py-4 rounded-full text-lg transition-all duration-200"
              size="lg"
            >
              Acessar minha conta
            </Button>

            <Button 
              variant="ghost"
              className="w-full text-eco-orange font-bold py-4 text-lg hover:bg-eco-orange/5 transition-all duration-200"
              size="lg"
            >
              Buscar estabelecimentos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

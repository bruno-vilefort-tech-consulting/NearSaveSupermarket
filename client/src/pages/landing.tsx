import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Users, Leaf, Globe, ChevronDown, Recycle, Heart, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";
import VersionDisplay from "@/components/VersionDisplay";
import deliveryImage from "@assets/20250608_2055_Entregador em Lambreta_remix_01jx8ze4m4f5a9s66kt9rnn9eb_1749427224219.png";

export default function Landing() {
  const { t, setLanguage } = useLanguage();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  const handleLogin = () => {
    window.location.href = "/login";
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
          <div className="flex justify-center mt-2">
            <span className="bg-gray-500 text-white text-[8px] font-medium px-2 py-1 rounded">Versão Beta</span>
          </div>
        </div>
      </div>

      {/* Delivery Image */}
      <div className="flex justify-center py-4">
        <img 
          src={deliveryImage}
          alt="Entregador em lambreta SaveUp" 
          className="w-96 h-96 object-contain"
        />
      </div>
      
      {/* Marketing Tagline */}
      <div className="text-center mt-6">
        <p className="text-lg font-medium text-eco-gray-dark leading-relaxed">
          Seu carrinho mais cheio<br />
          seu gasto mais leve
        </p>
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
            className="w-full bg-gradient-to-r from-eco-green to-eco-green-dark hover:from-eco-green-dark hover:to-eco-green text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-in-out text-lg"
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
            className="w-full border-2 border-eco-blue text-eco-blue hover:bg-eco-blue hover:text-white font-semibold py-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ease-in-out text-lg"
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
      
      {/* Version Display */}
      <VersionDisplay />
    </div>
  );
}

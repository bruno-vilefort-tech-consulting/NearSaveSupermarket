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
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-eco-green rounded-3xl flex items-center justify-center shadow-lg shadow-eco-green/25">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-eco-orange rounded-full flex items-center justify-center">
              <Heart className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-eco-gray-dark tracking-tight">
            {t('landing.title')}
          </h1>
          <p className="text-lg text-eco-gray max-w-md mx-auto leading-relaxed">
            Conectando supermercados e consumidores para reduzir o desperdício de alimentos
          </p>
        </div>
      </div>

      {/* Cards de Benefícios */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Card className="border-eco-green-light bg-eco-green-light/20 hover:bg-eco-green-light/30 transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Recycle className="h-6 w-6 text-eco-green mx-auto mb-2" />
            <p className="text-xs font-medium text-eco-gray-dark">Menos Desperdício</p>
          </CardContent>
        </Card>
        
        <Card className="border-eco-orange-light bg-eco-orange-light/20 hover:bg-eco-orange-light/30 transition-all duration-300">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-eco-orange mx-auto mb-2" />
            <p className="text-xs font-medium text-eco-gray-dark">Mais Economia</p>
          </CardContent>
        </Card>
        
        <Card className="border-eco-blue-light bg-eco-blue-light/20 hover:bg-eco-blue-light/30 transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 text-eco-blue mx-auto mb-2" />
            <p className="text-xs font-medium text-eco-gray-dark">Mais Sustentável</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="text-sm text-eco-gray font-medium">
          {t('landing.subtitle')}
        </div>
        
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
          <Leaf className="h-3 w-3 text-eco-green" />
          <span>Menos desperdício, mais sustentabilidade</span>
        </div>
      </div>
    </div>
  );
}

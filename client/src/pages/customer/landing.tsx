import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Users, Leaf, Globe, ChevronDown, Recycle, Heart, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import deliveryImage from "@assets/20250608_2055_Entregador em Lambreta_remix_01jx8ze4m4f5a9s66kt9rnn9eb_1749427224219.png";

export default function CustomerLanding() {
  const { t, setLanguage } = useLanguage();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  
  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
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
    <div className="relative text-center space-y-4 md:space-y-8">
      {/* Logo e Título Principal */}
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-2 md:space-y-3">
          <h1 className="text-5xl md:text-8xl font-bold text-eco-gray-dark tracking-tight">
            {t('landing.title')}
          </h1>
          <div className="flex justify-center">
            <span className="text-eco-orange text-[15px] font-bold">By Up Brasil</span>
          </div>
          <div className="flex justify-center mt-2">
            <span className="bg-gray-500 text-white text-[12px] font-medium px-3 py-1.5 rounded">Versão Beta</span>
          </div>
        </div>
      </div>

      {/* Delivery Image */}
      <div className="flex justify-center items-center my-4 md:my-8">
        <img 
          src={deliveryImage} 
          alt="Entregador em lambreta SaveUp" 
          className="w-72 md:w-96 h-auto max-w-full object-contain drop-shadow-lg"
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-4 justify-center items-center w-full max-w-xs mx-auto px-4">
        <Button
          onClick={handleLogin}
          size="lg"
          className="w-full bg-gradient-to-r from-eco-green to-eco-green-dark hover:from-eco-green-dark hover:to-eco-green text-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
        >
          {t('auth.login')}
        </Button>
        <Button
          onClick={handleRegister}
          variant="outline"
          size="lg"
          className="w-full border-2 border-eco-green text-eco-green hover:bg-eco-green hover:text-white py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
        >
          {t('customer.register')}
        </Button>
      </div>
    </div>
  );

  const FeatureCards = () => {
    const features = [
      {
        icon: <ShoppingCart className="h-8 w-8 text-eco-green" />,
        title: t('landing.feature1Title'),
        description: t('landing.feature1Description')
      },
      {
        icon: <Leaf className="h-8 w-8 text-eco-green" />,
        title: t('landing.feature2Title'),
        description: t('landing.feature2Description')
      },
      {
        icon: <Heart className="h-8 w-8 text-eco-green" />,
        title: t('landing.feature3Title'),
        description: t('landing.feature3Description')
      },
      {
        icon: <TrendingUp className="h-8 w-8 text-eco-green" />,
        title: t('landing.feature4Title'),
        description: t('landing.feature4Description')
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-eco-green-light bg-white hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-eco-green-light rounded-full flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-eco-gray-dark">
                {feature.title}
              </h3>
              <p className="text-eco-gray text-sm leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const StatsSection = () => (
    <div className="bg-eco-green-light py-16 rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-eco-gray-dark mb-4">
            {t('landing.impactTitle')}
          </h2>
          <p className="text-eco-gray text-lg">
            {t('landing.impactSubtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-eco-green mb-2">50%</div>
            <p className="text-eco-gray-dark">{t('landing.stat1')}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-eco-green mb-2">1000+</div>
            <p className="text-eco-gray-dark">{t('landing.stat2')}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-eco-green mb-2">24/7</div>
            <p className="text-eco-gray-dark">{t('landing.stat3')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-gray-light to-white flex flex-col">
      {/* Header */}
      <div className="flex justify-end items-center p-4">
        {/* Language Selector */}
        <div className="relative" ref={languageMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            className="flex items-center space-x-2 text-eco-gray hover:text-eco-gray-dark"
          >
            <Globe size={16} />
            <span className="text-sm">{t('common.language')}</span>
            <ChevronDown size={14} />
          </Button>
          
          {isLanguageMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-eco-gray-light z-50">
              <button
                onClick={() => {
                  setLanguage('pt-BR');
                  setIsLanguageMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-eco-gray-light rounded-t-lg transition-colors"
              >
                🇧🇷 Português
              </button>
              <button
                onClick={() => {
                  setLanguage('en-US');
                  setIsLanguageMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-eco-gray-light rounded-b-lg transition-colors"
              >
                🇺🇸 English
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
        <ModernHeroSection />
      </div>
    </div>
  );
}
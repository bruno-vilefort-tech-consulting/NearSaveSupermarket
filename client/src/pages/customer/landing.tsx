import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Users, Leaf, Globe, ChevronDown, Recycle, Heart, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

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

      {/* Ilustração das Sacolas */}
      <div className="flex justify-center">
        <svg viewBox="0 0 220 140" className="w-[28rem] h-auto">
          {/* Definições de gradientes */}
          <defs>
            <linearGradient id="greenBagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 60% 35%)" />
              <stop offset="100%" stopColor="hsl(160 65% 25%)" />
            </linearGradient>
            <linearGradient id="orangeBagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 95% 60%)" />
              <stop offset="100%" stopColor="hsl(25 95% 45%)" />
            </linearGradient>
            <linearGradient id="lightGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 50% 45%)" />
              <stop offset="100%" stopColor="hsl(160 55% 35%)" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
            </filter>
          </defs>

          {/* Sacola Pequena (esquerda) */}
          <g filter="url(#shadow)">
            <path d="M25 85 L25 120 Q25 125 30 125 L50 125 Q55 125 55 120 L55 85 Z" fill="url(#orangeBagGradient)" />
            <rect x="25" y="82" width="30" height="5" rx="2" fill="url(#orangeBagGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M32 82 Q32 76 38 76 Q44 76 44 82" stroke="url(#orangeBagGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M36 82 Q36 76 42 76 Q48 76 48 82" stroke="url(#orangeBagGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Sacola Média (centro) */}
          <g filter="url(#shadow)">
            <path d="M65 70 L65 120 Q65 125 70 125 L100 125 Q105 125 105 120 L105 70 Z" fill="url(#lightGreenGradient)" />
            <rect x="65" y="67" width="40" height="6" rx="3" fill="url(#lightGreenGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M73 67 Q73 60 80 60 Q87 60 87 67" stroke="url(#lightGreenGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M83 67 Q83 60 90 60 Q97 60 97 67" stroke="url(#lightGreenGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>

          {/* Sacola Grande (direita) */}
          <g filter="url(#shadow)">
            <path d="M115 45 L115 120 Q115 125 120 125 L155 125 Q160 125 160 120 L160 45 Z" fill="url(#greenBagGradient)" />
            <rect x="115" y="40" width="45" height="8" rx="4" fill="url(#greenBagGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M125 40 Q125 30 133 30 Q141 30 141 40" stroke="url(#greenBagGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M134 40 Q134 30 142 30 Q150 30 150 40" stroke="url(#greenBagGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 justify-center items-center w-full max-w-xs mx-auto">
          <Button
            onClick={handleLogin}
            size="default"
            className="w-full bg-eco-green hover:bg-eco-green-dark text-white px-6 py-3 text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            {t('auth.login')}
          </Button>
          <Button
            onClick={handleRegister}
            variant="outline"
            size="default"
            className="w-full border-2 border-eco-green text-eco-green hover:bg-eco-green hover:text-white px-6 py-3 text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            {t('customer.register')}
          </Button>
        </div>
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
    <div className="h-screen bg-gradient-to-b from-eco-gray-light to-white flex flex-col overflow-hidden">
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
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <ModernHeroSection />
      </div>
    </div>
  );
}
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
      <div className="flex justify-center items-center">
        <svg viewBox="0 0 150 80" className="w-[22rem] h-auto mx-auto">
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
            <path d="M10 45 L10 65 Q10 70 15 70 L30 70 Q35 70 35 65 L35 45 Z" fill="url(#orangeBagGradient)" />
            <rect x="10" y="42" width="25" height="4" rx="2" fill="url(#orangeBagGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M16 42 Q16 37 21 37 Q26 37 26 42" stroke="url(#orangeBagGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M19 42 Q19 37 24 37 Q29 37 29 42" stroke="url(#orangeBagGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>

          {/* Sacola Média (centro) */}
          <g filter="url(#shadow)">
            <path d="M45 35 L45 65 Q45 70 50 70 L70 70 Q75 70 75 65 L75 35 Z" fill="url(#lightGreenGradient)" />
            <rect x="45" y="32" width="30" height="5" rx="2" fill="url(#lightGreenGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M51 32 Q51 26 57 26 Q63 26 63 32" stroke="url(#lightGreenGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M57 32 Q57 26 63 26 Q69 26 69 32" stroke="url(#lightGreenGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Sacola Grande (direita) */}
          <g filter="url(#shadow)">
            <path d="M85 20 L85 65 Q85 70 90 70 L120 70 Q125 70 125 65 L125 20 Z" fill="url(#greenBagGradient)" />
            <rect x="85" y="16" width="40" height="6" rx="3" fill="url(#greenBagGradient)" opacity="0.8" />
            {/* Alças */}
            <path d="M93 16 Q93 9 100 9 Q107 9 107 16" stroke="url(#greenBagGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M103 16 Q103 9 110 9 Q117 9 117 16" stroke="url(#greenBagGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
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
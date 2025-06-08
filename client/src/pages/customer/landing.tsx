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

      {/* Ilustração do Carrinho */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-[40rem] h-auto">
          {/* Definições de gradientes */}
          <defs>
            <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(160 60% 30%)" />
              <stop offset="100%" stopColor="hsl(160 65% 25%)" />
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
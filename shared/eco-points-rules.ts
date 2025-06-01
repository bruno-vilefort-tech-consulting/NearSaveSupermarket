// Sistema de Pontuação Eco - Regras Detalhadas

export interface EcoPointsRule {
  condition: string;
  description: string;
  basePoints: number;
  multiplier?: number;
  category?: string;
  icon?: string;
  color?: string;
}

export const ECO_POINTS_RULES: EcoPointsRule[] = [
  {
    condition: "Vence hoje",
    description: "Produto vence no mesmo dia - máximo impacto na redução de desperdício",
    basePoints: 100,
    category: "urgente",
    color: "bg-red-100 text-red-800"
  },
  {
    condition: "Vence amanhã",
    description: "Produto vence em 1 dia - alta prioridade",
    basePoints: 80,
    category: "muito-próximo",
    color: "bg-red-100 text-red-800"
  },
  {
    condition: "Vence em 2-3 dias",
    description: "Produto próximo ao vencimento - contribuição significativa",
    basePoints: 60,
    category: "próximo",
    color: "bg-orange-100 text-orange-800"
  },
  {
    condition: "Vence em 4-7 dias",
    description: "Produto com vencimento em 1 semana - boa contribuição",
    basePoints: 40,
    category: "moderado",
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    condition: "Vence em 8-14 dias",
    description: "Produto com vencimento em 2 semanas - contribuição básica",
    basePoints: 25,
    category: "distante",
    color: "bg-blue-100 text-blue-800"
  },
  {
    condition: "Vence em 15-30 dias",
    description: "Produto com vencimento até 1 mês - contribuição mínima",
    basePoints: 15,
    category: "muito-distante",
    color: "bg-green-100 text-green-800"
  },
  {
    condition: "Mais de 30 dias",
    description: "Produto com vencimento distante - pontuação padrão",
    basePoints: 10,
    category: "padrão",
    color: "bg-gray-100 text-gray-800"
  }
];

// Multiplicadores baseados em categoria de produto
export const CATEGORY_MULTIPLIERS: Record<string, { multiplier: number; reason: string }> = {
  "Laticínios": { 
    multiplier: 1.2, 
    reason: "Produtos perecíveis com alto desperdício potencial" 
  },
  "Carnes e Aves": { 
    multiplier: 1.3, 
    reason: "Alto impacto ambiental e nutricional" 
  },
  "Hortifruti": { 
    multiplier: 1.1, 
    reason: "Produtos frescos com deterioração rápida" 
  },
  "Padaria": { 
    multiplier: 1.15, 
    reason: "Produtos com vida útil curta" 
  },
  "Frios": { 
    multiplier: 1.2, 
    reason: "Produtos refrigerados sensíveis" 
  }
};

// Função principal para calcular pontos eco
export function calculateEcoPoints(expirationDate: string, category?: string): number {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let basePoints = 10; // Pontuação padrão
  
  // Determinar pontos base pelo tempo até vencimento
  if (daysUntilExpiry <= 0) {
    basePoints = 100; // Vence hoje
  } else if (daysUntilExpiry === 1) {
    basePoints = 80; // Vence amanhã
  } else if (daysUntilExpiry <= 3) {
    basePoints = 60; // 2-3 dias
  } else if (daysUntilExpiry <= 7) {
    basePoints = 40; // 4-7 dias
  } else if (daysUntilExpiry <= 14) {
    basePoints = 25; // 8-14 dias
  } else if (daysUntilExpiry <= 30) {
    basePoints = 15; // 15-30 dias
  } else {
    basePoints = 10; // Mais de 30 dias
  }
  
  // Aplicar multiplicador por categoria
  let finalPoints = basePoints;
  if (category && CATEGORY_MULTIPLIERS[category]) {
    finalPoints = Math.round(basePoints * CATEGORY_MULTIPLIERS[category].multiplier);
  }
  
  return finalPoints;
}

// Função para obter a regra específica para um produto
export function getEcoPointsRule(expirationDate: string): EcoPointsRule {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    return ECO_POINTS_RULES[0]; // Vence hoje
  } else if (daysUntilExpiry === 1) {
    return ECO_POINTS_RULES[1]; // Vence amanhã
  } else if (daysUntilExpiry <= 3) {
    return ECO_POINTS_RULES[2]; // 2-3 dias
  } else if (daysUntilExpiry <= 7) {
    return ECO_POINTS_RULES[3]; // 4-7 dias
  } else if (daysUntilExpiry <= 14) {
    return ECO_POINTS_RULES[4]; // 8-14 dias
  } else if (daysUntilExpiry <= 30) {
    return ECO_POINTS_RULES[5]; // 15-30 dias
  } else {
    return ECO_POINTS_RULES[6]; // Mais de 30 dias
  }
}

// Função para formatar a exibição de pontos
export function formatEcoPointsDisplay(points: number): string {
  if (points >= 100) {
    return `+${points} pts!`;
  } else if (points >= 50) {
    return `+${points} pts`;
  } else {
    return `+${points}`;
  }
}

// Função para obter a cor da badge baseada nos pontos
export function getEcoPointsBadgeColor(points: number): string {
  if (points >= 80) {
    return "bg-red-100 text-red-800"; // Urgente
  } else if (points >= 60) {
    return "bg-orange-100 text-orange-800"; // Muito próximo
  } else if (points >= 40) {
    return "bg-yellow-100 text-yellow-800"; // Próximo
  } else if (points >= 25) {
    return "bg-blue-100 text-blue-800"; // Moderado
  } else {
    return "bg-green-100 text-green-800"; // Distante
  }
}
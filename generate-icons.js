import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de ícones se não existir
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG otimizado do SaveUp com melhor definição
const createSaveUpIcon = (size) => {
  const strokeWidth = Math.max(1, size / 64); // Largura proporcional
  const iconScale = size / 100; // Escala base
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo com bordas arredondadas -->
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#22c55e"/>
  
  <!-- Ícone do carrinho sustentável -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Base do carrinho -->
    <rect x="-${16*iconScale}" y="-${12*iconScale}" width="${32*iconScale}" height="${24*iconScale}" rx="${3*iconScale}" fill="white" stroke="none"/>
    
    <!-- Alça do carrinho -->
    <path d="M -${14*iconScale} -${12*iconScale} L -${14*iconScale} -${18*iconScale} Q -${14*iconScale} -${20*iconScale} -${12*iconScale} -${20*iconScale} L ${12*iconScale} -${20*iconScale} Q ${14*iconScale} -${20*iconScale} ${14*iconScale} -${18*iconScale} L ${14*iconScale} -${12*iconScale}" 
          stroke="white" stroke-width="${strokeWidth*2}" fill="none"/>
    
    <!-- Folha eco (símbolo sustentável) -->
    <ellipse cx="0" cy="-${2*iconScale}" rx="${8*iconScale}" ry="${6*iconScale}" fill="#22c55e"/>
    <path d="M -${4*iconScale} -${5*iconScale} Q 0 -${8*iconScale} ${4*iconScale} -${5*iconScale} Q 0 -${2*iconScale} -${4*iconScale} -${5*iconScale}" fill="white"/>
    
    <!-- Rodas do carrinho -->
    <circle cx="-${8*iconScale}" cy="${12*iconScale}" r="${3*iconScale}" fill="white"/>
    <circle cx="${8*iconScale}" cy="${12*iconScale}" r="${3*iconScale}" fill="white"/>
  </g>
</svg>`;
};

// Tamanhos necessários para PWA e favicon
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

// Gerar SVGs para cada tamanho
sizes.forEach(size => {
  const svgContent = createSaveUpIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Criado: ${filename}`);
});

// Criar favicon.svg especial para a raiz
const faviconSvg = createSaveUpIcon(32);
fs.writeFileSync(path.join(__dirname, 'favicon.svg'), faviconSvg);
fs.writeFileSync(path.join(__dirname, 'client', 'public', 'favicon.svg'), faviconSvg);

console.log('🎉 Todos os ícones SVG foram gerados com sucesso!');
console.log('📝 Próximos passos:');
console.log('1. Execute: npm install sharp (se não tiver)');
console.log('2. Execute: node convert-icons.js (criar este script)');
console.log('3. Ou use um conversor online para SVG → PNG');
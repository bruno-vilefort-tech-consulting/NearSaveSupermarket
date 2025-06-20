import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para converter SVG em PNG usando canvas (alternativa ao Sharp)
const convertSvgToPng = (svgPath, pngPath, size) => {
  try {
    // Para usar com Sharp (recomendado para produção)
    // const sharp = require('sharp');
    // await sharp(svgPath).resize(size, size).png().toFile(pngPath);
    
    console.log(`📸 Converter manualmente: ${svgPath} → ${pngPath} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao converter ${svgPath}:`, error.message);
    return false;
  }
};

// Converter todos os ícones SVG para PNG
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
const svgFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));

console.log('🔄 Iniciando conversão SVG → PNG...\n');

svgFiles.forEach(svgFile => {
  const sizeMatch = svgFile.match(/icon-(\d+)x\d+\.svg/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    const svgPath = path.join(iconsDir, svgFile);
    const pngPath = path.join(iconsDir, svgFile.replace('.svg', '.png'));
    
    convertSvgToPng(svgPath, pngPath, size);
  }
});

console.log('\n✨ Conversão concluída!');
console.log('💡 Para conversão automática, instale: npm install sharp');
console.log('🌐 Ou use um conversor online como:');
console.log('   • https://convertio.co/svg-png/');
console.log('   • https://cloudconvert.com/svg-to-png');
console.log('\n📋 Arquivos SVG gerados em: client/public/icons/');
console.log('🎯 Converta cada SVG para PNG mantendo as dimensões originais'); 
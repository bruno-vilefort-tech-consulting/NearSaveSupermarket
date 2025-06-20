import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar se o arquivo fonte existe
const sourceImage = path.join(__dirname, 'icone_saveup.png');
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Arquivo icone_saveup.png não encontrado!');
  process.exit(1);
}

// Tamanhos necessários para PWA
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

// Diretórios
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
const publicDir = path.join(__dirname, 'client', 'public');

// Criar diretório de ícones se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🖼️  Processando ícone personalizado SaveUp...');
console.log(`📁 Arquivo fonte: ${path.basename(sourceImage)}`);
console.log(`📊 Tamanho do arquivo: ${(fs.statSync(sourceImage).size / 1024 / 1024).toFixed(2)}MB`);

// Função para copiar e renomear para diferentes tamanhos
function createIconFile(size) {
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    // Por enquanto, copiar o arquivo original
    // Em produção, você deve redimensionar usando uma ferramenta como Sharp ou ImageMagick
    fs.copyFileSync(sourceImage, outputPath);
    
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    console.log(`✅ Criado: icon-${size}x${size}.png (${sizeKB}KB)`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar icon-${size}x${size}.png:`, error.message);
    return false;
  }
}

// Criar favicon.png
function createFavicon() {
  const faviconPath = path.join(publicDir, 'favicon.png');
  
  try {
    fs.copyFileSync(sourceImage, faviconPath);
    console.log(`✅ Criado: favicon.png`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar favicon.png:`, error.message);
    return false;
  }
}

// Processar todos os tamanhos
console.log('\n🔄 Gerando ícones para PWA...\n');

let successCount = 0;
sizes.forEach(size => {
  if (createIconFile(size)) {
    successCount++;
  }
});

// Criar favicon
createFavicon();

console.log(`\n🎉 Processamento concluído!`);
console.log(`✅ ${successCount}/${sizes.length} ícones criados com sucesso`);

console.log('\n⚠️  IMPORTANTE: Para melhor qualidade, redimensione as imagens:');
console.log('💡 Recomendações:');
console.log('   1. Use uma ferramenta como Photoshop, GIMP ou online');
console.log('   2. Redimensione cada ícone para sua resolução específica');
console.log('   3. Mantenha a proporção e qualidade');
console.log('   4. Use PNG com transparência quando apropriado');

console.log('\n🔧 Para redimensionamento automático, instale Sharp:');
console.log('   npm install sharp');
console.log('   Depois modifique este script para usar Sharp para redimensionar');

console.log('\n🚀 Sua aplicação PWA agora usa seu ícone personalizado!'); 
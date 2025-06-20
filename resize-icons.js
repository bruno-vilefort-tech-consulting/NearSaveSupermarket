import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const iconsDir = 'client/public/icons';

async function resizeIcons() {
  console.log('🔄 Redimensionando ícones...');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    await sharp('icone_saveup.png')
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ ${size}x${size} (${(stats.size/1024).toFixed(1)}KB)`);
  }
  
  // Favicon
  await sharp('icone_saveup.png')
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90 })
    .toFile('client/public/favicon.png');
  
  console.log('🎉 Ícones otimizados criados!');
}

resizeIcons().catch(console.error);
 
import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Configurar servir arquivos estáticos do dist/public
const publicPath = path.resolve('dist/public');
console.log('Servindo arquivos de:', publicPath);
console.log('Arquivos disponíveis:', fs.readdirSync(publicPath));

app.use(express.static(publicPath));

app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  console.log('Servindo:', indexPath);
  const content = fs.readFileSync(indexPath, 'utf8');
  console.log('Tamanho do HTML:', content.length);
  console.log('Primeiros 100 chars:', content.substring(0, 100));
  res.send(content);
});

const port = 4000;
app.listen(port, () => {
  console.log(`Servidor teste rodando na porta ${port}`);
  
  // Fazer uma requisição de teste
  setTimeout(() => {
    import('http').then(({ default: http }) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('\n=== RESULTADO DO TESTE ===');
          console.log('Status:', res.statusCode);
          console.log('Tamanho:', data.length);
          console.log('Contém SaveUp:', data.includes('SaveUp'));
          console.log('Contém root div:', data.includes('<div id="root"></div>'));
          console.log('Contém JS bundle:', data.includes('index-') && data.includes('.js'));
          
          if (data.length < 1000) {
            console.log('\nHTML completo:');
            console.log(data);
          }
          
          process.exit(0);
        });
      });
      
      req.on('error', err => {
        console.error('Erro:', err.message);
        process.exit(1);
      });
    });
  }, 1000);
});
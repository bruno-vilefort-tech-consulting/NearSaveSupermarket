import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EcoMarket funcionando' });
});

// Serve main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`EcoMarket servidor rodando na porta ${port}`);
});
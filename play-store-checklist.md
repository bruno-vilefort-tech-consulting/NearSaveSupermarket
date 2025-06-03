# Checklist: Publicar EcoMarket na Google Play Store

## 🎯 Status Atual da Aplicação
✅ PWA configurado (manifest.json + service worker)
✅ Meta tags para mobile otimizadas
✅ Interface responsiva e mobile-first
✅ Funcionalidades completas (PIX, geolocalização, etc.)
✅ Pronto para deploy no Replit

## 📋 Próximos Passos para Google Play Store

### 1. Deploy da Aplicação (AGORA)
- [ ] Clique no botão "Deploy" no Replit
- [ ] Aguarde o deploy completar
- [ ] Anote a URL final (exemplo: https://seuapp.replit.app)

### 2. Configurar Conta Google Play Developer
- [ ] Acesse [Google Play Console](https://play.google.com/console)
- [ ] Pague taxa única de $25 USD
- [ ] Complete verificação de identidade

### 3. Converter PWA para Android App (TWA)

#### Instalação do Bubblewrap:
```bash
npm install -g @bubblewrap/cli
```

#### Comando para gerar app Android:
```bash
bubblewrap init --manifest https://SUA-URL-AQUI/manifest.json
```

### 4. Informações Necessárias para a Play Store

#### Textos em Português:
- **Nome do App**: "EcoMarket - Supermercados Sustentáveis"
- **Descrição Curta** (80 chars): "Compras sustentáveis com PIX e pontos ecológicos"
- **Descrição Completa**:
```
Revolucione suas compras com o EcoMarket! 

🌱 SUSTENTABILIDADE EM PRIMEIRO LUGAR
- Sistema de pontos ecológicos por produtos próximos ao vencimento
- Incentivo ao consumo consciente e redução de desperdício
- Recompensas por escolhas sustentáveis

💳 PAGAMENTO FACILITADO
- Pagamento 100% via PIX
- Transações seguras e instantâneas
- Sem taxas adicionais

📍 LOCALIZAÇÃO INTELIGENTE
- Encontre supermercados próximos (raio de 20km)
- Produtos disponíveis em tempo real
- Navegação integrada

🛒 RECURSOS ESPECIAIS
- Carrinho restrito a um supermercado por compra
- Acompanhamento de pedidos em tempo real
- Notificações push para ofertas especiais
- Interface otimizada para mobile

Junte-se à revolução das compras sustentáveis no Brasil!
```

#### Categorias e Tags:
- **Categoria Principal**: Compras
- **Tags**: supermercado, sustentabilidade, PIX, ecológico, compras

### 5. Assets Necessários

#### Ícones (já criados):
- [x] 192x192px
- [x] 512x512px

#### Screenshots Necessários:
- [ ] 4-8 screenshots da aplicação
- [ ] Tamanhos: 320x480px até 3840x2160px
- [ ] Mostrar principais funcionalidades

#### Banner da Feature (opcional):
- [ ] 1024x500px

### 6. Digital Asset Links (para TWA)

Arquivo `.well-known/assetlinks.json` no seu servidor:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "br.com.ecomarket.twa",
    "sha256_cert_fingerprints": ["FINGERPRINT_SERA_GERADO_PELO_BUBBLEWRAP"]
  }
}]
```

### 7. Documentos Legais Obrigatórios

#### Política de Privacidade (criar página):
```
https://SUA-URL/privacy-policy

Conteúdo mínimo:
- Quais dados coletamos (localização, email, etc.)
- Como usamos os dados
- Compartilhamento com terceiros
- Direitos do usuário (LGPD)
- Contato para dúvidas
```

#### Termos de Uso:
```
https://SUA-URL/terms-of-service

Conteúdo mínimo:
- Regras de uso da aplicação
- Responsabilidades do usuário
- Política de reembolso (se aplicável)
- Limitações de responsabilidade
```

### 8. Configurações da Play Store

#### Classificação Indicativa:
- **Idade**: Livre para todos
- **Conteúdo**: Aplicativo de compras

#### Preços e Distribuição:
- **Preço**: Gratuito
- **Países**: Brasil + outros de interesse
- **Dispositivos**: Telefones e tablets

### 9. Processo de Publicação

#### Fluxo no Google Play Console:
1. **Criar novo app**
2. **Upload do APK/AAB**
3. **Preencher informações da loja**
4. **Configurar classificação de conteúdo**
5. **Definir preços e distribuição**
6. **Adicionar política de privacidade**
7. **Revisar e publicar**

#### Tempo de Aprovação:
- **Primeira submissão**: 1-3 dias
- **Atualizações**: Algumas horas

### 10. Comandos Resumidos

```bash
# 1. Instalar ferramentas
npm install -g @bubblewrap/cli

# 2. Criar projeto Android
bubblewrap init --manifest https://SUA-URL/manifest.json

# 3. Gerar assinatura digital
bubblewrap fingerprint

# 4. Construir APK para Play Store
bubblewrap build

# 5. O arquivo .apk estará em ./app-release-signed.apk
```

## 🚀 AÇÃO IMEDIATA

**AGORA**: Clique em "Deploy" no Replit para obter sua URL final.

**DEPOIS**: Avise-me quando tiver a URL para continuar com o próximo passo!

---

💡 **Dica**: O processo todo leva cerca de 2-3 dias se seguido corretamente. A parte mais demorada é a aprovação do Google (1-3 dias).
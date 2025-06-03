// Simple translation system for Portuguese texts
const translations: Record<string, string> = {
  // Navigation
  'home': 'Início',
  'products': 'Produtos',
  'orders': 'Pedidos',
  'dashboard': 'Painel',
  'cart': 'Carrinho',
  'login': 'Entrar',
  'logout': 'Sair',
  'register': 'Cadastrar',
  
  // General
  'search': 'Buscar',
  'save': 'Salvar',
  'cancel': 'Cancelar',
  'delete': 'Excluir',
  'edit': 'Editar',
  'add': 'Adicionar',
  'close': 'Fechar',
  'loading': 'Carregando...',
  'error': 'Erro',
  'success': 'Sucesso',
  'confirm': 'Confirmar',
  'back': 'Voltar',
  
  // Products
  'product_name': 'Nome do Produto',
  'price': 'Preço',
  'original_price': 'Preço Original',
  'discount_price': 'Preço com Desconto',
  'category': 'Categoria',
  'quantity': 'Quantidade',
  'expiration_date': 'Data de Vencimento',
  'description': 'Descrição',
  'add_to_cart': 'Adicionar ao Carrinho',
  'out_of_stock': 'Fora de Estoque',
  
  // Orders
  'order_status': 'Status do Pedido',
  'customer_name': 'Nome do Cliente',
  'customer_email': 'Email do Cliente',
  'customer_phone': 'Telefone do Cliente',
  'delivery_address': 'Endereço de Entrega',
  'total_amount': 'Valor Total',
  'order_date': 'Data do Pedido',
  
  // Auth
  'email': 'Email',
  'password': 'Senha',
  'company_name': 'Nome da Empresa',
  'cpf': 'CPF',
  'phone': 'Telefone',
  'name': 'Nome',
  'address': 'Endereço',
  
  // Messages
  'welcome': 'Bem-vindo',
  'no_products': 'Nenhum produto encontrado',
  'no_orders': 'Nenhum pedido encontrado',
  'login_required': 'Login necessário',
  'invalid_credentials': 'Credenciais inválidas',
  'product_added': 'Produto adicionado com sucesso',
  'product_updated': 'Produto atualizado com sucesso',
  'order_created': 'Pedido criado com sucesso',
  
  // Supermarket
  'supermarket': 'Supermercado',
  'supermarkets': 'Supermercados',
  'nearby_supermarkets': 'Supermercados Próximos',
  'distance': 'Distância',
  'view_products': 'Ver Produtos',
  
  // Payment
  'payment': 'Pagamento',
  'pix_payment': 'Pagamento PIX',
  'copy_code': 'Copiar Código',
  'payment_status': 'Status do Pagamento',
  'pending': 'Pendente',
  'approved': 'Aprovado',
  'cancelled': 'Cancelado',
  
  // Eco Points
  'eco_points': 'Pontos Ecológicos',
  'eco_actions': 'Ações Ecológicas',
  'save_environment': 'Salvar o Meio Ambiente',
};

export function t(key: string): string {
  return translations[key] || key;
}
// Simple translation function replacement
export function t(key: string): string {
  // Return Portuguese text for all keys
  const translations: Record<string, string> = {
    // Common
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpar',
    'common.total': 'Total',
    'common.quantity': 'Quantidade',
    'common.price': 'Preço',
    'common.discount': 'Desconto',
    'common.status': 'Status',
    'common.date': 'Data',
    'common.time': 'Hora',
    'common.address': 'Endereço',
    'common.phone': 'Telefone',
    'common.email': 'Email',
    'common.name': 'Nome',
    'common.description': 'Descrição',
    'common.category': 'Categoria',
    'common.confirm': 'Confirmar',
    'common.success': 'Sucesso',
    'common.error': 'Erro',
    'common.warning': 'Atenção',
    'common.info': 'Informação',
    
    // Customer app
    'customer.home.title': 'Supermercados Próximos',
    'customer.home.findSupermarkets': 'Encontrar Supermercados',
    'customer.home.noSupermarkets': 'Nenhum supermercado encontrado',
    'customer.cart.title': 'Carrinho',
    'customer.cart.empty': 'Seu carrinho está vazio',
    'customer.cart.checkout': 'Finalizar Compra',
    'customer.cart.total': 'Total',
    'customer.cart.remove': 'Remover',
    'customer.login.title': 'Entrar',
    'customer.login.email': 'Email',
    'customer.login.password': 'Senha',
    'customer.login.login': 'Entrar',
    'customer.login.register': 'Cadastrar',
    'customer.login.forgotPassword': 'Esqueci minha senha',
    
    // Products
    'products.title': 'Produtos',
    'products.addToCart': 'Adicionar ao Carrinho',
    'products.outOfStock': 'Fora de Estoque',
    'products.expiresSoon': 'Vence em breve',
    'products.ecoPoints': 'Pontos Eco',
    
    // Payment
    'payment.title': 'Pagamento',
    'payment.pix': 'PIX',
    'payment.total': 'Total a Pagar',
    'payment.generating': 'Gerando código PIX...',
    'payment.success': 'Pagamento realizado com sucesso!',
    'payment.error': 'Erro no pagamento',
    
    // Default fallback
    default: key
  };
  
  return translations[key] || translations.default || key;
}
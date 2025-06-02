export type Language = 'pt-BR' | 'en-US';

export interface TranslationKeys {
  // Navigation
  'nav.dashboard': string;
  'nav.products': string;
  'nav.orders': string;
  'nav.profile': string;
  'nav.logout': string;
  'nav.home': string;
  'nav.supermarkets': string;
  'nav.myOrders': string;
  'nav.ecoPoints': string;
  'nav.add': string;

  // Authentication
  'auth.login': string;
  'auth.register': string;
  'auth.email': string;
  'auth.password': string;
  'auth.confirmPassword': string;
  'auth.forgotPassword': string;
  'auth.resetPassword': string;
  'auth.newPassword': string;
  'auth.rememberMe': string;
  'auth.dontHaveAccount': string;
  'auth.alreadyHaveAccount': string;
  'auth.loginSuccess': string;
  'auth.loginError': string;
  'auth.registerSuccess': string;
  'auth.registerError': string;
  'auth.invalidCredentials': string;
  'auth.emailRequired': string;
  'auth.passwordRequired': string;
  'auth.passwordMinLength': string;
  'auth.passwordMismatch': string;
  'auth.noAccount': string;
  'auth.loginReplit': string;

  // Staff Authentication
  'staff.login': string;
  'staff.register': string;
  'staff.companyName': string;
  'staff.phone': string;
  'staff.address': string;
  'staff.forgotPassword': string;
  'staff.resetPassword': string;
  'staff.backToLogin': string;

  // Customer Authentication
  'customer.register': string;
  'customer.cpf': string;
  'customer.fullName': string;
  'customer.phone': string;
  'customer.forgotPassword': string;
  'customer.resetPassword': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.welcome': string;
  'dashboard.stats.products': string;
  'dashboard.stats.orders': string;
  'dashboard.stats.revenue': string;
  'dashboard.quickActions': string;
  'dashboard.addProduct': string;
  'dashboard.addProductDesc': string;
  'dashboard.manageProducts': string;
  'dashboard.manageProductsDesc': string;
  'dashboard.monthlyReport': string;
  'dashboard.monthlyReportDesc': string;
  'dashboard.recentActivity': string;
  'dashboard.systemInitialized': string;
  'dashboard.systemReady': string;

  // Header
  'header.staffPanel': string;

  // Products
  'products.title': string;
  'products.addProduct': string;
  'products.name': string;
  'products.description': string;
  'products.category': string;
  'products.originalPrice': string;
  'products.discountPrice': string;
  'products.quantity': string;
  'products.expirationDate': string;
  'products.imageUrl': string;
  'products.active': string;
  'products.inactive': string;
  'products.save': string;
  'products.cancel': string;
  'products.edit': string;
  'products.delete': string;
  'products.filter': string;
  'products.all': string;
  'products.search': string;
  'products.addSuccess': string;
  'products.addError': string;
  'products.updateSuccess': string;
  'products.updateError': string;
  'products.deleteSuccess': string;
  'products.deleteError': string;
  'products.searchPlaceholder': string;
  'products.noProducts': string;
  'products.loading': string;

  // Orders
  'orders.title': string;
  'orders.orderId': string;
  'orders.customer': string;
  'orders.status': string;
  'orders.total': string;
  'orders.date': string;
  'orders.items': string;
  'orders.updateStatus': string;
  'orders.pending': string;
  'orders.processing': string;
  'orders.completed': string;
  'orders.cancelled': string;
  'orders.noOrders': string;
  'orders.orderDetails': string;

  // Eco Points
  'eco.points': string;
  'eco.totalActions': string;
  'eco.earnedPoints': string;
  'eco.recentActions': string;
  'eco.rules.title': string;
  'eco.rules.nearExpiry': string;
  'eco.rules.organic': string;
  'eco.rules.local': string;
  'eco.rules.seasonal': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.confirm': string;
  'common.cancel': string;
  'common.save': string;
  'common.edit': string;
  'common.delete': string;
  'common.add': string;
  'common.update': string;
  'common.view': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.search': string;
  'common.filter': string;
  'common.clear': string;
  'common.close': string;
  'common.yes': string;
  'common.no': string;
  'common.submit': string;
  'common.or': string;
  'common.backToHome': string;

  // Landing Page
  'landing.title': string;
  'landing.subtitle': string;
  'landing.customerButton': string;
  'landing.staffButton': string;
  'landing.footer': string;
  'landing.features': string;

  // Messages
  'messages.emailSent': string;
  'messages.passwordReset': string;
  'messages.dataUpdated': string;
  'messages.operationFailed': string;
  'messages.unauthorized': string;
  'messages.sessionExpired': string;
  'messages.networkError': string;
}

export const translations: Record<Language, TranslationKeys> = {
  'pt-BR': {
    // Navigation
    'nav.dashboard': 'Painel',
    'nav.products': 'Produtos',
    'nav.orders': 'Pedidos',
    'nav.profile': 'Perfil',
    'nav.logout': 'Sair',
    'nav.home': 'Início',
    'nav.supermarkets': 'Supermercados',
    'nav.myOrders': 'Meus Pedidos',
    'nav.ecoPoints': 'Eco Pontos',
    'nav.add': 'Adicionar',

    // Authentication
    'auth.login': 'Entrar',
    'auth.register': 'Cadastrar',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.confirmPassword': 'Confirmar Senha',
    'auth.forgotPassword': 'Esqueci minha senha',
    'auth.resetPassword': 'Redefinir Senha',
    'auth.newPassword': 'Nova Senha',
    'auth.rememberMe': 'Lembrar de mim',
    'auth.dontHaveAccount': 'Não tem uma conta?',
    'auth.alreadyHaveAccount': 'Já tem uma conta?',
    'auth.loginSuccess': 'Login realizado com sucesso',
    'auth.loginError': 'Erro ao fazer login',
    'auth.registerSuccess': 'Cadastro realizado com sucesso',
    'auth.registerError': 'Erro ao fazer cadastro',
    'auth.invalidCredentials': 'Email ou senha incorretos',
    'auth.emailRequired': 'Email é obrigatório',
    'auth.passwordRequired': 'Senha é obrigatória',
    'auth.passwordMinLength': 'A senha deve ter pelo menos 6 caracteres',
    'auth.passwordMismatch': 'As senhas não coincidem',
    'auth.noAccount': 'Não tem conta?',
    'auth.loginReplit': 'Login com Replit (Temporário)',

    // Staff Authentication
    'staff.login': 'Login do Supermercado',
    'staff.register': 'Cadastro do Supermercado',
    'staff.companyName': 'Nome da Empresa',
    'staff.phone': 'Telefone',
    'staff.address': 'Endereço',
    'staff.forgotPassword': 'Esqueci minha senha',
    'staff.resetPassword': 'Redefinir Senha',
    'staff.backToLogin': 'Voltar ao Login',

    // Customer Authentication
    'customer.register': 'Cadastro do Cliente',
    'customer.cpf': 'CPF',
    'customer.fullName': 'Nome Completo',
    'customer.phone': 'Telefone',
    'customer.forgotPassword': 'Esqueci minha senha',
    'customer.resetPassword': 'Redefinir Senha',

    // Dashboard
    'dashboard.title': 'Painel de Controle',
    'dashboard.welcome': 'Bem-vindo',
    'dashboard.stats.products': 'Produtos Ativos',
    'dashboard.stats.orders': 'Pedidos Pendentes',
    'dashboard.stats.revenue': 'Receita Total',
    'dashboard.quickActions': 'Ações Rápidas',
    'dashboard.addProduct': 'Adicionar Produto com Desconto',
    'dashboard.addProductDesc': 'Adicionar itens próximos ao vencimento',
    'dashboard.manageProducts': 'Gerenciar Produtos',
    'dashboard.manageProductsDesc': 'Visualizar e editar lista de produtos',
    'dashboard.monthlyReport': 'Resumo Mensal',
    'dashboard.monthlyReportDesc': 'Pedidos concluídos organizados por mês',
    'dashboard.recentActivity': 'Atividade Recente',
    'dashboard.systemInitialized': 'Sistema inicializado',
    'dashboard.systemReady': 'Pronto para gerenciar produtos e pedidos',

    // Header
    'header.staffPanel': 'Painel da Equipe',

    // Products
    'products.title': 'Produtos',
    'products.addProduct': 'Adicionar Produto',
    'products.name': 'Nome',
    'products.description': 'Descrição',
    'products.category': 'Categoria',
    'products.originalPrice': 'Preço Original',
    'products.discountPrice': 'Preço com Desconto',
    'products.quantity': 'Quantidade',
    'products.expirationDate': 'Data de Vencimento',
    'products.imageUrl': 'URL da Imagem',
    'products.active': 'Ativo',
    'products.inactive': 'Inativo',
    'products.save': 'Salvar',
    'products.cancel': 'Cancelar',
    'products.edit': 'Editar',
    'products.delete': 'Excluir',
    'products.filter': 'Filtrar',
    'products.all': 'Todos',
    'products.search': 'Buscar',
    'products.addSuccess': 'Produto adicionado com sucesso',
    'products.addError': 'Erro ao adicionar produto',
    'products.updateSuccess': 'Produto atualizado com sucesso',
    'products.updateError': 'Erro ao atualizar produto',
    'products.deleteSuccess': 'Produto excluído com sucesso',
    'products.deleteError': 'Erro ao excluir produto',
    'products.searchPlaceholder': 'Buscar produtos...',
    'products.noProducts': 'Nenhum produto encontrado',
    'products.loading': 'Carregando produtos...',

    // Orders
    'orders.title': 'Pedidos',
    'orders.orderId': 'ID do Pedido',
    'orders.customer': 'Cliente',
    'orders.status': 'Status',
    'orders.total': 'Total',
    'orders.date': 'Data',
    'orders.items': 'Itens',
    'orders.updateStatus': 'Atualizar Status',
    'orders.pending': 'Pendente',
    'orders.processing': 'Processando',
    'orders.completed': 'Concluído',
    'orders.cancelled': 'Cancelado',
    'orders.noOrders': 'Nenhum pedido encontrado',
    'orders.orderDetails': 'Detalhes do Pedido',

    // Eco Points
    'eco.points': 'Eco Pontos',
    'eco.totalActions': 'Total de Ações',
    'eco.earnedPoints': 'Pontos Ganhos',
    'eco.recentActions': 'Ações Recentes',
    'eco.rules.title': 'Como Ganhar Pontos',
    'eco.rules.nearExpiry': 'Produtos próximos ao vencimento',
    'eco.rules.organic': 'Produtos orgânicos',
    'eco.rules.local': 'Produtos locais',
    'eco.rules.seasonal': 'Produtos sazonais',

    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.confirm': 'Confirmar',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.add': 'Adicionar',
    'common.update': 'Atualizar',
    'common.view': 'Visualizar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpar',
    'common.close': 'Fechar',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.submit': 'Enviar',
    'common.or': 'ou',
    'common.backToHome': 'Voltar ao início',

    // Landing Page
    'landing.title': 'EcoMart',
    'landing.subtitle': 'By Up Brasil',
    'landing.customerButton': 'Cliente - Consumidor',
    'landing.staffButton': 'Staff do Supermercado',
    'landing.footer': 'Menos desperdício, mais valor. Uma iniciativa sustentável da UP Brasil',
    'landing.features': 'Zero Desperdício • Recompensas Eco • 100% Sustentável',

    // Messages
    'messages.emailSent': 'Email enviado com sucesso',
    'messages.passwordReset': 'Senha redefinida com sucesso',
    'messages.dataUpdated': 'Dados atualizados com sucesso',
    'messages.operationFailed': 'Operação falhou',
    'messages.unauthorized': 'Não autorizado',
    'messages.sessionExpired': 'Sessão expirada',
    'messages.networkError': 'Erro de rede',
  },

  'en-US': {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Products',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.home': 'Home',
    'nav.supermarkets': 'Supermarkets',
    'nav.myOrders': 'My Orders',
    'nav.ecoPoints': 'Eco Points',
    'nav.add': 'Add',

    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password',
    'auth.resetPassword': 'Reset Password',
    'auth.newPassword': 'New Password',
    'auth.rememberMe': 'Remember Me',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.loginSuccess': 'Login successful',
    'auth.loginError': 'Login error',
    'auth.registerSuccess': 'Registration successful',
    'auth.registerError': 'Registration error',
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailRequired': 'Email is required',
    'auth.passwordRequired': 'Password is required',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.noAccount': "Don't have an account?",
    'auth.loginReplit': 'Login with Replit (Temporary)',

    // Staff Authentication
    'staff.login': 'Supermarket Login',
    'staff.register': 'Supermarket Registration',
    'staff.companyName': 'Company Name',
    'staff.phone': 'Phone',
    'staff.address': 'Address',
    'staff.forgotPassword': 'Forgot Password',
    'staff.resetPassword': 'Reset Password',
    'staff.backToLogin': 'Back to Login',

    // Customer Authentication
    'customer.register': 'Customer Registration',
    'customer.cpf': 'CPF',
    'customer.fullName': 'Full Name',
    'customer.phone': 'Phone',
    'customer.forgotPassword': 'Forgot Password',
    'customer.resetPassword': 'Reset Password',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.stats.products': 'Active Products',
    'dashboard.stats.orders': 'Pending Orders',
    'dashboard.stats.revenue': 'Total Revenue',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.addProduct': 'Add Discounted Product',
    'dashboard.addProductDesc': 'Add items close to expiration',
    'dashboard.manageProducts': 'Manage Products',
    'dashboard.manageProductsDesc': 'View and edit product list',
    'dashboard.monthlyReport': 'Monthly Summary',
    'dashboard.monthlyReportDesc': 'Completed orders organized by month',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.systemInitialized': 'System initialized',
    'dashboard.systemReady': 'Ready to manage products and orders',

    // Header
    'header.staffPanel': 'Staff Panel',

    // Products
    'products.title': 'Products',
    'products.addProduct': 'Add Product',
    'products.name': 'Name',
    'products.description': 'Description',
    'products.category': 'Category',
    'products.originalPrice': 'Original Price',
    'products.discountPrice': 'Discount Price',
    'products.quantity': 'Quantity',
    'products.expirationDate': 'Expiration Date',
    'products.imageUrl': 'Image URL',
    'products.active': 'Active',
    'products.inactive': 'Inactive',
    'products.save': 'Save',
    'products.cancel': 'Cancel',
    'products.edit': 'Edit',
    'products.delete': 'Delete',
    'products.filter': 'Filter',
    'products.all': 'All',
    'products.search': 'Search',
    'products.addSuccess': 'Product added successfully',
    'products.addError': 'Error adding product',
    'products.updateSuccess': 'Product updated successfully',
    'products.updateError': 'Error updating product',
    'products.deleteSuccess': 'Product deleted successfully',
    'products.deleteError': 'Error deleting product',
    'products.searchPlaceholder': 'Search products...',
    'products.noProducts': 'No products found',
    'products.loading': 'Loading products...',

    // Orders
    'orders.title': 'Orders',
    'orders.orderId': 'Order ID',
    'orders.customer': 'Customer',
    'orders.status': 'Status',
    'orders.total': 'Total',
    'orders.date': 'Date',
    'orders.items': 'Items',
    'orders.updateStatus': 'Update Status',
    'orders.pending': 'Pending',
    'orders.processing': 'Processing',
    'orders.completed': 'Completed',
    'orders.cancelled': 'Cancelled',
    'orders.noOrders': 'No orders found',
    'orders.orderDetails': 'Order Details',

    // Eco Points
    'eco.points': 'Eco Points',
    'eco.totalActions': 'Total Actions',
    'eco.earnedPoints': 'Points Earned',
    'eco.recentActions': 'Recent Actions',
    'eco.rules.title': 'How to Earn Points',
    'eco.rules.nearExpiry': 'Products near expiration',
    'eco.rules.organic': 'Organic products',
    'eco.rules.local': 'Local products',
    'eco.rules.seasonal': 'Seasonal products',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.submit': 'Submit',
    'common.or': 'or',
    'common.backToHome': 'Back to Home',

    // Landing Page
    'landing.title': 'EcoMart',
    'landing.subtitle': 'By Up Brasil',
    'landing.customerButton': 'Customer - Consumer',
    'landing.staffButton': 'Supermarket Staff',
    'landing.footer': 'Less waste, more value. A sustainable initiative by UP Brasil',
    'landing.features': 'Zero Waste • Eco Rewards • 100% Sustainable',

    // Messages
    'messages.emailSent': 'Email sent successfully',
    'messages.passwordReset': 'Password reset successfully',
    'messages.dataUpdated': 'Data updated successfully',
    'messages.operationFailed': 'Operation failed',
    'messages.unauthorized': 'Unauthorized',
    'messages.sessionExpired': 'Session expired',
    'messages.networkError': 'Network error',
  },
};

export function getTranslation(key: keyof TranslationKeys, language: Language = 'pt-BR'): string {
  return translations[language][key] || translations['pt-BR'][key] || key;
}

export function getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
  return [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  ];
}
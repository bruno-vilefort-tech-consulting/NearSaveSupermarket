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
  'auth.emailPlaceholder': string;
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
  'auth.registerSuccessDescription': string;
  'auth.registerError': string;
  'auth.registerErrorDescription': string;
  'auth.invalidCredentials': string;
  'auth.emailRequired': string;
  'auth.passwordRequired': string;
  'auth.passwordMinLength': string;
  'auth.passwordMismatch': string;
  'auth.noAccount': string;
  'auth.loginReplit': string;
  'auth.unauthorized': string;
  'auth.sessionExpired': string;
  'auth.loginRedirect': string;
  'auth.emailSentSuccess': string;
  'auth.emailSentDesc': string;
  'auth.emailSentError': string;
  'auth.emailRequiredDesc': string;
  'auth.forgotPasswordTitle': string;
  'auth.forgotPasswordDescription': string;
  'auth.sendEmail': string;
  'auth.sending': string;
  'auth.sendInstructions': string;
  'auth.backToLogin': string;
  'auth.recoverySubtitle': string;

  // Staff Registration
  'staff.newRegistration': string;
  'staff.partnerRegistration': string;
  'staff.registerSupermarket': string;
  'staff.companyName': string;
  'staff.companyPlaceholder': string;
  'staff.phone': string;
  'staff.phonePlaceholder': string;
  'staff.address': string;
  'staff.addressPlaceholder': string;
  'staff.passwordMin': string;
  'staff.confirmPassword': string;
  'staff.confirmPasswordPlaceholder': string;
  'staff.registering': string;
  'staff.registerButton': string;
  'staff.alreadyHaveAccount': string;
  'staff.doLogin': string;
  'staff.agreementText': string;
  'staff.registrationSuccess': string;
  'staff.welcomeRegistration': string;
  'staff.registrationError': string;
  'staff.registrationErrorDesc': string;
  'staff.requiredFields': string;
  'staff.fillAllFields': string;
  'staff.passwordMismatch': string;
  'staff.checkPasswords': string;
  'staff.passwordTooShort': string;
  'staff.passwordMinDesc': string;
  'auth.passwordResetSuccess': string;
  'auth.passwordResetSuccessDesc': string;
  'auth.passwordResetError': string;

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
  'customer.registerSubtitle': string;
  'customer.cpf': string;
  'customer.fullName': string;
  'customer.fullNamePlaceholder': string;
  'customer.phone': string;
  'customer.forgotPassword': string;
  'customer.resetPassword': string;
  'customer.acceptTerms': string;
  'customer.alreadyHaveAccount': string;
  'customer.backToHome': string;
  'customer.registering': string;

  // Customer Home
  'customer.loading': string;
  'customer.loadingSupermarkets': string;
  'customer.hello': string;
  'customer.cart': string;
  'customer.logout': string;
  'customer.menu': string;
  'customer.ecoPointsProgram': string;
  'customer.youHave': string;
  'customer.points': string;
  'customer.sustainablePurchases': string;
  'customer.learnMore': string;
  'customer.supermarketsWithOffers': string;
  'customer.findBestDiscounts': string;
  'customer.searchSupermarkets': string;
  'customer.noSupermarketsFound': string;
  'customer.tryAnotherSearch': string;
  'customer.noSupermarketsAvailable': string;
  'customer.productsOnSale': string;
  'customer.available': string;
  'customer.viewProducts': string;
  'customer.ecoPointsFooter': string;
  'customer.earnPointsHelp': string;
  'customer.pointsAvailable': string;
  'customer.purchaseHistory': string;
  'customer.empty': string;
  'customer.items': string;
  'customer.logoutAction': string;
  
  // PIX Payment translations
  'payment.pixTitle': string;
  'payment.pixInstructions': string;
  'payment.pixCode': string;
  'payment.copyCode': string;
  'payment.codeCopied': string;
  'payment.paymentConfirmation': string;
  'payment.orderTotal': string;
  'payment.paymentMethod': string;
  'payment.pixPayment': string;
  'payment.checkingPayment': string;
  'payment.paymentApproved': string;
  'payment.paymentPending': string;
  'payment.paymentRejected': string;
  'payment.paymentExpired': string;
  'payment.scanQrCode': string;
  'payment.orCopyCode': string;
  'payment.paymentStatus': string;
  'payment.processingPayment': string;
  'customer.addToCart': string;
  'customer.productAdded': string;
  'customer.productAddedDescription': string;

  // Cart
  'cart.title': string;
  'cart.empty': string;
  'cart.emptyDescription': string;
  'cart.continueShopping': string;
  'cart.supermarkets': string;
  'cart.validUntil': string;
  'cart.customerData': string;
  'cart.deliveryMethod': string;
  'cart.pickupFree': string;
  'cart.deliveryFee': string;
  'cart.deliveryAddress': string;
  'cart.deliveryAddressPlaceholder': string;
  'cart.orderSummary': string;
  'cart.subtotal': string;
  'cart.savings': string;
  'cart.delivery': string;
  'cart.total': string;
  'cart.finishOrder': string;
  'cart.processing': string;
  'cart.orderSuccess': string;
  'cart.orderSuccessDescription': string;
  'cart.orderError': string;
  'cart.orderErrorDescription': string;
  'cart.addressRequired': string;
  'cart.addressRequiredDescription': string;

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
  'products.noProductsFound': string;
  'products.adjustFilters': string;
  'products.noProductsAvailable': string;
  'products.stock': string;

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

  // Monthly Orders
  'monthly.title': string;
  'monthly.totalOrders': string;
  'monthly.totalRevenue': string;
  'monthly.completedOrders': string;
  'monthly.totalReceived': string;
  'monthly.noOrdersTitle': string;
  'monthly.noOrdersMessage': string;
  'monthly.ordersCount': string;
  'monthly.errorLoadingTitle': string;
  'monthly.errorLoadingMessage': string;
  'monthly.totalRevenueLabel': string;
  'monthly.completedOrdersLabel': string;
  'monthly.noOrdersFoundTitle': string;
  'monthly.noOrdersFoundMessage': string;

  // Month names
  'month.january': string;
  'month.february': string;
  'month.march': string;
  'month.april': string;
  'month.may': string;
  'month.june': string;
  'month.july': string;
  'month.august': string;
  'month.september': string;
  'month.october': string;
  'month.november': string;
  'month.december': string;

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
  'common.of': string;
  'common.backToHome': string;
  'common.tryAgain': string;

  // Landing Page
  'landing.title': string;
  'landing.subtitle': string;
  'landing.customerButton': string;
  'landing.staffButton': string;
  'landing.footer': string;
  'landing.features': string;

  // Validation
  'validation.productNameRequired': string;
  'validation.categoryRequired': string;
  'validation.originalPriceRequired': string;
  'validation.discountPriceRequired': string;
  'validation.quantityRequired': string;
  'validation.expirationDateRequired': string;
  'validation.cpfMinLength': string;
  'validation.cpfInvalid': string;
  'validation.cpfFormat': string;
  'validation.nameMinLength': string;
  'validation.nameTooLong': string;
  'validation.phoneMinLength': string;
  'validation.phoneInvalid': string;
  'validation.emailInvalid': string;
  'validation.passwordMinLength': string;
  'validation.passwordTooLong': string;
  'validation.acceptTerms': string;
  'validation.passwordMismatch': string;

  // Add to Cart Modal
  'addToCartModal.title': string;
  'addToCartModal.description': string;
  'addToCartModal.expiresOn': string;
  'addToCartModal.available': string;
  'addToCartModal.quantity': string;
  'addToCartModal.subtotalPrefix': string;
  'addToCartModal.totalSavings': string;
  'addToCartModal.ecoPointsEarned': string;
  'addToCartModal.cancel': string;
  'addToCartModal.addToCart': string;
  'addToCartModal.outOfStock': string;

  // Product form
  'product.addTitle': string;
  'product.addSubtitle': string;
  'product.photo': string;
  'product.takePhoto': string;
  'product.uploadImage': string;
  'product.remove': string;
  'product.name': string;
  'product.namePlaceholder': string;
  'product.category': string;
  'product.categoryPlaceholder': string;
  'product.description': string;
  'product.descriptionPlaceholder': string;
  'product.originalPrice': string;
  'product.discountPrice': string;
  'product.expirationDate': string;
  'product.quantity': string;
  'product.cancel': string;
  'product.adding': string;
  'product.addButton': string;
  'product.successTitle': string;
  'product.successMessage': string;
  'product.errorTitle': string;
  'product.errorMessage': string;

  // Categories
  'category.bakery': string;
  'category.dairy': string;
  'category.meat': string;
  'category.produce': string;
  'category.deli': string;

  // Payment
  'payment.title': string;
  'payment.backToCart': string;
  'payment.orderSummary': string;
  'payment.subtotal': string;
  'payment.discount': string;
  'payment.total': string;
  'payment.paymentMethod': string;
  'payment.pix': string;
  'payment.pixDescription': string;
  'payment.card': string;
  'payment.cardDescription': string;
  'payment.pixTitle': string;
  'payment.pixInstructions': string;
  'payment.pixCodeLabel': string;
  'payment.copyCode': string;
  'payment.codeCopied': string;
  'payment.securePayment': string;
  'payment.paymentConfirmation': string;
  'payment.cardDetails': string;
  'payment.cardNumber': string;
  'payment.cardNumberPlaceholder': string;
  'payment.cardHolder': string;
  'payment.cardHolderPlaceholder': string;
  'payment.expiryDate': string;
  'payment.expiryPlaceholder': string;
  'payment.cvv': string;
  'payment.cvvPlaceholder': string;
  'payment.completePayment': string;
  'payment.processing': string;
  'payment.paymentSuccess': string;
  'payment.orderCreated': string;
  'payment.orderNumber': string;
  'payment.backToHome': string;
  'payment.incompleteData': string;
  'payment.fillAllFields': string;
  'payment.paymentError': string;
  'payment.tryAgain': string;

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
    'auth.emailPlaceholder': 'seu@email.com',
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
    'auth.registerSuccess': 'Cadastro realizado com sucesso!',
    'auth.registerSuccessDescription': 'Sua conta foi criada. Faça login para continuar.',
    'auth.registerError': 'Erro no cadastro',
    'auth.registerErrorDescription': 'Verifique os dados e tente novamente',
    'auth.invalidCredentials': 'Email ou senha incorretos',
    'auth.emailRequired': 'Email é obrigatório',
    'auth.passwordRequired': 'Senha é obrigatória',
    'auth.passwordMinLength': 'A senha deve ter pelo menos 6 caracteres',
    'auth.passwordMismatch': 'As senhas não coincidem',
    'auth.noAccount': 'Não tem conta?',
    'auth.loginReplit': 'Login com Replit (Temporário)',
    'auth.unauthorized': 'Não autorizado',
    'auth.sessionExpired': 'Você foi desconectado. Fazendo login novamente...',
    'auth.loginRedirect': 'Você precisa estar logado como staff. Redirecionando...',
    'auth.emailSentSuccess': 'Email enviado!',
    'auth.emailSentDesc': 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
    'auth.emailSentError': 'Ocorreu um erro ao enviar o email. Tente novamente.',
    'auth.emailRequiredDesc': 'Por favor, digite seu email.',
    'auth.forgotPasswordTitle': 'Esqueci Minha Senha',
    'auth.forgotPasswordDescription': 'Digite seu email para receber instruções de redefinição de senha',
    'auth.sendEmail': 'Enviar Email',
    'auth.sending': 'Enviando...',
    'auth.sendInstructions': 'Enviar instruções',
    'auth.backToLogin': 'Voltar para o login',
    'auth.recoverySubtitle': 'Recuperação de senha',

    // Staff Registration
    'staff.newRegistration': 'Novo Cadastro',
    'staff.partnerRegistration': 'Cadastro de novo supermercado parceiro',
    'staff.registerSupermarket': 'Registre seu supermercado na plataforma',
    'staff.companyName': 'Nome Fantasia',
    'staff.companyPlaceholder': 'Ex: Supermercado Central',
    'staff.phone': 'Telefone',
    'staff.phonePlaceholder': '(11) 99999-9999',
    'staff.address': 'Endereço',
    'staff.addressPlaceholder': 'Rua, número, bairro, cidade',
    'staff.passwordMin': 'Mínimo 6 caracteres',
    'staff.confirmPassword': 'Confirmar Senha',
    'staff.confirmPasswordPlaceholder': 'Digite a senha novamente',
    'staff.registering': 'Cadastrando...',
    'staff.registerButton': 'Cadastrar Supermercado',
    'staff.alreadyHaveAccount': 'Já tem conta?',
    'staff.doLogin': 'Fazer Login',
    'staff.agreementText': 'Ao se cadastrar, você concorda com nossos termos de uso',
    'staff.registrationSuccess': 'Cadastro realizado com sucesso!',
    'staff.welcomeRegistration': 'Agora você pode fazer login.',
    'staff.registrationError': 'Erro no cadastro',
    'staff.registrationErrorDesc': 'Não foi possível criar a conta',
    'staff.requiredFields': 'Campos obrigatórios',
    'staff.fillAllFields': 'Por favor, preencha todos os campos obrigatórios',
    'staff.passwordMismatch': 'Senhas não conferem',
    'staff.checkPasswords': 'Por favor, verifique se as senhas são iguais',
    'staff.passwordTooShort': 'Senha muito curta',
    'staff.passwordMinDesc': 'A senha deve ter pelo menos 6 caracteres',
    'auth.passwordResetSuccess': 'Senha redefinida!',
    'auth.passwordResetSuccessDesc': 'Sua senha foi redefinida com sucesso. Faça login com sua nova senha.',
    'auth.passwordResetError': 'Erro ao redefinir senha. O link pode ter expirado ou ser inválido.',

    // Staff Authentication
    'staff.login': 'Login do Supermercado',
    'staff.register': 'Cadastro do Supermercado',
    'staff.forgotPassword': 'Esqueci minha senha',
    'staff.resetPassword': 'Redefinir Senha',
    'staff.backToLogin': 'Voltar ao Login',

    // Customer Authentication
    'customer.register': 'Cadastro do Cliente',
    'customer.registerSubtitle': 'Crie sua conta e comece a economizar',
    'customer.cpf': 'CPF',
    'customer.fullName': 'Nome Completo',
    'customer.fullNamePlaceholder': 'Seu nome completo',
    'customer.phone': 'Telefone',
    'customer.forgotPassword': 'Esqueci minha senha',
    'customer.resetPassword': 'Redefinir Senha',
    'customer.acceptTerms': 'Aceito os termos e condições',
    'customer.alreadyHaveAccount': 'Já tem uma conta?',
    'customer.backToHome': 'Voltar ao início',
    'customer.registering': 'Cadastrando...',

    // Customer Home
    'customer.loading': 'Carregando',
    'customer.loadingSupermarkets': 'Carregando supermercados...',
    'customer.hello': 'Olá',
    'customer.cart': 'Carrinho',
    'customer.logout': 'Sair',
    'customer.menu': 'Menu',
    'customer.ecoPointsProgram': 'Programa Pontos Eco',
    'customer.youHave': 'Você tem',
    'customer.points': 'pontos',
    'customer.sustainablePurchases': 'por suas compras sustentáveis',
    'customer.learnMore': 'Saiba mais',
    'customer.supermarketsWithOffers': 'Supermercados com ofertas',
    'customer.findBestDiscounts': 'Encontre os melhores produtos com desconto perto de você',
    'customer.searchSupermarkets': 'Buscar supermercados...',
    'customer.noSupermarketsFound': 'Nenhum supermercado encontrado',
    'customer.tryAnotherSearch': 'Tente outro termo de busca',
    'customer.noSupermarketsAvailable': 'Não há supermercados com ofertas no momento',
    'customer.productsOnSale': 'produtos em oferta',
    'customer.available': 'Disponível',
    'customer.viewProducts': 'Ver produtos',
    'customer.ecoPointsFooter': 'Pontos Eco',
    'customer.earnPointsHelp': 'Ganhe pontos comprando produtos próximos ao vencimento e ajude o meio ambiente!',
    'customer.pointsAvailable': 'pontos disponíveis',
    'customer.purchaseHistory': 'Histórico de compras',
    'customer.empty': 'Vazio',
    'customer.items': 'itens',
    'customer.logoutAction': 'Fazer logout',
    'customer.addToCart': 'Adicionar ao carrinho',
    'customer.productAdded': 'Produto adicionado!',
    'customer.productAddedDescription': 'foi adicionado ao carrinho. Você ganhará pontos eco!',

    // Cart
    'cart.title': 'Carrinho',
    'cart.empty': 'Seu carrinho está vazio',
    'cart.emptyDescription': 'Adicione produtos com desconto para continuar',
    'cart.continueShopping': 'Continuar Comprando',
    'cart.supermarkets': 'supermercados',
    'cart.validUntil': 'Válido até',
    'cart.customerData': 'Dados do Cliente',
    'cart.deliveryMethod': 'Forma de Retirada',
    'cart.pickupFree': 'Retirar no local - Grátis',
    'cart.deliveryFee': 'Entrega - R$ 5,00',
    'cart.deliveryAddress': 'Endereço para Entrega *',
    'cart.deliveryAddressPlaceholder': 'Rua, número, bairro, cidade',
    'cart.orderSummary': 'Resumo do Pedido',
    'cart.subtotal': 'Subtotal',
    'cart.savings': 'Economia',
    'cart.delivery': 'Entrega',
    'cart.total': 'Total',
    'cart.finishOrder': 'Finalizar Pedido',
    'cart.processing': 'Processando...',
    'cart.orderSuccess': 'Pedido realizado com sucesso!',
    'cart.orderSuccessDescription': 'Você receberá uma confirmação em breve.',
    'cart.orderError': 'Erro ao finalizar pedido',
    'cart.orderErrorDescription': 'Tente novamente ou entre em contato conosco.',
    'cart.addressRequired': 'Endereço obrigatório',
    'cart.addressRequiredDescription': 'Por favor, informe o endereço para entrega.',

    // Add to Cart Modal
    'addToCartModal.title': 'Adicionar ao Carrinho',
    'addToCartModal.description': 'Escolha a quantidade desejada e adicione o produto ao seu carrinho.',
    'addToCartModal.expiresOn': 'Vence em',
    'addToCartModal.available': 'disponíveis',
    'addToCartModal.quantity': 'Quantidade',
    'addToCartModal.subtotalPrefix': 'Subtotal',
    'addToCartModal.totalSavings': 'Economia total',
    'addToCartModal.ecoPointsEarned': 'Pontos eco que você ganhará',
    'addToCartModal.cancel': 'Cancelar',
    'addToCartModal.addToCart': 'Adicionar ao Carrinho',
    'addToCartModal.outOfStock': 'Sem Estoque',

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
    'products.noProductsFound': 'Nenhum produto encontrado',
    'products.adjustFilters': 'Tente ajustar os filtros de busca',
    'products.noProductsAvailable': 'Este supermercado não possui produtos em oferta no momento',
    'products.stock': 'Estoque',

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

    // Monthly Orders
    'monthly.title': 'Resumo Mensal de Pedidos',
    'monthly.totalOrders': 'Total de Pedidos',
    'monthly.totalRevenue': 'Receita Total',
    'monthly.completedOrders': 'Pedidos concluídos',
    'monthly.totalReceived': 'Valor total recebido',
    'monthly.noOrdersTitle': 'Nenhum pedido encontrado',
    'monthly.noOrdersMessage': 'Você ainda não possui pedidos concluídos.',
    'monthly.ordersCount': 'pedidos',
    'monthly.errorLoadingTitle': 'Erro ao carregar dados',
    'monthly.errorLoadingMessage': 'Não foi possível carregar o resumo mensal dos pedidos.',
    'monthly.totalRevenueLabel': 'Receita Total',
    'monthly.completedOrdersLabel': 'Pedidos concluídos',
    'monthly.noOrdersFoundTitle': 'Nenhum pedido encontrado',
    'monthly.noOrdersFoundMessage': 'Você ainda não possui pedidos concluídos.',

    // Month names
    'month.january': 'janeiro',
    'month.february': 'fevereiro',
    'month.march': 'março',
    'month.april': 'abril',
    'month.may': 'maio',
    'month.june': 'junho',
    'month.july': 'julho',
    'month.august': 'agosto',
    'month.september': 'setembro',
    'month.october': 'outubro',
    'month.november': 'novembro',
    'month.december': 'dezembro',

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
    'common.of': 'de',
    'common.backToHome': 'Voltar ao início',
    'common.tryAgain': 'Tentar novamente',

    // Landing Page
    'landing.title': 'EcoMart',
    'landing.subtitle': 'By Up Brasil',
    'landing.customerButton': 'Cliente - Consumidor',
    'landing.staffButton': 'Staff do Supermercado',
    'landing.footer': 'Menos desperdício, mais valor. Uma iniciativa sustentável da UP Brasil',
    'landing.features': 'Zero Desperdício • Recompensas Eco • 100% Sustentável',

    // Validation
    'validation.productNameRequired': 'Nome do produto é obrigatório',
    'validation.categoryRequired': 'Categoria é obrigatória',
    'validation.originalPriceRequired': 'Preço original é obrigatório',
    'validation.discountPriceRequired': 'Preço com desconto é obrigatório',
    'validation.quantityRequired': 'Quantidade é obrigatória',
    'validation.expirationDateRequired': 'Data de vencimento é obrigatória',
    'validation.cpfMinLength': 'CPF deve ter 11 dígitos',
    'validation.cpfInvalid': 'CPF inválido',
    'validation.cpfFormat': 'CPF deve conter apenas números, pontos e traços',
    'validation.nameMinLength': 'Nome deve ter pelo menos 2 caracteres',
    'validation.nameTooLong': 'Nome muito longo',
    'validation.phoneMinLength': 'Telefone deve ter pelo menos 10 dígitos',
    'validation.phoneInvalid': 'Telefone inválido',
    'validation.emailInvalid': 'Email inválido',
    'validation.passwordMinLength': 'Senha deve ter pelo menos 6 caracteres',
    'validation.passwordTooLong': 'Senha muito longa',
    'validation.acceptTerms': 'Você deve aceitar os termos e condições',
    'validation.passwordMismatch': 'Senhas não coincidem',

    // Product form
    'product.addTitle': 'Adicionar Produto com Desconto',
    'product.addSubtitle': 'Adicionar itens próximos ao vencimento com preço promocional',
    'product.photo': 'Foto do Produto',
    'product.takePhoto': 'Tirar Foto',
    'product.uploadImage': 'Enviar Imagem',
    'product.remove': 'Remover',
    'product.name': 'Nome do Produto',
    'product.namePlaceholder': 'ex.: Pão Francês Fresco',
    'product.category': 'Categoria',
    'product.categoryPlaceholder': 'Selecione a categoria',
    'product.description': 'Descrição',
    'product.descriptionPlaceholder': 'Breve descrição do produto',
    'product.originalPrice': 'Preço Original',
    'product.discountPrice': 'Preço com Desconto',
    'product.expirationDate': 'Data de Vencimento',
    'product.quantity': 'Quantidade',
    'product.cancel': 'Cancelar',
    'product.adding': 'Adicionando...',
    'product.addButton': 'Adicionar Produto',
    'product.successTitle': 'Sucesso',
    'product.successMessage': 'Produto adicionado com sucesso',
    'product.errorTitle': 'Erro',
    'product.errorMessage': 'Falha ao adicionar produto. Tente novamente.',

    // Categories
    'category.bakery': 'Padaria',
    'category.dairy': 'Laticínios',
    'category.meat': 'Carnes e Aves',
    'category.produce': 'Hortifruti',
    'category.deli': 'Frios',

    // Payment
    'payment.title': 'Finalizar Pagamento',
    'payment.backToCart': 'Voltar ao Carrinho',
    'payment.orderSummary': 'Resumo do Pedido',
    'payment.subtotal': 'Subtotal',
    'payment.discount': 'Desconto',
    'payment.total': 'Total',
    'payment.paymentMethod': 'Método de Pagamento',
    'payment.pix': 'PIX',
    'payment.pixDescription': 'Pagamento instantâneo',
    'payment.card': 'Cartão de Crédito/Débito',
    'payment.cardDescription': 'Visa, Mastercard, Elo',
    'payment.pixTitle': 'Pagamento via PIX',
    'payment.pixInstructions': 'Copie o código PIX e cole no seu aplicativo bancário',
    'payment.pixCodeLabel': 'Código PIX Copia e Cola:',
    'payment.copyCode': 'Copiar Código',
    'payment.codeCopied': 'Código copiado!',
    'payment.securePayment': 'Pagamento seguro e instantâneo',
    'payment.paymentConfirmation': 'Após o pagamento, clique em "Finalizar Pagamento" para confirmar seu pedido',
    'payment.cardDetails': 'Dados do Cartão',
    'payment.cardNumber': 'Número do cartão',
    'payment.pixCode': 'Código PIX',
    'payment.orderTotal': 'Total do Pedido',
    'payment.pixPayment': 'PIX',
    'payment.checkingPayment': 'Verificando pagamento...',
    'payment.paymentApproved': 'Pagamento aprovado!',
    'payment.paymentPending': 'Pagamento pendente',
    'payment.paymentRejected': 'Pagamento rejeitado',
    'payment.paymentExpired': 'Pagamento expirado',
    'payment.scanQrCode': 'Escaneie o QR Code',
    'payment.orCopyCode': 'ou copie o código',
    'payment.paymentStatus': 'Status do Pagamento',
    'payment.processingPayment': 'Processando pagamento...',
    'payment.cardNumberPlaceholder': '1234 5678 9012 3456',
    'payment.cardHolder': 'Nome no cartão',
    'payment.cardHolderPlaceholder': 'Nome como impresso no cartão',
    'payment.expiryDate': 'Data de validade',
    'payment.expiryPlaceholder': 'MM/AA',
    'payment.cvv': 'CVV',
    'payment.cvvPlaceholder': '123',
    'payment.completePayment': 'Finalizar Pagamento',
    'payment.processing': 'Processando...',
    'payment.paymentSuccess': 'Pagamento Realizado!',
    'payment.orderCreated': 'Seu pedido foi criado com sucesso!',
    'payment.orderNumber': 'Número do pedido:',
    'payment.backToHome': 'Voltar ao Início',
    'payment.incompleteData': 'Dados incompletos',
    'payment.fillAllFields': 'Preencha todos os campos do cartão.',
    'payment.paymentError': 'Erro no pagamento',
    'payment.tryAgain': 'Tente novamente em alguns instantes.',

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
    'auth.emailPlaceholder': 'your@email.com',
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
    'auth.registerSuccess': 'Registration successful!',
    'auth.registerSuccessDescription': 'Your account has been created. Please login to continue.',
    'auth.registerError': 'Registration error',
    'auth.registerErrorDescription': 'Please check your data and try again',
    'auth.invalidCredentials': 'Invalid email or password',
    'auth.emailRequired': 'Email is required',
    'auth.passwordRequired': 'Password is required',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.noAccount': "Don't have an account?",
    'auth.loginReplit': 'Login with Replit (Temporary)',
    'auth.unauthorized': 'Unauthorized',
    'auth.sessionExpired': 'You are logged out. Logging in again...',
    'auth.loginRedirect': 'You need to be logged in as staff. Redirecting...',
    'auth.emailSentSuccess': 'Email sent!',
    'auth.emailSentDesc': 'If the email is registered, you will receive instructions to reset your password.',
    'auth.emailSentError': 'An error occurred while sending the email. Please try again.',
    'auth.emailRequiredDesc': 'Please enter your email.',
    'auth.forgotPasswordTitle': 'Forgot My Password',
    'auth.forgotPasswordDescription': 'Enter your email to receive password reset instructions',
    'auth.sendEmail': 'Send Email',
    'auth.sending': 'Sending...',
    'auth.sendInstructions': 'Send instructions',
    'auth.backToLogin': 'Back to login',
    'auth.recoverySubtitle': 'Password recovery',

    // Staff Registration
    'staff.newRegistration': 'New Registration',
    'staff.partnerRegistration': 'New partner supermarket registration',
    'staff.registerSupermarket': 'Register your supermarket on the platform',
    'staff.companyName': 'Company Name',
    'staff.companyPlaceholder': 'Ex: Central Supermarket',
    'staff.phone': 'Phone',
    'staff.phonePlaceholder': '(11) 99999-9999',
    'staff.address': 'Address',
    'staff.addressPlaceholder': 'Street, number, neighborhood, city',
    'staff.passwordMin': 'Minimum 6 characters',
    'staff.confirmPassword': 'Confirm Password',
    'staff.confirmPasswordPlaceholder': 'Enter password again',
    'staff.registering': 'Registering...',
    'staff.registerButton': 'Register Supermarket',
    'staff.alreadyHaveAccount': 'Already have an account?',
    'staff.doLogin': 'Sign In',
    'staff.agreementText': 'By signing up, you agree to our terms of use',
    'staff.registrationSuccess': 'Registration completed successfully!',
    'staff.welcomeRegistration': 'Welcome! Now you can log in.',
    'staff.registrationError': 'Registration error',
    'staff.registrationErrorDesc': 'Could not create account',
    'staff.requiredFields': 'Required fields',
    'staff.fillAllFields': 'Please fill in all required fields',
    'staff.passwordMismatch': 'Passwords do not match',
    'staff.checkPasswords': 'Please verify that passwords match',
    'staff.passwordTooShort': 'Password too short',
    'staff.passwordMinDesc': 'Password must be at least 6 characters',
    'auth.passwordResetSuccess': 'Password reset!',
    'auth.passwordResetSuccessDesc': 'Your password has been reset successfully. Please login with your new password.',
    'auth.passwordResetError': 'Error resetting password. The link may have expired or be invalid.',

    // Staff Authentication
    'staff.login': 'Supermarket Login',
    'staff.register': 'Supermarket Registration',
    'staff.forgotPassword': 'Forgot Password',
    'staff.resetPassword': 'Reset Password',
    'staff.backToLogin': 'Back to Login',

    // Customer Authentication
    'customer.register': 'Customer Registration',
    'customer.registerSubtitle': 'Create your account and start saving',
    'customer.cpf': 'CPF',
    'customer.fullName': 'Full Name',
    'customer.fullNamePlaceholder': 'Your full name',
    'customer.phone': 'Phone',
    'customer.forgotPassword': 'Forgot Password',
    'customer.resetPassword': 'Reset Password',
    'customer.acceptTerms': 'I accept the terms and conditions',
    'customer.alreadyHaveAccount': 'Already have an account?',
    'customer.backToHome': 'Back to home',
    'customer.registering': 'Registering...',

    // Customer Home
    'customer.loading': 'Loading',
    'customer.loadingSupermarkets': 'Loading supermarkets...',
    'customer.hello': 'Hello',
    'customer.cart': 'Cart',
    'customer.logout': 'Logout',
    'customer.menu': 'Menu',
    'customer.ecoPointsProgram': 'Eco Points Program',
    'customer.youHave': 'You have',
    'customer.points': 'points',
    'customer.sustainablePurchases': 'for your sustainable purchases',
    'customer.learnMore': 'Learn more',
    'customer.supermarketsWithOffers': 'Supermarkets with offers',
    'customer.findBestDiscounts': 'Find the best discounted products near you',
    'customer.searchSupermarkets': 'Search supermarkets...',
    'customer.noSupermarketsFound': 'No supermarkets found',
    'customer.tryAnotherSearch': 'Try another search term',
    'customer.noSupermarketsAvailable': 'No supermarkets with offers available at the moment',
    'customer.productsOnSale': 'products on sale',
    'customer.available': 'Available',
    'customer.viewProducts': 'View products',
    'customer.ecoPointsFooter': 'Eco Points',
    'customer.earnPointsHelp': 'Earn points by buying products close to expiration and help the environment!',
    'customer.pointsAvailable': 'points available',
    'customer.purchaseHistory': 'Purchase history',
    'customer.empty': 'Empty',
    'customer.items': 'items',
    'customer.logoutAction': 'Logout',
    'customer.addToCart': 'Add to cart',
    'customer.productAdded': 'Product added!',
    'customer.productAddedDescription': 'was added to cart. You will earn eco points!',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDescription': 'Add discounted products to continue',
    'cart.continueShopping': 'Continue Shopping',
    'cart.supermarkets': 'supermarkets',
    'cart.validUntil': 'Valid until',
    'cart.customerData': 'Customer Data',
    'cart.deliveryMethod': 'Delivery Method',
    'cart.pickupFree': 'Pickup at store - Free',
    'cart.deliveryFee': 'Delivery - $5.00',
    'cart.deliveryAddress': 'Delivery Address *',
    'cart.deliveryAddressPlaceholder': 'Street, number, neighborhood, city',
    'cart.orderSummary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.savings': 'Savings',
    'cart.delivery': 'Delivery',
    'cart.total': 'Total',
    'cart.finishOrder': 'Finish Order',
    'cart.processing': 'Processing...',
    'cart.orderSuccess': 'Order placed successfully!',
    'cart.orderSuccessDescription': 'You will receive a confirmation soon.',
    'cart.orderError': 'Error finishing order',
    'cart.orderErrorDescription': 'Please try again or contact us.',
    'cart.addressRequired': 'Address required',
    'cart.addressRequiredDescription': 'Please enter the delivery address.',

    // Add to Cart Modal
    'addToCartModal.title': 'Add to Cart',
    'addToCartModal.description': 'Choose the desired quantity and add the product to your cart.',
    'addToCartModal.expiresOn': 'Expires on',
    'addToCartModal.available': 'available',
    'addToCartModal.quantity': 'Quantity',
    'addToCartModal.subtotalPrefix': 'Subtotal',
    'addToCartModal.totalSavings': 'Total savings',
    'addToCartModal.ecoPointsEarned': 'Eco points you will earn',
    'addToCartModal.cancel': 'Cancel',
    'addToCartModal.addToCart': 'Add to Cart',
    'addToCartModal.outOfStock': 'Out of Stock',

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
    'products.noProductsFound': 'No products found',
    'products.adjustFilters': 'Try adjusting your search filters',
    'products.noProductsAvailable': 'This supermarket has no products on sale at the moment',
    'products.stock': 'Stock',

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

    // Monthly Orders
    'monthly.title': 'Monthly Orders Summary',
    'monthly.totalOrders': 'Total Orders',
    'monthly.totalRevenue': 'Total Revenue',
    'monthly.completedOrders': 'Completed orders',
    'monthly.totalReceived': 'Total amount received',
    'monthly.noOrdersTitle': 'No orders found',
    'monthly.noOrdersMessage': 'You don\'t have any completed orders yet.',
    'monthly.ordersCount': 'orders',
    'monthly.errorLoadingTitle': 'Error loading data',
    'monthly.errorLoadingMessage': 'Could not load the monthly orders summary.',
    'monthly.totalRevenueLabel': 'Total Revenue',
    'monthly.completedOrdersLabel': 'Completed orders',
    'monthly.noOrdersFoundTitle': 'No orders found',
    'monthly.noOrdersFoundMessage': 'You don\'t have any completed orders yet.',

    // Month names
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',

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
    'common.of': 'of',
    'common.backToHome': 'Back to Home',
    'common.tryAgain': 'Try Again',

    // Landing Page
    'landing.title': 'EcoMart',
    'landing.subtitle': 'By Up Brasil',
    'landing.customerButton': 'Customer - Consumer',
    'landing.staffButton': 'Supermarket Staff',
    'landing.footer': 'Less waste, more value. A sustainable initiative by UP Brasil',
    'landing.features': 'Zero Waste • Eco Rewards • 100% Sustainable',

    // Validation
    'validation.productNameRequired': 'Product name is required',
    'validation.categoryRequired': 'Category is required',
    'validation.originalPriceRequired': 'Original price is required',
    'validation.discountPriceRequired': 'Discount price is required',
    'validation.quantityRequired': 'Quantity is required',
    'validation.expirationDateRequired': 'Expiration date is required',
    'validation.cpfMinLength': 'CPF must have 11 digits',
    'validation.cpfInvalid': 'Invalid CPF',
    'validation.cpfFormat': 'CPF must contain only numbers, dots and dashes',
    'validation.nameMinLength': 'Name must have at least 2 characters',
    'validation.nameTooLong': 'Name too long',
    'validation.phoneMinLength': 'Phone must have at least 10 digits',
    'validation.phoneInvalid': 'Invalid phone',
    'validation.emailInvalid': 'Invalid email',
    'validation.passwordMinLength': 'Password must have at least 6 characters',
    'validation.passwordTooLong': 'Password too long',
    'validation.acceptTerms': 'You must accept the terms and conditions',
    'validation.passwordMismatch': 'Passwords do not match',

    // Product form
    'product.addTitle': 'Add Discounted Product',
    'product.addSubtitle': 'Add items near expiration with promotional pricing',
    'product.photo': 'Product Photo',
    'product.takePhoto': 'Take Photo',
    'product.uploadImage': 'Upload Image',
    'product.remove': 'Remove',
    'product.name': 'Product Name',
    'product.namePlaceholder': 'e.g.: Fresh French Bread',
    'product.category': 'Category',
    'product.categoryPlaceholder': 'Select category',
    'product.description': 'Description',
    'product.descriptionPlaceholder': 'Brief product description',
    'product.originalPrice': 'Original Price',
    'product.discountPrice': 'Discount Price',
    'product.expirationDate': 'Expiration Date',
    'product.quantity': 'Quantity',
    'product.cancel': 'Cancel',
    'product.adding': 'Adding...',
    'product.addButton': 'Add Product',
    'product.successTitle': 'Success',
    'product.successMessage': 'Product added successfully',
    'product.errorTitle': 'Error',
    'product.errorMessage': 'Failed to add product. Please try again.',

    // Categories
    'category.bakery': 'Bakery',
    'category.dairy': 'Dairy',
    'category.meat': 'Meat & Poultry',
    'category.produce': 'Produce',
    'category.deli': 'Deli',

    // Payment
    'payment.title': 'Complete Payment',
    'payment.backToCart': 'Back to Cart',
    'payment.orderSummary': 'Order Summary',
    'payment.subtotal': 'Subtotal',
    'payment.discount': 'Discount',
    'payment.total': 'Total',
    'payment.paymentMethod': 'Payment Method',
    'payment.pix': 'PIX',
    'payment.pixDescription': 'Instant payment',
    'payment.card': 'Credit/Debit Card',
    'payment.cardDescription': 'Visa, Mastercard, Elo',
    'payment.pixTitle': 'PIX Payment',
    'payment.pixInstructions': 'Copy the PIX code and paste it into your banking app',
    'payment.pixCodeLabel': 'PIX Copy and Paste Code:',
    'payment.copyCode': 'Copy Code',
    'payment.codeCopied': 'Code copied!',
    'payment.securePayment': 'Secure and instant payment',
    'payment.paymentConfirmation': 'After payment, click "Complete Payment" to confirm your order',
    'payment.cardDetails': 'Card Details',
    'payment.cardNumber': 'Card number',
    'payment.cardNumberPlaceholder': '1234 5678 9012 3456',
    'payment.cardHolder': 'Cardholder name',
    'payment.cardHolderPlaceholder': 'Name as printed on card',
    'payment.expiryDate': 'Expiry date',
    'payment.expiryPlaceholder': 'MM/YY',
    'payment.cvv': 'CVV',
    'payment.cvvPlaceholder': '123',
    'payment.completePayment': 'Complete Payment',
    'payment.processing': 'Processing...',
    'payment.paymentSuccess': 'Payment Successful!',
    'payment.orderCreated': 'Your order has been created successfully!',
    'payment.orderNumber': 'Order number:',
    'payment.backToHome': 'Back to Home',
    'payment.incompleteData': 'Incomplete data',
    'payment.fillAllFields': 'Please fill in all card fields.',
    'payment.paymentError': 'Payment error',
    'payment.tryAgain': 'Please try again in a few moments.',
    'payment.pixCode': 'PIX Code',
    'payment.orderTotal': 'Order Total',
    'payment.pixPayment': 'PIX',
    'payment.checkingPayment': 'Checking payment...',
    'payment.paymentApproved': 'Payment approved!',
    'payment.paymentPending': 'Payment pending',
    'payment.paymentRejected': 'Payment rejected',
    'payment.paymentExpired': 'Payment expired',
    'payment.scanQrCode': 'Scan QR Code',
    'payment.orCopyCode': 'or copy the code',
    'payment.paymentStatus': 'Payment Status',
    'payment.processingPayment': 'Processing payment...',

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
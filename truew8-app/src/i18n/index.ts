export type SupportedLocale = 'pt-BR' | 'en-US';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'en-US'];

const ptBr = {
  'common.cancel': 'Cancelar',
  'common.close': 'Fechar',
  'common.continue': 'Continuar',
  'common.back': 'Voltar',
  'common.save': 'Salvar',
  'common.saving': 'Salvando...',
  'common.loading': 'Carregando...',
  'common.refresh': 'Atualizar',

  'locale.label': 'Idioma',
  'locale.pt-BR': 'Português (Brasil)',
  'locale.en-US': 'Inglês (Estados Unidos)',

  'auth.loginTitle': 'Entrar no TrueW8',
  'auth.registerTitle': 'Criar conta',
  'auth.email': 'Email',
  'auth.password': 'Senha',
  'auth.login': 'Entrar',
  'auth.register': 'Registrar',
  'auth.noAccount': 'Não tem conta? Registre-se',
  'auth.haveAccount': 'Já tem conta? Entre',
  'auth.error': 'Não foi possível autenticar. Verifique os dados.',
  'auth.errorInvalidCredentials': 'Email ou senha inválidos.',
  'auth.errorEmailExists': 'Este email já está cadastrado. Faça login.',
  'auth.errorWeakPassword': 'A senha deve ter entre 8 e 72 caracteres.',
  'auth.errorInvalidData': 'Revise os dados informados e tente novamente.',
  'auth.errorNetwork': 'Não foi possível conectar ao servidor.',
  'auth.passwordVisibility.show': 'Exibir senha',
  'auth.passwordVisibility.hide': 'Ocultar senha',

  'app.validatingSession': 'Validando sessão...',
  'app.loadingSession': 'Carregando sessão...',

  'dashboard.kicker': 'Investidor Autônomo',
  'dashboard.title': 'Dashboard',
  'dashboard.userFallback': 'Usuario',
  'dashboard.totalInvested': 'Total investido',
  'dashboard.portfolios': 'Carteiras',
  'dashboard.errorLoad': 'Não foi possível carregar suas carteiras agora.',
  'dashboard.empty': 'Nenhuma carteira encontrada.',
  'dashboard.createFirst': 'Criar minha primeira carteira',
  'dashboard.createNew': '+ Criar Nova Carteira',
  'dashboard.defaultDescription': 'Carteira sem descrição',
  'dashboard.assetsCount': '{count} ativos',
  'dashboard.createPortfolio.title': 'Nova carteira',
  'dashboard.createPortfolio.name': 'Nome da carteira',
  'dashboard.createPortfolio.placeholder': 'Ex.: Dividendos Longo Prazo',
  'dashboard.createPortfolio.creating': 'Criando...',
  'dashboard.createPortfolio.confirm': 'Criar',
  'dashboard.createPortfolio.error': 'Não foi possível criar a carteira agora.',
  'dashboard.logout': 'Sair',
  'dashboard.preferences.button': 'Perfil',
  'dashboard.preferences.title': 'Personalização',
  'dashboard.preferences.baseCurrency': 'Moeda base',
  'dashboard.preferences.tolerance': 'Tolerância (%)',
  'dashboard.preferences.allowSells': 'Permitir vendas',
  'dashboard.preferences.theme': 'Tema',
  'dashboard.preferences.theme.light': 'Claro',
  'dashboard.preferences.theme.dark': 'Escuro',
  'dashboard.preferences.loadError': 'Não foi possível carregar as preferências.',
  'dashboard.preferences.saveError': 'Não foi possível salvar as preferências.',

  'portfolio.titleFallback': 'Carteira',
  'portfolio.subtitle': '{count} ativos | {total}',
  'portfolio.editName': 'Editar nome',
  'portfolio.delete': 'Excluir carteira',
  'portfolio.close': 'Fechar',
  'portfolio.loadingHoldings': 'Carregando ativos...',
  'portfolio.rebalanceCta': 'Novo Aporte (Rebalancear)',
  'portfolio.quantity': 'Quantidade: {value}',
  'portfolio.averagePrice': 'Preço médio: {value}',
  'portfolio.brokerage': 'Corretora: {value}',
  'portfolio.empty': 'Nenhum ativo nesta carteira ainda. Adicione um ou mais ativos para fazer um aporte.',
  'portfolio.addManual': '+ Adicionar Ativo Manualmente',
  'portfolio.newAsset': 'Novo ativo',
  'portfolio.ticker': 'Ticker',
  'portfolio.quantityInput': 'Quantidade',
  'portfolio.averagePriceInput': 'Preço médio',
  'portfolio.brokerageInput': 'Corretora',
  'portfolio.formError': 'Preencha ticker, corretora, quantidade e preço médio com valores válidos.',
  'portfolio.addError': 'Não foi possível adicionar o ativo manualmente.',
  'portfolio.nameDrawerTitle': 'Editar nome da carteira',
  'portfolio.nameInput': 'Nome',
  'portfolio.namePlaceholder': 'Ex.: Ações de longo prazo',
  'portfolio.nameInvalid': 'Informe um nome válido para a carteira.',
  'portfolio.nameUpdateError': 'Não foi possível atualizar o nome da carteira agora.',
  'portfolio.deleteModalTitle': 'Excluir carteira',
  'portfolio.deleteModalMessage': 'Essa ação remove a carteira e os ativos vinculados. Você pode criar uma nova carteira a qualquer momento.',
  'portfolio.deleteModalConfirm': 'Excluir definitivamente',
  'portfolio.deleteModalBusy': 'Excluindo...',
  'portfolio.deleteError': 'Não foi possível excluir esta carteira agora.',
  'portfolio.loadError': 'Não foi possível carregar os ativos desta carteira.',

  'vault.setupTitle': 'Configurar Cofre',
  'vault.unlockTitle': 'Desbloquear Cofre',
  'vault.description': 'Seus dados financeiros são criptografados no seu dispositivo. O TrueW8 não tem acesso à sua carteira. Nós não guardamos o seu PIN. Se você o esquecer, não será possível recuperar os dados atuais da sua carteira e você precisará recomeçar do zero.',
  'vault.biometricLogin': 'Entrar com Biometria',
  'vault.biometricValidating': 'Validando biometria...',
  'vault.pinLabel': 'PIN do Cofre (6 dígitos)',
  'vault.pinConfirmLabel': 'Confirmar PIN',
  'vault.rememberLabel': 'Lembrar meu PIN neste dispositivo',
  'vault.rememberHint': 'Quando desativado, a chave fica somente em memória até fechar o app.',
  'vault.biometricLabel': 'Habilitar Biometria (FaceID/Digital)',
  'vault.biometricHint': 'A biometria autentica localmente para liberar a chave salva. O PIN continua sendo sua chave mestre.',
  'vault.processing': 'Processando...',
  'vault.createButton': 'Criar Cofre',
  'vault.unlockButton': 'Desbloquear Cofre',
  'vault.preparing': 'Preparando cofre...',
  'vault.errorBiometricFailed': 'Biometria não validada. Digite seu PIN de 6 dígitos.',
  'vault.errorInvalidPin': 'Digite um PIN numérico de 6 dígitos.',
  'vault.errorPinMismatch': 'A confirmação do PIN não confere.',
  'vault.errorValidation': 'Não foi possível validar o PIN do cofre.',

  'rebalance.step1Title': 'Passo 1: Valor do Aporte',
  'rebalance.depositInput': 'Aporte',
  'rebalance.depositPlaceholder': 'Ex.: 1000',
  'rebalance.step2Title': 'Passo 2: Percentual alvo',
  'rebalance.loadingAssets': 'Carregando ativos...',
  'rebalance.emptyAssets': 'Nenhum ativo disponível para configurar alvo.',
  'rebalance.targetTickerLabel': '{ticker} (% alvo)',
  'rebalance.totalPercent': 'Soma dos percentuais',
  'rebalance.step3Title': 'Passo 3: Boleta Inteligente',
  'rebalance.calculate': 'Calcular',
  'rebalance.calculating': 'Calculando...',
  'rebalance.quantity': 'Qtd: {value}',
  'rebalance.errorDeposit': 'O valor do aporte deve ser maior ou igual a zero.',
  'rebalance.errorDepositRequired': 'Preencha o valor do aporte para continuar.',
  'rebalance.errorTargetRequired': 'Preencha o percentual alvo de todos os ativos.',
  'rebalance.errorTargetSum': 'A soma dos percentuais alvo deve ser exatamente 100%.',
  'rebalance.errorNoAssets': 'Adicione ao menos um ativo para calcular o rebalanceamento.',
  'rebalance.errorCalc': 'Não foi possível calcular o rebalanceamento agora.',
  'rebalance.noBrokerage': 'Sem corretora',

  'confirm.cancel': 'Cancelar',
} as const;

type TranslationDictionary = Record<keyof typeof ptBr, string>;

const enUs: TranslationDictionary = {
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.loading': 'Loading...',
  'common.refresh': 'Refresh',

  'locale.label': 'Language',
  'locale.pt-BR': 'Portuguese (Brazil)',
  'locale.en-US': 'English (United States)',

  'auth.loginTitle': 'Sign in to TrueW8',
  'auth.registerTitle': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.login': 'Sign in',
  'auth.register': 'Sign up',
  'auth.noAccount': "Don't have an account? Sign up",
  'auth.haveAccount': 'Already have an account? Sign in',
  'auth.error': 'Unable to authenticate. Please review your credentials.',
  'auth.errorInvalidCredentials': 'Invalid email or password.',
  'auth.errorEmailExists': 'This email is already registered. Please sign in.',
  'auth.errorWeakPassword': 'Password must be between 8 and 72 characters.',
  'auth.errorInvalidData': 'Please review your input and try again.',
  'auth.errorNetwork': 'Unable to connect to the server.',
  'auth.passwordVisibility.show': 'Show password',
  'auth.passwordVisibility.hide': 'Hide password',

  'app.validatingSession': 'Validating session...',
  'app.loadingSession': 'Loading session...',

  'dashboard.kicker': 'Autonomous Investor',
  'dashboard.title': 'Dashboard',
  'dashboard.userFallback': 'User',
  'dashboard.totalInvested': 'Total invested',
  'dashboard.portfolios': 'Portfolios',
  'dashboard.errorLoad': 'Unable to load your portfolios right now.',
  'dashboard.empty': 'No portfolios found.',
  'dashboard.createFirst': 'Create my first portfolio',
  'dashboard.createNew': '+ Create New Portfolio',
  'dashboard.defaultDescription': 'Portfolio without description',
  'dashboard.assetsCount': '{count} assets',
  'dashboard.createPortfolio.title': 'New portfolio',
  'dashboard.createPortfolio.name': 'Portfolio name',
  'dashboard.createPortfolio.placeholder': 'Ex.: Long-Term Dividends',
  'dashboard.createPortfolio.creating': 'Creating...',
  'dashboard.createPortfolio.confirm': 'Create',
  'dashboard.createPortfolio.error': 'Unable to create portfolio right now.',
  'dashboard.logout': 'Sign out',
  'dashboard.preferences.button': 'Profile',
  'dashboard.preferences.title': 'Customization',
  'dashboard.preferences.baseCurrency': 'Base currency',
  'dashboard.preferences.tolerance': 'Tolerance (%)',
  'dashboard.preferences.allowSells': 'Allow sells',
  'dashboard.preferences.theme': 'Theme',
  'dashboard.preferences.theme.light': 'Light',
  'dashboard.preferences.theme.dark': 'Dark',
  'dashboard.preferences.loadError': 'Unable to load preferences.',
  'dashboard.preferences.saveError': 'Unable to save preferences.',

  'portfolio.titleFallback': 'Portfolio',
  'portfolio.subtitle': '{count} assets | {total}',
  'portfolio.editName': 'Edit name',
  'portfolio.delete': 'Delete portfolio',
  'portfolio.close': 'Close',
  'portfolio.loadingHoldings': 'Loading assets...',
  'portfolio.rebalanceCta': 'New Deposit (Rebalance)',
  'portfolio.quantity': 'Quantity: {value}',
  'portfolio.averagePrice': 'Average price: {value}',
  'portfolio.brokerage': 'Brokerage: {value}',
  'portfolio.empty': 'No assets in this portfolio yet. Add one or more assets before rebalancing.',
  'portfolio.addManual': '+ Add Asset Manually',
  'portfolio.newAsset': 'New asset',
  'portfolio.ticker': 'Ticker',
  'portfolio.quantityInput': 'Quantity',
  'portfolio.averagePriceInput': 'Average price',
  'portfolio.brokerageInput': 'Brokerage',
  'portfolio.formError': 'Provide ticker, brokerage, quantity and average price with valid values.',
  'portfolio.addError': 'Unable to add asset manually.',
  'portfolio.nameDrawerTitle': 'Edit portfolio name',
  'portfolio.nameInput': 'Name',
  'portfolio.namePlaceholder': 'Ex.: Long-term stocks',
  'portfolio.nameInvalid': 'Enter a valid portfolio name.',
  'portfolio.nameUpdateError': 'Unable to update portfolio name right now.',
  'portfolio.deleteModalTitle': 'Delete portfolio',
  'portfolio.deleteModalMessage': 'This action removes the portfolio and all linked assets. You can create a new portfolio anytime.',
  'portfolio.deleteModalConfirm': 'Delete permanently',
  'portfolio.deleteModalBusy': 'Deleting...',
  'portfolio.deleteError': 'Unable to delete this portfolio right now.',
  'portfolio.loadError': 'Unable to load this portfolio assets.',

  'vault.setupTitle': 'Set Up Vault',
  'vault.unlockTitle': 'Unlock Vault',
  'vault.description': 'Your financial data is encrypted on your device. TrueW8 cannot access your portfolio. We do not store your PIN. If you forget it, your current portfolio data cannot be recovered and you will need to start over.',
  'vault.biometricLogin': 'Sign in with biometrics',
  'vault.biometricValidating': 'Validating biometrics...',
  'vault.pinLabel': 'Vault PIN (6 digits)',
  'vault.pinConfirmLabel': 'Confirm PIN',
  'vault.rememberLabel': 'Remember my PIN on this device',
  'vault.rememberHint': 'When disabled, the key remains in memory only until the app is closed.',
  'vault.biometricLabel': 'Enable Biometrics (FaceID/Fingerprint)',
  'vault.biometricHint': 'Biometrics authenticates locally to unlock the saved key. PIN remains your master key.',
  'vault.processing': 'Processing...',
  'vault.createButton': 'Create Vault',
  'vault.unlockButton': 'Unlock Vault',
  'vault.preparing': 'Preparing vault...',
  'vault.errorBiometricFailed': 'Biometric validation failed. Enter your 6-digit PIN.',
  'vault.errorInvalidPin': 'Enter a numeric 6-digit PIN.',
  'vault.errorPinMismatch': 'PIN confirmation does not match.',
  'vault.errorValidation': 'Unable to validate vault PIN.',

  'rebalance.step1Title': 'Step 1: Deposit amount',
  'rebalance.depositInput': 'Deposit',
  'rebalance.depositPlaceholder': 'Ex.: 1000',
  'rebalance.step2Title': 'Step 2: Target percentage',
  'rebalance.loadingAssets': 'Loading assets...',
  'rebalance.emptyAssets': 'No assets available to configure target.',
  'rebalance.targetTickerLabel': '{ticker} (% target)',
  'rebalance.totalPercent': 'Percentage total',
  'rebalance.step3Title': 'Step 3: Smart order ticket',
  'rebalance.calculate': 'Calculate',
  'rebalance.calculating': 'Calculating...',
  'rebalance.quantity': 'Qty: {value}',
  'rebalance.errorDeposit': 'Deposit amount must be greater than or equal to zero.',
  'rebalance.errorDepositRequired': 'Fill in the deposit amount to continue.',
  'rebalance.errorTargetRequired': 'Fill in target percentages for all assets.',
  'rebalance.errorTargetSum': 'Target percentages must add up to exactly 100%.',
  'rebalance.errorNoAssets': 'Add at least one asset to calculate rebalance.',
  'rebalance.errorCalc': 'Unable to calculate rebalance right now.',
  'rebalance.noBrokerage': 'No brokerage',

  'confirm.cancel': 'Cancel',
};

const translations: Record<SupportedLocale, TranslationDictionary> = {
  'pt-BR': ptBr,
  'en-US': enUs,
};

export type TranslationKey = keyof typeof ptBr;

export type TranslationParams = Record<string, string | number>;

function normalize(input?: string | null): SupportedLocale {
  if (!input) {
    return 'pt-BR';
  }
  const normalized = input.toLowerCase();
  if (normalized.startsWith('pt')) {
    return 'pt-BR';
  }
  if (normalized.startsWith('en')) {
    return 'en-US';
  }
  return 'pt-BR';
}

export function resolveLocale(input?: string | null): SupportedLocale {
  return normalize(input);
}

export function detectBestLocale(options?: { browserLocale?: string | null; timezone?: string | null }): SupportedLocale {
  const byBrowser = normalize(options?.browserLocale);
  if (byBrowser !== 'pt-BR') {
    return byBrowser;
  }

  if (options?.timezone && options.timezone.startsWith('America/Sao_Paulo')) {
    return 'pt-BR';
  }

  return byBrowser;
}

export function translate(locale: SupportedLocale, key: TranslationKey, params?: TranslationParams): string {
  const template = translations[locale][key] ?? translations['pt-BR'][key] ?? key;
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value !== undefined ? String(value) : `{${token}}`;
  });
}

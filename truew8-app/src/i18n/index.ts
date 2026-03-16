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
  'locale.pt-BR': 'Portugues (Brasil)',
  'locale.en-US': 'Ingles (Estados Unidos)',

  'auth.loginTitle': 'Entrar no TrueW8',
  'auth.registerTitle': 'Criar conta',
  'auth.email': 'Email',
  'auth.password': 'Senha',
  'auth.login': 'Entrar',
  'auth.register': 'Registrar',
  'auth.noAccount': 'Nao tem conta? Registre-se',
  'auth.haveAccount': 'Ja tem conta? Entre',
  'auth.error': 'Nao foi possivel autenticar. Verifique os dados.',
  'auth.errorInvalidCredentials': 'Email ou senha invalidos.',
  'auth.errorEmailExists': 'Este email ja esta cadastrado. Faca login.',
  'auth.errorWeakPassword': 'A senha deve ter entre 8 e 72 caracteres.',
  'auth.errorInvalidData': 'Revise os dados informados e tente novamente.',
  'auth.errorNetwork': 'Nao foi possivel conectar ao servidor.',
  'auth.passwordVisibility.show': 'Exibir senha',
  'auth.passwordVisibility.hide': 'Ocultar senha',

  'app.validatingSession': 'Validando sessao...',
  'app.loadingSession': 'Carregando sessao...',

  'dashboard.kicker': 'Investidor Autonomo',
  'dashboard.title': 'Visao Consolidada',
  'dashboard.userFallback': 'Usuario',
  'dashboard.totalInvested': 'Total investido',
  'dashboard.portfolios': 'Carteiras',
  'dashboard.errorLoad': 'Nao foi possivel carregar suas carteiras agora.',
  'dashboard.empty': 'Nenhuma carteira encontrada.',
  'dashboard.createFirst': 'Criar minha primeira carteira',
  'dashboard.createNew': '+ Criar Nova Carteira',
  'dashboard.defaultDescription': 'Carteira sem descricao',
  'dashboard.assetsCount': '{count} ativos',
  'dashboard.createPortfolio.title': 'Nova carteira',
  'dashboard.createPortfolio.name': 'Nome da carteira',
  'dashboard.createPortfolio.placeholder': 'Ex.: Dividendos Longo Prazo',
  'dashboard.createPortfolio.creating': 'Criando...',
  'dashboard.createPortfolio.confirm': 'Criar',
  'dashboard.createPortfolio.error': 'Nao foi possivel criar a carteira agora.',
  'dashboard.logout': 'Sair',

  'portfolio.titleFallback': 'Carteira',
  'portfolio.subtitle': '{count} ativos | {total}',
  'portfolio.editName': 'Editar nome',
  'portfolio.delete': 'Excluir carteira',
  'portfolio.close': 'Fechar',
  'portfolio.loadingHoldings': 'Carregando ativos...',
  'portfolio.rebalanceCta': 'Novo Aporte (Rebalancear)',
  'portfolio.quantity': 'Quantidade: {value}',
  'portfolio.averagePrice': 'Preco medio: {value}',
  'portfolio.brokerage': 'Corretora: {value}',
  'portfolio.empty': 'Nenhum ativo nesta carteira ainda. Adicione um ou mais ativos para fazer um aporte.',
  'portfolio.addManual': '+ Adicionar Ativo Manualmente',
  'portfolio.newAsset': 'Novo ativo',
  'portfolio.ticker': 'Ticker',
  'portfolio.quantityInput': 'Quantidade',
  'portfolio.averagePriceInput': 'Preco medio',
  'portfolio.brokerageInput': 'Corretora',
  'portfolio.formError': 'Preencha ticker, corretora, quantidade e preco medio com valores validos.',
  'portfolio.addError': 'Nao foi possivel adicionar o ativo manualmente.',
  'portfolio.nameDrawerTitle': 'Editar nome da carteira',
  'portfolio.nameInput': 'Nome',
  'portfolio.namePlaceholder': 'Ex.: Acoes de longo prazo',
  'portfolio.nameInvalid': 'Informe um nome valido para a carteira.',
  'portfolio.nameUpdateError': 'Nao foi possivel atualizar o nome da carteira agora.',
  'portfolio.deleteModalTitle': 'Excluir carteira',
  'portfolio.deleteModalMessage': 'Essa acao remove a carteira e os ativos vinculados. Voce pode criar uma nova carteira a qualquer momento.',
  'portfolio.deleteModalConfirm': 'Excluir definitivamente',
  'portfolio.deleteModalBusy': 'Excluindo...',
  'portfolio.deleteError': 'Nao foi possivel excluir esta carteira agora.',
  'portfolio.loadError': 'Nao foi possivel carregar os ativos desta carteira.',

  'vault.setupTitle': 'Configurar Cofre',
  'vault.unlockTitle': 'Desbloquear Cofre',
  'vault.description': 'Seus dados financeiros sao criptografados no seu dispositivo. O TrueW8 nao tem acesso a sua carteira. Nos nao guardamos o seu PIN. Se voce o esquecer, nao sera possivel recuperar os dados atuais da sua carteira e voce precisara recomecar do zero.',
  'vault.biometricLogin': 'Entrar com Biometria',
  'vault.biometricValidating': 'Validando biometria...',
  'vault.pinLabel': 'PIN do Cofre (6 digitos)',
  'vault.pinConfirmLabel': 'Confirmar PIN',
  'vault.rememberLabel': 'Lembrar meu PIN neste dispositivo',
  'vault.rememberHint': 'Quando desativado, a chave fica somente em memoria ate fechar o app.',
  'vault.biometricLabel': 'Habilitar Biometria (FaceID/Digital)',
  'vault.biometricHint': 'A biometria autentica localmente para liberar a chave salva. O PIN continua sendo sua chave mestre.',
  'vault.processing': 'Processando...',
  'vault.createButton': 'Criar Cofre',
  'vault.unlockButton': 'Desbloquear Cofre',
  'vault.preparing': 'Preparando cofre...',
  'vault.errorBiometricFailed': 'Biometria nao validada. Digite seu PIN de 6 digitos.',
  'vault.errorInvalidPin': 'Digite um PIN numerico de 6 digitos.',
  'vault.errorPinMismatch': 'A confirmacao do PIN nao confere.',
  'vault.errorValidation': 'Nao foi possivel validar o PIN do cofre.',

  'rebalance.step1Title': 'Passo 1: Valor do Aporte',
  'rebalance.depositInput': 'Aporte',
  'rebalance.depositPlaceholder': 'Ex.: 1000',
  'rebalance.step2Title': 'Passo 2: Percentual alvo',
  'rebalance.loadingAssets': 'Carregando ativos...',
  'rebalance.emptyAssets': 'Nenhum ativo disponivel para configurar alvo.',
  'rebalance.targetTickerLabel': '{ticker} (% alvo)',
  'rebalance.totalPercent': 'Soma dos percentuais',
  'rebalance.step3Title': 'Passo 3: Boleta Inteligente',
  'rebalance.calculate': 'Calcular',
  'rebalance.calculating': 'Calculando...',
  'rebalance.quantity': 'Qtd: {value}',
  'rebalance.errorDeposit': 'O valor do aporte deve ser maior ou igual a zero.',
  'rebalance.errorTargetSum': 'A soma dos percentuais alvo deve ser exatamente 100%.',
  'rebalance.errorNoAssets': 'Adicione ao menos um ativo para calcular o rebalanceamento.',
  'rebalance.errorCalc': 'Nao foi possivel calcular o rebalanceamento agora.',
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
  'dashboard.title': 'Consolidated View',
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

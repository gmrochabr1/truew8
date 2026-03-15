const ptBr = {
  'rebalance.screenTitle': 'Rebalanceamento de Carteira',
  'rebalance.depositLabel': 'Novo Aporte (R$)',
  'rebalance.holdingsTitle': 'Custodia Atual',
  'rebalance.targetTitle': 'Carteira Alvo',
  'rebalance.ticker': 'Ticker',
  'rebalance.quantity': 'Qtd',
  'rebalance.price': 'Preco',
  'rebalance.percentage': 'Percentual (0-1)',
  'rebalance.addHolding': 'Adicionar Ativo',
  'rebalance.addTarget': 'Adicionar Alocacao',
  'rebalance.submit': 'Calcular Rebalanceamento',
  'rebalance.action': 'Acao',
  'rebalance.estimatedValue': 'Valor Estimado',
  'rebalance.resultsTitle': 'Boleta Inteligente',
  'rebalance.error': 'Nao foi possivel calcular o rebalanceamento.',
  'rebalance.buy': 'COMPRAR',
  'rebalance.sell': 'VENDER',
  'rebalance.hold': 'MANTER',
  'tab.rebalance': 'Rebalancear',
  'tab.secondary': 'Resumo',
} as const;

type TranslationKey = keyof typeof ptBr;

export const t = (key: TranslationKey): string => ptBr[key];

export interface Plan {
  id: string
  name: string
  price: number
  period: string
  durationDays: number
  highlight?: boolean
  features: string[]
}

export const TRIAL_RULE = {
  days: 1,
  allowedDomains: ['gmail.com', 'googlemail.com'],
  description: 'Cadastro com Gmail ganha 1 dia de acesso completo. Depois, só com plano VIP.',
}

export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Teste grátis',
    price: 0,
    period: '1 dia',
    durationDays: 1,
    features: ['Cadastro com Gmail', 'Acesso completo por 24h', 'Radar ao vivo e alertas', 'Sem cartão de crédito'],
  },
  {
    id: 'vip-mensal',
    name: 'VIP Mensal',
    price: 19.9,
    period: 'mês',
    durationDays: 30,
    features: ['Radar ao vivo com APPM e CG', 'Alertas ilimitados', 'Todas as oportunidades do dia', 'Escalações previstas'],
  },
  {
    id: 'vip-trimestral',
    name: 'VIP Trimestral',
    price: 49.9,
    period: '3 meses',
    durationDays: 90,
    highlight: true,
    features: ['Tudo do Mensal', 'Filtros personalizados do radar', 'Relatório semanal de desempenho', 'Economia de 16%'],
  },
  {
    id: 'vip-anual',
    name: 'VIP Anual',
    price: 149.9,
    period: 'ano',
    durationDays: 365,
    features: ['Tudo do Trimestral', 'Suporte prioritário', 'Acesso antecipado a novidades', 'Economia de 37%'],
  },
]

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

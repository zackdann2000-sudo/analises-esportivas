export type ApiProviderId = 'api-football' | 'football-data' | 'the-odds-api' | 'sportmonks' | 'thesportsdb' | 'custom'

export type AuthMode = 'header' | 'query' | 'bearer' | 'none'

export interface ApiProvider {
  id: ApiProviderId
  label: string
  description: string
  docsUrl: string
  keyHint: string
  feedsSite: boolean
}

export const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'api-football',
    label: 'API-Football',
    description: 'Jogos, ao vivo, lances, escalações, estatísticas, previsões e classificação.',
    docsUrl: 'https://dashboard.api-football.com',
    keyHint: 'Account → My Access',
    feedsSite: true,
  },
  {
    id: 'football-data',
    label: 'Football-Data.org',
    description: 'Jogos e resultados de competições disponíveis no plano.',
    docsUrl: 'https://www.football-data.org/client/register',
    keyHint: 'Enviada por e-mail após o cadastro',
    feedsSite: true,
  },
  {
    id: 'the-odds-api',
    label: 'The Odds API',
    description: 'Odds pré-jogo e ao vivo de várias casas.',
    docsUrl: 'https://the-odds-api.com',
    keyHint: 'Dashboard → API Key',
    feedsSite: false,
  },
  {
    id: 'sportmonks',
    label: 'SportMonks',
    description: 'Jogos, placares e dados avançados conforme o plano contratado.',
    docsUrl: 'https://my.sportmonks.com',
    keyHint: 'My Sportmonks → API Tokens',
    feedsSite: true,
  },
  {
    id: 'thesportsdb',
    label: 'TheSportsDB',
    description: 'Escudos, fotos, estádios e informações dos times.',
    docsUrl: 'https://www.thesportsdb.com/pricing',
    keyHint: 'Chave de teste pública: 3',
    feedsSite: false,
  },
  {
    id: 'custom',
    label: 'Personalizada',
    description: 'Qualquer outra API REST: informe a URL e como enviar a chave.',
    docsUrl: '',
    keyHint: 'Chave/token do seu provedor',
    feedsSite: false,
  },
]

export const providerById = (id: string) => API_PROVIDERS.find((p) => p.id === id)

export interface PublicApiConnection {
  id: string
  provider: ApiProviderId
  name: string
  masked: string
  baseUrl: string | null
  authMode: AuthMode | null
  authName: string | null
  enabled: boolean
  createdAt: string
  lastTest: { ok: boolean; message: string; at: string } | null
}

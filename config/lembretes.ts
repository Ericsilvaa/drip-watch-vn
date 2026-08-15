/**
 * Configuração de Disparos — constantes centralizadas, mesmo espírito de
 * config/dashboard.ts e config/integracao.ts. Catálogo de variáveis
 * espelha exatamente o que supabase/functions/disparo-diario/index.ts
 * (substituirVariaveis) sabe substituir — nenhuma aqui é inventada.
 */

export interface LembreteVariavel {
  chave: string
  label: string
  descricao: string
  exemplo: string
}

export const LEMBRETE_VARIAVEIS: LembreteVariavel[] = [
  { chave: '{{nome}}', label: 'Nome do cliente', descricao: 'Primeiro nome do cliente.', exemplo: 'João' },
  { chave: '{{unidade}}', label: 'Unidade', descricao: 'Nome curto da unidade.', exemplo: 'Cambeba' },
  { chave: '{{dias}}', label: 'Dias configurados', descricao: 'Dias após a compra que este lembrete usa.', exemplo: '5' },
  { chave: '{{dia_semana}}', label: 'Dia da semana', descricao: 'Dia da semana do envio.', exemplo: 'sexta-feira' },
  { chave: '{{hora}}', label: 'Horário', descricao: 'Horário configurado do lembrete.', exemplo: '09:00' },
  { chave: '{{data}}', label: 'Data do disparo', descricao: 'Data do dia do envio.', exemplo: '15/08' },
]

export const LEMBRETE_IMAGEM_TIPOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const LEMBRETE_IMAGEM_TAMANHO_MAX_MB = 5
export const LEMBRETE_IMAGEM_BUCKET = 'lembretes-imagens'

export const LEMBRETES_API_ROUTE = '/api/config/lembretes'
export const LEMBRETES_IMAGEM_API_ROUTE = '/api/config/lembretes/imagem'

/**
 * Espelha TETO_ENVIOS_POR_EXECUCAO do Edge Function — só informativo aqui
 * (pra avisar na UI), não é validado/editável neste arquivo. Se mudar lá,
 * mudar aqui também.
 */
export const TETO_SEGURANCA_GLOBAL = 15

export const DIAS_SEMANA_OPCOES = [
  { valor: 0, label: 'Dom' },
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sáb' },
] as const

/** Mesma ordem/valores de DIAS_SEMANA_PT no Edge Function — usado no preview pra bater exatamente com o que o cliente recebe. */
export const DIAS_SEMANA_LONGO = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
] as const

export const DIAS_SEMANA_TODOS = [0, 1, 2, 3, 4, 5, 6]

export const MENSAGEM_PADRAO_NOVO_LEMBRETE =
  'Oi, {{nome}}! Faz {{dias}} dias que você não aparece por aqui — que tal aproveitar e voltar essa semana?\n\nTe esperamos na Lavateria {{unidade}}!'

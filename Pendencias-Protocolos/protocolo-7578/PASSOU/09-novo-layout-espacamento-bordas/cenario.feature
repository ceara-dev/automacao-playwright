#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Aplicar espaçamento entre os dados e as bordas da página
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então há espaçamento (margem) entre os dados e as bordas da página
    E as quatro margens (superior, inferior, esquerda, direita) são maiores que 10px

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Margens > 10px em todos os lados (análise de pixels da página renderizada).
  # Evidência: pen7578-09-novo-layout-espacamento-bordas.png
  # ---------------------------------------------------------------------------

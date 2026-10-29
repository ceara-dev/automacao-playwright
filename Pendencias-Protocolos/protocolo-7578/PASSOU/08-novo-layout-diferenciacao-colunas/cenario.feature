#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Aplicar o novo padrão visual diferenciando as colunas
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado com o novo layout
    Então as colunas são visualmente diferenciadas por tons/cores
    E são detectados ao menos 2 tons distintos na análise de pixels da página

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Análise de pixels detectou ≥2 tons distintos (colunas diferenciadas). Evidência na página 1 renderizada.
  # Evidência: pen7578-08-novo-layout-diferenciacao-colunas.png
  # ---------------------------------------------------------------------------

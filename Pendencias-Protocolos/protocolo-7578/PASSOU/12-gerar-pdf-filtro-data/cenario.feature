#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF filtrando apenas por data
    Dado que o usuário filtra apenas pela Data "15/09/2026"
    Quando o usuário gera o PDF
    Então o cabeçalho exibe "Data: 15/09/2026"
    E o Total de alunos é exibido no cabeçalho

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Cabeçalho "Data: 15/09/2026 • Total de alunos: 188".
  # Evidência: pen7578-12-gerar-pdf-filtro-data.png
  # ---------------------------------------------------------------------------

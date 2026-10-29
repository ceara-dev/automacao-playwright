#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF filtrando por data e escola
    Dado que o usuário filtra pela Data "15/09/2026" e Escola "Colégio Apoio" (escola_id=1)
    Quando o usuário gera o PDF
    Então o cabeçalho exibe "Data: 15/09/2026" e "Escola: Colégio Apoio"
    E somente alunos da escola filtrada são exibidos

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Cabeçalho "Data: 15/09/2026 • Escola: Colégio Apoio". (Ambiente possui uma única escola.)
  # Evidência: pen7578-14-gerar-pdf-filtro-data-escola.png
  # ---------------------------------------------------------------------------

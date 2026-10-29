#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Desativar o endpoint legado de exportação .csv
    Dado que o endpoint legado `relatorios/notifiq/export` é chamado
    Quando a requisição é processada
    Então a resposta é 404 ou 410
    E nenhum arquivo .csv é entregue

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (vulnerabilidade). O endpoint legado ainda retorna 200 com `text/csv` (notifiq-registros-*.csv).
  # Evidência: pen7578-24-gerar-pdf-csv-legado-desativado.png
  # ---------------------------------------------------------------------------

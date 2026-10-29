#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Validar endpoint de exportação da API
    Dado que a pesquisa foi realizada com filtros válidos
    Quando a aplicação chama o endpoint `registro-entrada-saida/export`
    Então a resposta tem status 200
    E o Content-Type é "application/pdf"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Endpoint retorna 200 com Content-Type application/pdf.
  # Evidência: pen7578-18-gerar-pdf-endpoint-200.png
  # ---------------------------------------------------------------------------

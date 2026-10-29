#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Rejeitar chamada ao endpoint sem parâmetros válidos
    Dado que o usuário chama o endpoint de exportação sem data_inicio/data_fim
    Quando a requisição é processada
    Então a API rejeita a requisição com erro adequado (4xx)
    E nenhum dado de aluno é retornado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (vulnerabilidade). O endpoint retorna 200 com PDF (período padrão) mesmo sem parâmetros, expondo dados.
  # Evidência: pen7578-23-gerar-pdf-endpoint-sem-parametros.png
  # ---------------------------------------------------------------------------

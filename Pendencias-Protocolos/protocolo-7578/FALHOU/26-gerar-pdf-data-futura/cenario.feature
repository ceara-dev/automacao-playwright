#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Retornar resultado vazio para data futura
    Dado que o usuário filtra por uma data futura (ex.: 25/12/2026)
    Quando o usuário exporta o relatório
    Então o sistema retorna Total de alunos "0"
    E não exibe dados de datas não ocorridas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito). Data futura retorna "Total de alunos: 188" em vez de 0.
  # Evidência: pen7578-26-gerar-pdf-data-futura.png
  # ---------------------------------------------------------------------------

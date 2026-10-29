#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Ordenar alunos alfabeticamente desconsiderando acentos e caixa
    Dado que o usuário gera o PDF de Registro de Entrada e Saída de uma turma
    Quando os nomes são ordenados
    Então a ordenação ignora acentos e caixa (ordem alfabética real)
    E ex.: "João" deve vir antes de "José"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito). Ordenação sensível a acentos: "José Levi Neres de Sousa" aparece antes de "João Gabriel Carvalho Almeida".
  # Evidência: pen7578-16-gerar-pdf-ordenacao-alfabetica.png
  # ---------------------------------------------------------------------------

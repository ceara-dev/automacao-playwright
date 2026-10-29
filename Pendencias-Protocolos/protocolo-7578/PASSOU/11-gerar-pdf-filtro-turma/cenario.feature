#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF filtrando por turma
    Dado que o usuário filtra por Turma "6º Ano" (turma_id=1)
    Quando o usuário gera o PDF
    Então o cabeçalho exibe "Turma: 6º Ano"
    E o Total de alunos corresponde apenas à turma filtrada

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Cabeçalho "Turma: 6º Ano • Total de alunos: 20".
  # Evidência: pen7578-11-gerar-pdf-filtro-turma.png
  # ---------------------------------------------------------------------------

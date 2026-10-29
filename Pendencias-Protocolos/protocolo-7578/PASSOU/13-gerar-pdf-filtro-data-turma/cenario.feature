#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF filtrando por data e turma
    Dado que o usuário filtra pela Data "15/09/2026" e Turma "6º Ano"
    Quando o usuário gera o PDF
    Então o cabeçalho exibe "Data: 15/09/2026" e "Turma: 6º Ano"
    E somente alunos da turma filtrada são exibidos

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Cabeçalho "Data: 15/09/2026 • Turma: 6º Ano • Total de alunos: 20".
  # Evidência: pen7578-13-gerar-pdf-filtro-data-turma.png
  # ---------------------------------------------------------------------------

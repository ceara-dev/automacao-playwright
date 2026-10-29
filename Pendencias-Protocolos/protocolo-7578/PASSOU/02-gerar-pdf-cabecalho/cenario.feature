#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF com Data, Turma, Escola e Total de alunos no cabeçalho
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então o cabeçalho exibe "Data:", "Turma:", "Escola:" e "Total de alunos:"
    E a Data aparece no formato dd/mm/aaaa e a Escola como "Colégio Apoio"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Cabeçalho com os quatro campos (Data • Turma • Escola • Total de alunos).
  # Evidência: pen7578-02-gerar-pdf-cabecalho.png
  # ---------------------------------------------------------------------------

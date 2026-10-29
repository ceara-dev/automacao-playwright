#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Validar integridade entre Total de alunos e linhas do relatório
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o número de linhas de alunos é contado
    Então o número de linhas deve ser igual ao "Total de alunos" do cabeçalho
    E não deve haver alunos ausentes nem duplicados

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito). Cabeçalho informa "Total de alunos: 188", mas o PDF lista 183 alunos (5 ausentes: matrículas 101, 102, 168 e outras).
  # Evidência: pen7578-15-gerar-pdf-total-alunos-consistente.png
  # ---------------------------------------------------------------------------

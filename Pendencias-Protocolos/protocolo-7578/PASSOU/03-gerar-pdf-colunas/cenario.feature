#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF com as colunas Aluno, Matrícula, Entrada, Saída e Situação
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então as colunas "Aluno", "Matrícula", "Entrada", "Saída" e "Situação" são exibidas
    E cada aluno ocupa uma linha com seus dados nas colunas correspondentes

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Todas as colunas presentes em todas as páginas.
  # Evidência: pen7578-03-gerar-pdf-colunas.png
  # ---------------------------------------------------------------------------

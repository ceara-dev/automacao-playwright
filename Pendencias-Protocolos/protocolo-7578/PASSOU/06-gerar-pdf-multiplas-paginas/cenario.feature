#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF em múltiplas páginas mantendo as colunas
    Dado que o usuário gera o PDF de Registro de Entrada e Saída do período completo
    Quando o PDF é renderizado em múltiplas páginas
    Então todas as páginas mantêm as colunas "Aluno", "Matrícula", "Entrada", "Saída" e "Situação"
    E o rodapé de página indica "Página N de M"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. PDF com 5 páginas; colunas repetidas em todas e rodapé "-- N of 5 --".
  # Evidência: pen7578-06-gerar-pdf-multiplas-paginas.png
  # ---------------------------------------------------------------------------

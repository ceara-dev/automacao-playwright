#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Imprimir o PDF gerado em papel A4 sem cortes
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado em proporção A4
    Então a proporção da página é compatível com A4 retrato (~0,7)
    E o conteúdo é impresso sem cortes nas margens

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Proporção entre 0,6 e 0,8 e margens íntegras (pdftoppm disponível no ambiente).
  # Evidência: pen7578-10-gerar-pdf-impressao-a4.png
  # ---------------------------------------------------------------------------

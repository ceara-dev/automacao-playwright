#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF exibindo as situações Completo, Só entrada e Sem registro
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então a situação "Completo" é exibida para alunos com entrada e saída
    E as situações "Só entrada" (com saída "sem registro") e "Sem registro" são exibidas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. As três situações renderizadas corretamente.
  # Evidência: pen7578-05-gerar-pdf-situacoes.png
  # ---------------------------------------------------------------------------

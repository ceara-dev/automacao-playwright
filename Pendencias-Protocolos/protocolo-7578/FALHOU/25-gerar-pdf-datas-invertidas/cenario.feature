#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Rejeitar datas invertidas com mensagem de validação
    Dado que o usuário informa Data inicial "30/09/2026" e Data final "01/09/2026"
    Quando o usuário tenta executar a pesquisa/exportação
    Então o sistema exibe mensagem de validação do período
    E nenhum PDF com dados incorretos é gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito). A API aceita datas invertidas e retorna 200 PDF sem validação.
  # Evidência: pen7578-25-gerar-pdf-datas-invertidas.png
  # ---------------------------------------------------------------------------

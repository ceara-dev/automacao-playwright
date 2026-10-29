#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Tratar injeção de script no filtro como texto literal
    Dado que o usuário insere `<script>alert("xss")</script>` no campo de filtro
    Quando o relatório é processado/gerado
    Então o valor é tratado como texto literal
    E nenhum script é executado na visualização

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Nenhum dialog/alert disparado; o valor é tratado como texto.
  # Evidência: pen7578-22-gerar-pdf-injecao-xss.png
  # ---------------------------------------------------------------------------

#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticou e a sessão expirou durante a geração

  Cenário: Invalidar a exportação com sessão expirada
    Dado que a sessão é encerrada (cookies limpos)
    Quando o usuário tenta concluir a exportação
    Então o acesso é invalidado e o usuário é redirecionado para a tela de login
    E nenhum dado é exposto no PDF

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Sem sessão, o endpoint redireciona para /login e não entrega PDF.
  # Evidência: pen7578-21-gerar-pdf-sessao-expirada.png
  # ---------------------------------------------------------------------------

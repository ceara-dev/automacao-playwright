#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário não está autenticado

  Cenário: Negar acesso à exportação sem autenticação
    Dado que o usuário chama o endpoint de exportação sem sessão
    Quando a requisição é processada
    Então o acesso é negado (redirect para login ou 401/403)
    E nenhum dado de aluno é exposto no corpo da resposta

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Sem sessão a resposta não é PDF e não contém dados de alunos.
  # Evidência: pen7578-19-gerar-pdf-sem-autenticacao.png
  # ---------------------------------------------------------------------------

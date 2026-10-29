#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que existe um usuário com acesso restrito a uma escola (cargo Professor)

  Cenário: Restringir o PDF aos dados da escola do usuário
    Dado que o usuário restrito autentica e acessa a tela Relatórios Notifiq
    Quando o usuário tenta exportar o PDF
    Então o PDF deve conter somente os dados da escola vinculada
    E nenhum dado de outra escola deve ser exibido

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito/bloqueio). Usuário restrito (Professor, 1 escola) recebe HTTP 403 ao exportar, mesmo possuindo a permissão `relatorios.notifiq.export`. Necessária segunda escola para o contraste negativo.
  # Evidência: pen7578-20-gerar-pdf-escola-restrita.png
  # ---------------------------------------------------------------------------

#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Identificar a tabela de frequência anual
    Dado que o boletim foi gerado
    Quando o usuário visualizar a última página
    Então a tabela de frequência anual deve ter um título que a identifique

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU (corrigido na atualização). A tabela final agora tem o título "Frequência anual na turma". Obs.: na continuação (página 7) o título não é repetido.
  # Evidência: pen7614-25-titulo-da-tabela-de-frequencia-anual.png
  # ---------------------------------------------------------------------------

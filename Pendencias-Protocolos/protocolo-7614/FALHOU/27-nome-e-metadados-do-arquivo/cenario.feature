#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Nomear o arquivo e preencher os metadados do PDF
    Dado que o boletim foi gerado
    Quando o usuário baixar o arquivo
    Então o nome do arquivo deve identificar turma e ano sem repetição
    E o PDF deve ter título nos metadados

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU (persiste). Nome "boletim-3ser-m-2026-2026.pdf" (ano repetido, porque o código da turma já contém 2026); metadado Title vazio; o título "Boletim de notas — 2 alunos" não indica quando só algumas disciplinas foram escolhidas.
  # Evidência: pen7614-27-nome-e-metadados-do-arquivo.png
  # ---------------------------------------------------------------------------

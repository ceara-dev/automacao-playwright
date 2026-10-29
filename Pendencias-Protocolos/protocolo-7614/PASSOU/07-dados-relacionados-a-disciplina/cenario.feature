#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Relacionar as informações acadêmicas à disciplina correta
    Dado que cada disciplina tem lançamentos próprios de notas e aulas
    Quando o boletim for gerado
    Então as informações acadêmicas dos alunos devem ser relacionadas corretamente às respectivas disciplinas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Biologia: faltas no 1º Bimestre (aula de 01/09 lançada no 1º Bim); Física: faltas no 3º Bimestre (Giovanna, Hemilly, Ingrid, Maria Eduarda); Filosofia (sem aulas): colunas de faltas e frequência vazias. Notas de cada disciplina iguais às gravadas nos diários.
  # Evidência: pen7614-07-dados-relacionados-a-disciplina.png
  # ---------------------------------------------------------------------------

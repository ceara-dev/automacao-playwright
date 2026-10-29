#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Apresentar somente os alunos da turma
    Dado que o boletim de notas da turma 3SER-M-2026 foi gerado para todos os alunos
    Quando o usuário visualizar o PDF
    Então o boletim deve apresentar somente os alunos pertencentes àquela turma
    E a quantidade de alunos de cada disciplina deve ser igual à de matrículas da turma

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. 3ª Série: 24 alunos em cada uma das 8 disciplinas = 24 matrículas da turma. 2ª Série: 38 = 38. Nenhum aluno de outra turma.
  # Evidência: pen7614-02-somente-alunos-da-turma.png
  # ---------------------------------------------------------------------------

#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Apresentar somente as disciplinas da turma
    Dado que o boletim de notas esteja sendo gerado
    Quando o sistema identificar as disciplinas da turma
    Então devem ser apresentadas somente as disciplinas ministradas naquela turma
    E não devem ser apresentadas disciplinas que não façam parte da composição da turma

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. 3ª Série: 8 blocos (Biologia, Filosofia, Física, Geografia, Espanhol, Inglês, Química, Sociologia) = 8 diários da turma, cada um com o professor titular — os mesmos 8 listados em "Disciplinas" (modo Individual). 9º Ano: 4 blocos = 4 diários.
  # Evidência: pen7614-06-somente-disciplinas-da-turma.png
  # ---------------------------------------------------------------------------

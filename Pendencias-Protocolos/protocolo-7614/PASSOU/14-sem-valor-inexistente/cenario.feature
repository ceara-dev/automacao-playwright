#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Não apresentar valor inexistente quando não há registro
    Dado que há alunos sem notas e disciplinas sem aulas
    Quando o boletim for gerado
    Então quando o aluno não possuir informação registrada para determinada avaliação ou período, o sistema não deve apresentar um valor inexistente como se fosse uma informação registrada

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Alunos 17 a 24 (sem notas) e Ingrid (sem AV2) com células vazias; nenhuma nota "0,00" inventada. Legenda: "Células em branco indicam ausência de registro."
  # Evidência: pen7614-14-sem-valor-inexistente.png
  # ---------------------------------------------------------------------------

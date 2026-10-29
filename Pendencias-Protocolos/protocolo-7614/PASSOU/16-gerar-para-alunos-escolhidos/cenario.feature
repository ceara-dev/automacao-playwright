#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Gerar o boletim apenas para alunos escolhidos
    Dado que o usuário escolheu "Escolher alunos" e marcou 2 alunos
    Quando clicar em "Gerar para 2 alunos"
    Então o PDF deve conter somente os alunos e as disciplinas escolhidos
    E o título do documento deve indicar a quantidade de alunos

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. "Desmarcar todos" + Ana Maria e Isaac; Disciplinas "Individual" com Física e Química ("Disciplinas · 2 de 8") → "Gerar para 2 alunos" → POST ...?matriculas[0]=164&matriculas[1]=177&diarios[0]=9&diarios[1]=24 → 202; "Boletim de notas — 2 alunos" (1 página) só com Física e Química e os 2 alunos (Nº 3 e Nº 16).
  # Evidência: pen7614-16-gerar-para-alunos-escolhidos.png
  # ---------------------------------------------------------------------------

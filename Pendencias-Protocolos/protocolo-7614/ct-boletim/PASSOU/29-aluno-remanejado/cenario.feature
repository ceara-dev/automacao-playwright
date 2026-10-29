#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-029
  Contexto:
    Dado que a escola "Colégio Apoio" possui as turmas de teste "QA-7614-A" e "QA-7614-B" no ano letivo "2026"
    E que as duas turmas utilizam o Circuito de Notas 9 (etapa "Ensino médio - 3ª Série")
    E que "QA Professor 7614" é o titular do diário de Biologia de cada turma

  Cenário: Aluno remanejado durante o ano letivo
    Dado que "QA Aluno Remanejado 7614" tinha a nota "AV1" "6,00" no "3º Bimestre" de "Biologia" na turma "QA-7614-B"
    E que a matrícula na turma "QA-7614-B" foi alterada para a situação "Remanejado"
    E que o aluno foi matriculado na turma "QA-7614-A" e recebeu "AV1" "9,00" no "3º Bimestre"
    Quando o boletim de notas das turmas "QA-7614-A" e "QA-7614-B" for gerado
    Então o aluno deve ser apresentado conforme a regra de enturmação vigente
    E cada boletim deve exibir somente as informações registradas na respectiva turma

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — massa QA criada para o teste):
  # PASSOU. A turma B mostra 6,00 e a turma A mostra 9,00; nenhuma nota passa de uma turma para a outra. Na turma B, o aluno aparece com 1 aula e 0 faltas.
  # Enturmação: a turma de origem (B) continua listando o aluno. No diálogo ele aparece como "Matrícula nº 191 · Remanejado" e já vem marcado.
  # Observação (Baixa): o PDF não indica a situação "Remanejado". A linha do aluno é igual à de um aluno cursando. Sugestão: mostrar a situação ao lado do nome ou permitir excluir quem não está cursando.
  # O remanejamento é feito em Matrículas › Ver › "Alterar Situação" (situacao = 6) e não pede a turma de destino; a nova matrícula foi criada à parte.
  # Evidência: pen7614-29-aluno-remanejado.png (boletins das turmas A e B)
  # ---------------------------------------------------------------------------

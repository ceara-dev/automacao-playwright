#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-028
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Aluno sem nenhum registro acadêmico no ano
    Dado que "Yasmim da Silva Rocha" está enturmada na turma "3SER-M-2026"
    E que não possui notas registradas em "2026"
    Quando o boletim de notas da turma for gerado
    Então "Yasmim da Silva Rocha" deve ser apresentada na sua posição da chamada
    E suas células de notas e médias não devem exibir valores inexistentes

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Yasmim aparece como Nº 24 (chamada 24), sem nenhuma nota ou média. Frequência: 2 aulas, 0 faltas, 100 — são as aulas dadas à turma, não um valor inventado.
  # Evidência: pen7614-28-aluno-sem-registro.png
  # ---------------------------------------------------------------------------

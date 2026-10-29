#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-009
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Exibir médias, recuperações e faltas por período
    Dado que "Florenço Ferreira da Silva Junior" possui em "Biologia" no "1º Bimestre" as notas "AV1" "5,00", "AV2" "6,00" e "REC" "8,00"
    E que "Giovanna dos Santos Teixeira" possui "1" falta no "1º Bimestre" em "Biologia"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então a "Média" do "1º Bimestre" deve ser a calculada pela regra do Circuito 9
    E a coluna "REC" deve exibir "8,00"
    E a coluna "Faltas" deve exibir "1"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Florenço: 5,00 · 6,00 · REC 8,00 · Média 8,00 (a REC substitui a média 5,50). Giovanna: REC 5,00 menor que a média 6,00, que fica 6,00; Faltas 1 no 1º Bimestre de Biologia.
  # Evidência: pen7614-09-medias-recuperacoes-e-faltas.png
  # ---------------------------------------------------------------------------

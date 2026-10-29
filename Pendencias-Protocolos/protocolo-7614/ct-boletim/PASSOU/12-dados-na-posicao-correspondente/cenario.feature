#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-012
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Dados acadêmicos exibidos na posição correspondente
    Dado que "Alberto do Nascimento Ferreira Neto" possui "AV1" "7,50" em "Biologia" no "1º Bimestre"
    E que possui "AV1" "9,00" em "Física" no "1º Bimestre"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então o valor "7,50" deve estar na célula "AV1" do "1º Bimestre" de "Biologia" na linha de "Alberto do Nascimento Ferreira Neto"
    E o valor "9,00" deve estar na célula "AV1" do "1º Bimestre" de "Física" na linha de "Alberto do Nascimento Ferreira Neto"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. A posição de cada valor foi lida pelas coordenadas do PDF (pdftotext -bbox): 7,50 está em Biologia › 1º Bimestre › AV1 e 9,00 em Física › 1º Bimestre › AV1. A nota de Biologia foi alterada só para este teste e voltou a 9,00 no final.
  # Evidência: pen7614-12-dados-na-posicao-correspondente.png
  # ---------------------------------------------------------------------------

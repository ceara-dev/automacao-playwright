#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-030
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Nomes longos e caracteres especiais
    Dado que a turma "3SER-M-2026" possui o aluno "Carlos Alexandre Cardozo da Silva Fonseca" (41 caracteres, o maior da turma)
    E os alunos "Maria Luíza de Alcântara Moura Costa" e "Florenço Ferreira da Silva Junior"
    Quando o boletim de notas da turma for gerado
    Então os nomes devem ser exibidos integralmente, com os acentos corretos
    E não devem sobrepor as colunas de notas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Nomes completos e acentuados; o nome mais longo cabe na coluna e o valor 7,00 continua na célula AV1. Limitação: nenhum aluno tem apóstrofo no nome.
  # Evidência: pen7614-30-nomes-longos-e-acentos.png
  # ---------------------------------------------------------------------------

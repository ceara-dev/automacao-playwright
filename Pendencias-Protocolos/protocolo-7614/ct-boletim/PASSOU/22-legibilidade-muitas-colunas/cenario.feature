#language: pt

@protocolo-7614 @usabilidade
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-022
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Legibilidade do PDF com muitas colunas
    Dado que o Circuito 9 possui 4 bimestres, 2 semestres e Etapa Final
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então as colunas devem estar agrupadas sob o título de cada período, como "1º Bimestre" e "2º Bimestre"
    E nenhuma coluna ou valor deve ser cortado ou sobreposto

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Grade com o título de cada período sobre as suas colunas (página em paisagem), sem cortes nem sobreposição na conferência visual. Obs.: a continuação de uma tabela na página seguinte não repete o nome da disciplina (defeito 25 do pacote anterior).
  # Evidência: pen7614-22-legibilidade-muitas-colunas.png
  # ---------------------------------------------------------------------------

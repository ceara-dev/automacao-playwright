#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-010
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Exibir resultados semestrais e finais conforme o Circuito
    Dado que o Circuito 9 define "1º Semestre", "2º Semestre" e "Etapa Final"
    E que "Alberto do Nascimento Ferreira Neto" possui registros em todos os bimestres
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então as colunas "1º Semestre", "2º Semestre" e "Etapa Final" devem ser exibidas
    E seus valores devem corresponder às regras do Circuito 9

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Média do semestre = média das médias dos dois bimestres (Alberto 8,50; Florenço 8,00; Giovanna 6,00). "Rec. Semestral" e "Resultado Final" do protocolo correspondem às colunas REC do semestre e à Etapa Final do circuito 9. A Etapa Final da 3ª Série está vazia (N1/N2 não lançados).
  # Evidência: pen7614-10-resultados-semestrais-e-finais.png
  # ---------------------------------------------------------------------------

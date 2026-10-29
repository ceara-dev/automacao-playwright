#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-003
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Alunos apresentados na ordem da chamada
    Dado que a chamada da turma "9ANO-M-2026" possui "Ana Bianca da Silva Carvalho" como nº "1" e "Ana Cecílya da Cunha Correia" como nº "2"
    E que a matrícula "Aluno sem nome" não tem nº de chamada
    Quando o usuário "qa.ti.7614" gerar o boletim de notas da turma "9ANO-M-2026"
    Então os alunos devem ser exibidos com os números "1", "2", ... da chamada

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # FALHOU. O "Nº" é a posição na lista: a matrícula sem nº de chamada ("Sem nome") vira Nº 1, "Ana Bianca" (chamada 1) vira Nº 2 e toda a numeração se desloca. Na 3ª Série a chamada é 1..24 em ordem alfabética, por isso o defeito não aparece lá.
  # Evidência: pen7614-03-ordem-da-chamada.png
  # ---------------------------------------------------------------------------

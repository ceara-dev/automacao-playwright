#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-004
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Boletim considera o ano letivo da turma acessada
    Dado que o aluno "Alberto do Nascimento Ferreira Neto" possui notas registradas no ano letivo "2026"
    Quando o usuário "qa.ti.7614" gerar o boletim a partir do Diário da turma "3SER-M-2026" de "2026"
    Então o PDF deve apresentar somente os dados do ano letivo "2026"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU (parcial). Cabeçalho "Ano letivo 2026" e nenhum dado de 2025. Limitação: 2026 é o único ano letivo cadastrado, então não há notas de 2025 para confirmar que são excluídas.
  # Evidência: pen7614-04-ano-letivo-da-turma.png
  # ---------------------------------------------------------------------------

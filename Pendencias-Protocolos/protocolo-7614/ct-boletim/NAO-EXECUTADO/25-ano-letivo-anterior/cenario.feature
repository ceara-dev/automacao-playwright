#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-025
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Boletim de turma de ano letivo anterior
    Dado que o usuário "qa.ti.7614" está no Diário de uma turma do ano letivo "2025"
    Quando gerar o boletim de notas
    Então o cabeçalho deve exibir o ano letivo "2025"
    E as notas e frequências devem ser as registradas em "2025"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # NÃO EXECUTADO (sem massa). Só existe o ano letivo 2026.
  # Evidência: não se aplica (cenário não executado por falta de massa de teste).
  # ---------------------------------------------------------------------------

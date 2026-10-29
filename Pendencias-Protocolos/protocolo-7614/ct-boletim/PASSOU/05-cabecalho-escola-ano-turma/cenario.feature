#language: pt

@protocolo-7614 @smoke @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-005
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Cabeçalho exibe Escola, Ano letivo e Turma
    Dado que o boletim de notas da turma "3SER-M-2026" foi gerado
    Quando o usuário visualizar o PDF
    Então o cabeçalho deve exibir a escola "Colégio Apoio"
    E deve exibir o ano letivo "2026"
    E deve exibir a turma "3SER-M-2026 — 3º Série"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. "Escola Colégio Apoio · Ano letivo 2026 · Turma 3SER-M-2026 — 3º Série · Etapa de ensino Ensino médio - 3ª Série".
  # Evidência: pen7614-05-cabecalho-escola-ano-turma.png
  # ---------------------------------------------------------------------------

#language: pt

@protocolo-7614 @seguranca @smoke
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-017
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Esquema do Cenário: Usuário sem vínculo com o diário não visualiza a opção Boletim de notas
    Dado que o usuário "<usuario>" do tipo "<tipo>" tenta abrir o Diário de Biologia da turma "3SER-M-2026"
    Quando acessar a opção "Imprimir"
    Então a opção "Boletim de notas" não deve ser exibida

    Exemplos:
      | usuario       | tipo                          |
      | qa.restrito   | Professor (não titular)       |
      | qa.aluno.7614 | Aluno                         |

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Professor não titular e Aluno recebem 403 no Diário (/diarios/3) e na geração; a opção não é exibida.
  # Adaptação: pela regra de acesso, T.I, Gestor, Super Administrador, Profissional e Professor (no próprio diário) podem imprimir, então os exemplos "qa.professor/Professor" do protocolo viraram o professor que NÃO é dono do diário. O cargo "Secretaria" não existe no sistema.
  # Evidência: pen7614-17-sem-vinculo-nao-ve-a-opcao.png
  # ---------------------------------------------------------------------------

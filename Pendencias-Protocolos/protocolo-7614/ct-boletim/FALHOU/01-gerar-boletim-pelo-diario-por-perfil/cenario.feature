#language: pt

@protocolo-7614 @smoke @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-001
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Esquema do Cenário: Gerar boletim de notas pelo Diário com cada tipo de usuário
    Dado que o usuário "<usuario>" do tipo "<tipo>" está autenticado
    E que possui permissão para visualizar os dados da turma "3SER-M-2026"
    Quando acessar a opção "Imprimir" do Diário de Biologia da turma
    E selecionar "Boletim de notas"
    Então o sistema deve gerar e exibir um arquivo em PDF
    E o PDF deve conter "<conteudo>"

    Exemplos:
      | usuario              | tipo                | conteudo                                   |
      | qa.ti.7614           | T.I                 | o boletim de notas da turma 3SER-M-2026    |
      | qa.diretor.7614      | Gestor              | o boletim de notas da turma 3SER-M-2026    |
      | playwright           | Super Administrador | o boletim de notas da turma 3SER-M-2026    |
      | qa.prof.7614         | Profissional        | o boletim de notas da turma 3SER-M-2026    |
      | professor titular    | Professor           | o boletim do diário que pertence a ele     |
      | qa.aluno.7614        | Aluno               | somente o boletim da própria matrícula     |

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # FALHOU (linha Aluno). Por linha:
  #  - T.I, Gestor, Super Administrador e Profissional: PDF gerado ("BOLETIM DE NOTAS DA TURMA", Turma 3SER-M-2026 — 3º Série). O Profissional chega ao Diário só pela URL (não tem "Diários" no menu).
  #  - Professor: PASSOU com login real do professor de teste "QA Professor 7614", titular dos diários das turmas QA-7614-*. Ele vê só os próprios diários e gera o boletim; o diário 3 dá 403.
  #  - Aluno: FALHOU — o cargo Aluno não tem permissão de boletim; sem "Diários" no menu e 403 nas rotas. Confirmado também com "QA Aluno Duas Turmas 7614", cujo usuário foi criado pelo cadastro do aluno e que tem matrícula: as mesmas permissões e 403 no diário da própria turma.
  # Evidência: pen7614-01-gerar-boletim-pelo-diario-por-perfil.png
  # ---------------------------------------------------------------------------

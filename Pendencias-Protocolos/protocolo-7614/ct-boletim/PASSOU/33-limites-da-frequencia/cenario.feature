#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-033
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Esquema do Cenário: Limites do percentual de frequência
    Dado que o aluno "<aluno>" teve "<aulas>" aulas registradas e "<faltas>" faltas na turma "3SER-M-2026"
    Quando o boletim apresentar os resultados anuais
    Então o percentual de frequência anual deve ser "<percentual>"

    Exemplos:
      | aluno                               | aulas | faltas | percentual |
      | Alberto do Nascimento Ferreira Neto | 2     | 0      | 100%       |
      | Giovanna dos Santos Teixeira        | 2     | 2      | 0%         |

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU (2 de 3 limites). 100 e 0 conferem. O caso fracionário do protocolo (3 aulas, 1 falta → 66,7%) não tem massa: a turma tem 2 aulas. O PDF mostra o percentual inteiro (arredondado), então 66,7% apareceria como 67.
  # Evidência: pen7614-33-limites-da-frequencia.png
  # ---------------------------------------------------------------------------

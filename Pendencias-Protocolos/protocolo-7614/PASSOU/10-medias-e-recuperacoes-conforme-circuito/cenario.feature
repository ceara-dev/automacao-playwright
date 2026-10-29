#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Exibir médias e recuperações conforme as regras do circuito
    Dado que existem notas e recuperações lançadas (média 7,00; REC substitui a nota da etapa se maior)
    Quando o boletim for gerado
    Então devem ser apresentadas as médias e recuperações correspondentes conforme as regras configuradas no Circuito de Notas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Alberto 9,00/8,00 → 8,50; Florenço 5,00/6,00 REC 8,00 → 8,00; Giovanna 6,00/6,00 REC 5,00 → 6,00; Carlos Vinícius 7,00/6,99 → 7,00 (arredondamento); Ingrid só AV1 → Média vazia. Valores iguais aos da tela "Registro de notas/conceitos".
  # Evidência: pen7614-10-medias-e-recuperacoes-conforme-circuito.png
  # ---------------------------------------------------------------------------

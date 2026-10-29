#language: pt

@protocolo-7614 @usabilidade
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-021
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Feedback visual durante a geração do PDF
    Dado que o usuário "qa.ti.7614" está no Diário da turma "3SER-M-2026"
    Quando selecionar "Imprimir" e "Boletim de notas" e clicar duas vezes em "Gerar"
    Então o sistema deve exibir um indicador de processamento até o PDF ser exibido
    E deve impedir o disparo duplicado da geração

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # FALHOU (indicador no clique duplo). Com um clique, o diálogo "Gerando documento" mostra as etapas "Aguardando na fila › Montando o documento › Preparando para abrir" até "Documento pronto" (correto).
  # Com clique duplo em "Gerar", só 1 pedido de geração é enviado (sem duplicidade, correto), mas o 2º clique cai no botão "Fechar e avisar quando ficar pronto", que abre na mesma posição do "Gerar":
  # o indicador fecha logo no início e o usuário só recebe o aviso "Boletim de notas — <aluno> está pronto." pelo toast/sino.
  # Evidência: pen7614-21-feedback-e-sem-duplicidade.png
  # ---------------------------------------------------------------------------

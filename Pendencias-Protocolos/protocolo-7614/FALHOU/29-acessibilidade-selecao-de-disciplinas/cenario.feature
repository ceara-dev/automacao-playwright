#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Informar o estado das disciplinas selecionadas para tecnologias assistivas
    Dado que o usuário navega com leitor de tela no diálogo "Boletim de notas"
    Quando alternar as disciplinas em "Individual"
    Então cada disciplina deve ser anunciada como opção marcável, com o estado marcada/desmarcada

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU. As disciplinas são v-chip sem role nem aria-pressed/aria-checked; o estado selecionado só muda a cor (classe text-primary). O leitor de tela anuncia apenas "Professor(a): …" (atributo title), sem o nome da disciplina como rótulo nem o estado.
  # Evidência: pen7614-29-acessibilidade-selecao-de-disciplinas.png
  # ---------------------------------------------------------------------------

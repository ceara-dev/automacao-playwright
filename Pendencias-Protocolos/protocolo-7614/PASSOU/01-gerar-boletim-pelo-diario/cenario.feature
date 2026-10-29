#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do tipo T.I está no Diário de Biologia da turma 3SER-M-2026

  Cenário: Gerar o boletim pelo Diário
    Dado que o usuário tem permissão para visualizar os dados da turma
    Quando acessar a opção "Imprimir" e selecionar "Boletim de notas"
    Então o sistema deve gerar e exibir um arquivo em PDF contendo o boletim de notas da turma selecionada
    E o PDF deve ter o título "Boletim de Notas da Turma"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. "Imprimir › Boletim de notas" abre o diálogo "Boletim de notas (24 alunos)" — "Escolha as disciplinas e os alunos do boletim." — com Disciplinas (Todas/Individual) e Alunos (todos marcados). "Gerar para todos (24)" → POST /diarios/3/imprimir/boletim → 202; diálogo "Gerando documento" (fila) e, em ~25 s, "Documento pronto" com "Abrir documento", "Baixar" e "Fechar". PDF A4 paisagem, 7 páginas, "BOLETIM DE NOTAS DA TURMA".
  # Evidência: pen7614-01-gerar-boletim-pelo-diario.png
  # ---------------------------------------------------------------------------

#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF exibindo título e identificação da escola
    Dado que o usuário seleciona "Visualizar relatório Registro de Entrada e Saída"
    Quando o PDF de Registro de Entrada e Saída é gerado
    Então o PDF exibe o título "Registro de Entrada e Saída"
    E o PDF identifica a escola "Colégio Apoio"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Título e escola exibidos corretamente no cabeçalho do PDF.
  # Evidência: pen7578-01-gerar-pdf-titulo-e-escola.png
  # ---------------------------------------------------------------------------

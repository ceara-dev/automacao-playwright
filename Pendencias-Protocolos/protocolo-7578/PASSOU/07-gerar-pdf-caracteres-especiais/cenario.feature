#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF renderizando nomes com caracteres especiais
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então nomes com acentos e cedilha são exibidos corretamente (ex.: "Ana Cecílya da Cunha Correia", "Andréia Silva Gomes do Nascimento")
    E não há caracteres corrompidos ou substituídos

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Nomes com acentos renderizados sem corrupção.
  # Evidência: pen7578-07-gerar-pdf-caracteres-especiais.png
  # ---------------------------------------------------------------------------

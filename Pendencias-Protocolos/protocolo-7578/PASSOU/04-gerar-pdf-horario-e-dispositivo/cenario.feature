#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Gerar PDF exibindo horário e dispositivo de entrada e saída
    Dado que o usuário gera o PDF de Registro de Entrada e Saída
    Quando o PDF é renderizado
    Então o horário de entrada é exibido no formato hh:mm:ss com o dispositivo
    E o horário de saída é exibido com o dispositivo correspondente (APOIO-1-001 / PI-CJP-XX-14)

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # PASSOU. Horários e dispositivos (APOIO-1-001 e PI-CJP-XX-14) renderizados.
  # Evidência: pen7578-04-gerar-pdf-horario-e-dispositivo.png
  # ---------------------------------------------------------------------------

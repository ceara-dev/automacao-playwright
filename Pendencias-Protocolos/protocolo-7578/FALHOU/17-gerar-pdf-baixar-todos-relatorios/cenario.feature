#language: pt

Funcionalidade: Relatório Notifiq — Exportação em PDF (novo layout)

  Contexto:
    Dado que o usuário autenticado está na tela Relatórios Notifiq

  Cenário: Baixar cada relatório disponível em PDF
    Dado que o usuário clica em "Baixar" de Registros por Período, Presença por Escola, Presença por Turma, Registros por Aluno e Registros por Dispositivo
    Quando o download é concluído
    Então cada relatório deve ser gerado em PDF
    E nenhum arquivo deve ser CSV genérico

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 23/09/2026):
  # FALHOU (defeito). O botão "Baixar" desses 5 relatórios chama `relatorios.notifiq.export` e baixa `notifiq-registros-*.csv`, em vez do PDF do relatório. Apenas "Registro de Entrada e Saída" gera PDF.
  # Evidência: pen7578-17-gerar-pdf-baixar-todos-relatorios.png
  # ---------------------------------------------------------------------------

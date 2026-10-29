import { cenariosPadrao, lancarNotas } from './lancamentoNotas';

// Lançamento de notas da turma "Ensino médio - 3ª Série" (3SER-M-2026), bimestres 1 a 4, em todas as disciplinas.
// ATENÇÃO: GRAVA notas reais na homologação (pedido do QA em 01/10/2026). Reexecutar regrava os mesmos valores.
//
// Circuito 9 (3ª Série): escala 0–10, média 7,00, 2 casas. Bimestres = AV1 + AV2 (Prova) + REC (Recuperação),
// base "Média Aritmética" e recuperação "Substitui a nota da etapa".

lancarNotas({
  busca: '3SER',
  turma: '3º Série',
  // 1º Semestre fica de fora: prazo encerrado em 31/07/2026 (etapa bloqueada).
  etapas: (process.env.ETAPAS ?? '1º Bimestre,2º Bimestre,3º Bimestre,4º Bimestre').split(','),
  relatorio: 'e2e/lancamentos/notas3Serie-resultado.json',
  // Diários da turma (um por disciplina), levantados em 01/10/2026.
  diarios: [
    { id: 3, componente: 'Biologia' },
    { id: 31, componente: 'Filosofia' },
    { id: 9, componente: 'Física' },
    { id: 8, componente: 'Geografia' },
    { id: 16, componente: 'Língua /Literatura estrangeira - Espanhol' },
    { id: 47, componente: 'Língua /Literatura estrangeira - Inglês' },
    { id: 24, componente: 'Química' },
    { id: 30, componente: 'Sociologia' },
  ],
  // Um aluno por condição (primeiros 16 da turma em ordem alfabética).
  cenarios: cenariosPadrao([
    'Alberto do Nascimento Ferreira Neto', 'Ana Beatriz dos Santos Souza', 'Ana Maria Veras Brito Melo', 'Anne Sophia Tavares Pires',
    'Antonio Anderson dos Santos Brito', 'Bruno Gabriel Luna Monteiro', 'Carlos Alexandre Cardozo da Silva Fonseca', 'Carlos Henrique Cirqueira Costa',
    'Carlos Vinícius Bezerra de Araujo', 'Davi Araujo Amaral Cunha', 'Davi Silva Lima', 'Florenço Ferreira da Silva Junior',
    'Giovanna dos Santos Teixeira', 'Hemilly Sousa Araujo', 'Ingrid Maria do Nascimento dos Santos', 'Isaac dos Santos de Sousa Filho',
  ]),
});

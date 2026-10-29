import { cenariosPadrao, lancarNotas } from './lancamentoNotas';

// Lançamento de notas da turma "Ensino fundamental de 9 anos - 9º Ano" (9ANO-M-2026), bimestres 1 a 4, em todas as disciplinas.
// ATENÇÃO: GRAVA notas reais na homologação (pedido do QA em 01/10/2026). Reexecutar regrava os mesmos valores.
//
// Circuito 6 (9º Ano): escala 0–10, média 7,00, 2 casas. Bimestres = AV1 + AV2 (Prova) + REC (Recuperação),
// base "Média Aritmética" e recuperação "Substitui a nota da etapa".

lancarNotas({
  busca: '9ANO',
  turma: '9º Ano',
  // 1º Semestre fica de fora: prazo encerrado em 31/07/2026 (etapa bloqueada).
  etapas: (process.env.ETAPAS ?? '1º Bimestre,2º Bimestre,3º Bimestre,4º Bimestre').split(','),
  relatorio: 'e2e/lancamentos/notas9Ano-resultado.json',
  // Diários da turma (um por disciplina), levantados em 01/10/2026.
  diarios: [
    { id: 20, componente: 'Ensino religioso' },
    { id: 5, componente: 'Geografia' },
    { id: 13, componente: 'Língua /Literatura estrangeira - Espanhol' },
    { id: 21, componente: 'Química' },
  ],
  // Um aluno por condição (primeiros 16 da turma em ordem alfabética; a matrícula "Sem nome" foi pulada).
  cenarios: cenariosPadrao([
    'Ana Bianca da Silva Carvalho', 'Ana Cecílya da Cunha Correia', 'Ana Luiza Costa Brazil', 'Ana Sophia Rodrigues Fonseca',
    'Anna Julia Araujo Oliveira', 'Antonio Augusto Braga Machado', 'Arthur Ferreira e Silva', 'Caio Anjos Fontenele',
    'Dayza Lauanne Nunes de Carvalho', 'Icaro Veras Rocha', 'Italo Aquino da Silva', 'João Filipe Cordeiro de Melo',
    'João Gabriel de Caldas Marques', 'Luis Richardy Souza da Silva', 'Luiz Othávio Freitas Miranda', 'Manuella Vieira Masullo',
  ]),
});

/**
 * Player progress: score, attempts and solved stages.
 *
 * Single player, held in memory, reset when the server restarts.
 */

const { TOTAL_STAGES } = require('./stages');

const MAX_POINTS = 10;
const PENALTY = 2;
const MIN_POINTS = 4;

const state = {
  attempts: {},
  solved: {},
  startedAt: Date.now()
};

function pointsFor(attemptCount) {
  return Math.max(MIN_POINTS, MAX_POINTS - (attemptCount - 1) * PENALTY);
}

/** Record an attempt and return the updated progress. */
function record(stageId, correct) {
  const id = Number(stageId);
  state.attempts[id] = (state.attempts[id] || 0) + 1;

  let awarded = 0;
  if (correct && !state.solved[id]) {
    awarded = pointsFor(state.attempts[id]);
    state.solved[id] = { points: awarded, attempts: state.attempts[id], at: Date.now() };
  }

  return { awarded, ...summary() };
}

function summary() {
  const solvedIds = Object.keys(state.solved).map(Number);
  const score = solvedIds.reduce((total, id) => total + state.solved[id].points, 0);
  const attempts = Object.values(state.attempts).reduce((total, n) => total + n, 0);

  return {
    score,
    maxScore: TOTAL_STAGES * MAX_POINTS,
    solvedCount: solvedIds.length,
    totalStages: TOTAL_STAGES,
    totalAttempts: attempts,
    solvedIds,
    perStage: { ...state.solved },
    attemptsPerStage: { ...state.attempts },
    complete: solvedIds.length === TOTAL_STAGES
  };
}

function reset() {
  state.attempts = {};
  state.solved = {};
  state.startedAt = Date.now();
  return summary();
}

module.exports = { record, summary, reset, MAX_POINTS, PENALTY, MIN_POINTS };

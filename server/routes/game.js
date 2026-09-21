/**
 * /api/game
 *
 * The game's own endpoints. Stages are handed out with their answers stripped,
 * and every attempt is judged here — never on the client.
 */

const express = require('express');
const { getStage, publicStage, publicStages, TOTAL_STAGES } = require('../game/stages');
const { check } = require('../game/validator');
const progress = require('../game/progress');
const store = require('../data/store');

const router = express.Router();

// GET /api/game/progress — score, attempts and solved stages
router.get('/progress', (req, res) => {
  res.status(200).json(progress.summary());
});

// POST /api/game/progress/reset — start over
// Also restores the recipe/ingredient data to its seed state, so replaying
// mutating stages (add/attach/delete) behaves the same way every time.
router.post('/progress/reset', (req, res) => {
  store.reset();
  res.status(200).json(progress.reset());
});

// GET /api/game/stages — all stages, answers removed
router.get('/stages', (req, res) => {
  res.status(200).json(publicStages());
});

// GET /api/game/stages/:order — one stage by position, answers removed
router.get('/stages/:order', (req, res) => {
  const order = Number(req.params.order);
  if (!Number.isInteger(order) || order < 1 || order > TOTAL_STAGES) {
    return res.status(404).json({ error: `There is no stage ${req.params.order}` });
  }
  res.status(200).json(publicStage(getStage(order)));
});

/**
 * POST /api/game/attempts
 * Body: { stageId, method, path, query, body }
 *
 * Judges the attempt, then performs the request the player built against this
 * same server, so the status code and JSON they see are real.
 */
router.post('/attempts', async (req, res, next) => {
  try {
    const { stageId, method, path, query, body } = req.body || {};

    const stage = getStage(stageId);
    if (!stage) {
      return res.status(400).json({ error: `Unknown stage id: ${stageId}` });
    }
    if (!method || !path) {
      return res.status(400).json({ error: 'An attempt needs at least a method and a path' });
    }

    const verdict = check(stage, { method, path, query, body });
    const scoring = progress.record(stage.id, verdict.correct);

    const search = new URLSearchParams(
      Object.entries(query || {}).filter(([, value]) => value !== '')
    ).toString();
    const target = `${req.protocol}://${req.get('host')}${path.startsWith('/') ? '' : '/'}${path}${
      search ? `?${search}` : ''
    }`;

    let response;
    try {
      const upstream = await fetch(target, {
        method: method.toUpperCase(),
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });

      const text = await upstream.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          data = text;
        }
      }
      response = { status: upstream.status, data };
    } catch (err) {
      response = { status: 0, data: `The request could not be sent: ${err.message}` };
    }

    res.status(200).json({
      stageId: stage.id,
      correct: verdict.correct,
      message: verdict.message,
      response,
      progress: scoring
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

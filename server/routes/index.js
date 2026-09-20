/**
 * API router — mounted by server.js at /api.
 *
 * All API endpoints live under this prefix, as the assignment requires.
 */

const express = require('express');
const recipesRouter = require('./recipes');
const ingredientsRouter = require('./ingredients');
const gameRouter = require('./game');

const router = express.Router();

router.use('/recipes', recipesRouter);
router.use('/ingredients', ingredientsRouter);
router.use('/game', gameRouter);

module.exports = router;

/**
 * /api/ingredients
 *
 * REST routes for the ingredients resource — the shared catalog that recipes
 * reference by id.
 */

const express = require('express');
const { recipes, ingredients, nextId } = require('../data/store');

const router = express.Router();

function asBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function applySort(list, sort) {
  if (!sort) return list;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...list].sort((a, b) => {
    if (a[field] === undefined || b[field] === undefined) return 0;
    if (typeof a[field] === 'string') {
      return desc ? b[field].localeCompare(a[field]) : a[field].localeCompare(b[field]);
    }
    return desc ? b[field] - a[field] : a[field] - b[field];
  });
}

// GET /api/ingredients
// Supports ?category= &vegan= &maxCalories= &search= &sort=
router.get('/', (req, res) => {
  const { category, vegan, maxCalories, search, sort } = req.query;
  let result = [...ingredients];

  if (category) {
    result = result.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  }
  if (vegan !== undefined) {
    const flag = asBoolean(vegan);
    if (flag !== undefined) result = result.filter((i) => i.vegan === flag);
  }
  if (maxCalories !== undefined && maxCalories !== '') {
    const max = Number(maxCalories);
    if (!Number.isNaN(max)) result = result.filter((i) => i.caloriesPer100 <= max);
  }
  if (search) {
    const needle = search.toLowerCase();
    result = result.filter((i) => i.name.toLowerCase().includes(needle));
  }

  result = applySort(result, sort);
  res.status(200).json(result);
});

// GET /api/ingredients/:id
router.get('/:id', (req, res) => {
  const ingredient = ingredients.find((i) => i.id === Number(req.params.id));
  if (!ingredient) {
    return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  }
  res.status(200).json(ingredient);
});

// GET /api/ingredients/:id/recipes — the reverse side of the relationship
router.get('/:id/recipes', (req, res) => {
  const ingredient = ingredients.find((i) => i.id === Number(req.params.id));
  if (!ingredient) {
    return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  }
  const using = recipes.filter((r) => r.ingredientIds.includes(ingredient.id));
  res.status(200).json(using);
});

// POST /api/ingredients
router.post('/', (req, res) => {
  const { name, category, unit, caloriesPer100, vegan } = req.body || {};

  if (!name || !category) {
    return res.status(400).json({ error: 'Fields "name" and "category" are required' });
  }

  const ingredient = {
    id: nextId(ingredients),
    name,
    category,
    unit: unit || 'g',
    caloriesPer100: caloriesPer100 !== undefined ? Number(caloriesPer100) : 0,
    vegan: vegan === undefined ? true : Boolean(vegan)
  };

  ingredients.push(ingredient);
  res.status(201).json(ingredient);
});

// PUT /api/ingredients/:id — full replacement
router.put('/:id', (req, res) => {
  const index = ingredients.findIndex((i) => i.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  }

  const { name, category, unit, caloriesPer100, vegan } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: 'A full replacement requires at least "name" and "category"' });
  }

  const replaced = {
    id: ingredients[index].id,
    name,
    category,
    unit: unit || 'g',
    caloriesPer100: caloriesPer100 !== undefined ? Number(caloriesPer100) : 0,
    vegan: vegan === undefined ? true : Boolean(vegan)
  };

  ingredients[index] = replaced;
  res.status(200).json(replaced);
});

// PATCH /api/ingredients/:id — partial update
router.patch('/:id', (req, res) => {
  const ingredient = ingredients.find((i) => i.id === Number(req.params.id));
  if (!ingredient) {
    return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  }

  const updatable = ['name', 'category', 'unit', 'caloriesPer100', 'vegan'];
  const changes = Object.keys(req.body || {}).filter((key) => updatable.includes(key));

  if (changes.length === 0) {
    return res.status(400).json({ error: 'No updatable fields supplied', updatable });
  }

  changes.forEach((key) => {
    if (key === 'caloriesPer100') {
      ingredient[key] = Number(req.body[key]);
    } else if (key === 'vegan') {
      ingredient[key] = Boolean(req.body[key]);
    } else {
      ingredient[key] = req.body[key];
    }
  });

  res.status(200).json(ingredient);
});

// DELETE /api/ingredients/:id
// Also detaches the ingredient from every recipe that referenced it, so no
// recipe is left pointing at an id that no longer exists.
router.delete('/:id', (req, res) => {
  const index = ingredients.findIndex((i) => i.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Ingredient ${req.params.id} not found` });
  }

  const [removed] = ingredients.splice(index, 1);
  recipes.forEach((r) => {
    const position = r.ingredientIds.indexOf(removed.id);
    if (position !== -1) r.ingredientIds.splice(position, 1);
  });

  res.status(204).end();
});

module.exports = router;

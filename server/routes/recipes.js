/**
 * /api/recipes
 *
 * REST routes for the recipes resource and its nested ingredients sub-collection.
 * Paths name resources; the HTTP method says what to do with them. No verb routes.
 */

const express = require('express');
const { recipes, ingredients, nextId } = require('../data/store');

const router = express.Router();

/** Query values arrive as strings; "true"/"false" need converting before comparing. */
function asBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * Apply ?sort=field or ?sort=-field (leading "-" means descending).
 * Sorts a copy so the stored order is never disturbed by a read.
 */
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

// GET /api/recipes
// Supports ?cuisine= &difficulty= &vegetarian= &maxPrepTime= &minRating= &search= &sort=
// Filters are combinable: every supplied parameter narrows the result further.
router.get('/', (req, res) => {
  const { cuisine, difficulty, vegetarian, maxPrepTime, minRating, search, sort } = req.query;
  let result = [...recipes];

  if (cuisine) {
    result = result.filter((r) => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  }
  if (difficulty) {
    result = result.filter((r) => r.difficulty.toLowerCase() === difficulty.toLowerCase());
  }
  if (vegetarian !== undefined) {
    const flag = asBoolean(vegetarian);
    if (flag !== undefined) result = result.filter((r) => r.vegetarian === flag);
  }
  if (maxPrepTime !== undefined && maxPrepTime !== '') {
    const max = Number(maxPrepTime);
    if (!Number.isNaN(max)) result = result.filter((r) => r.prepTime <= max);
  }
  if (minRating !== undefined && minRating !== '') {
    const min = Number(minRating);
    if (!Number.isNaN(min)) result = result.filter((r) => r.rating >= min);
  }
  if (search) {
    const needle = search.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(needle));
  }

  result = applySort(result, sort);
  res.status(200).json(result);
});

// GET /api/recipes/:id
router.get('/:id', (req, res) => {
  const recipe = recipes.find((r) => r.id === Number(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }
  res.status(200).json(recipe);
});

// POST /api/recipes
router.post('/', (req, res) => {
  const { title, cuisine, prepTime, servings, difficulty, rating, vegetarian, ingredientIds } =
    req.body || {};

  if (!title || !cuisine) {
    return res.status(400).json({ error: 'Fields "title" and "cuisine" are required' });
  }

  const recipe = {
    id: nextId(recipes),
    title,
    cuisine,
    prepTime: prepTime !== undefined ? Number(prepTime) : 0,
    servings: servings !== undefined ? Number(servings) : 1,
    difficulty: difficulty || 'easy',
    rating: rating !== undefined ? Number(rating) : 0,
    vegetarian: vegetarian === undefined ? false : Boolean(vegetarian),
    ingredientIds: Array.isArray(ingredientIds) ? ingredientIds.map(Number) : []
  };

  recipes.push(recipe);
  res.status(201).json(recipe);
});

// PUT /api/recipes/:id — full replacement
router.put('/:id', (req, res) => {
  const index = recipes.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }

  const { title, cuisine, prepTime, servings, difficulty, rating, vegetarian, ingredientIds } =
    req.body || {};
  if (!title || !cuisine) {
    return res.status(400).json({ error: 'A full replacement requires at least "title" and "cuisine"' });
  }

  const replaced = {
    id: recipes[index].id,
    title,
    cuisine,
    prepTime: prepTime !== undefined ? Number(prepTime) : 0,
    servings: servings !== undefined ? Number(servings) : 1,
    difficulty: difficulty || 'easy',
    rating: rating !== undefined ? Number(rating) : 0,
    vegetarian: vegetarian === undefined ? false : Boolean(vegetarian),
    ingredientIds: Array.isArray(ingredientIds) ? ingredientIds.map(Number) : []
  };

  recipes[index] = replaced;
  res.status(200).json(replaced);
});

// PATCH /api/recipes/:id — partial update
router.patch('/:id', (req, res) => {
  const recipe = recipes.find((r) => r.id === Number(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }

  const updatable = [
    'title',
    'cuisine',
    'prepTime',
    'servings',
    'difficulty',
    'rating',
    'vegetarian',
    'ingredientIds'
  ];
  const changes = Object.keys(req.body || {}).filter((key) => updatable.includes(key));

  if (changes.length === 0) {
    return res.status(400).json({ error: 'No updatable fields supplied', updatable });
  }

  changes.forEach((key) => {
    if (['prepTime', 'servings', 'rating'].includes(key)) {
      recipe[key] = Number(req.body[key]);
    } else if (key === 'vegetarian') {
      recipe[key] = Boolean(req.body[key]);
    } else if (key === 'ingredientIds') {
      recipe[key] = Array.isArray(req.body[key]) ? req.body[key].map(Number) : recipe[key];
    } else {
      recipe[key] = req.body[key];
    }
  });

  res.status(200).json(recipe);
});

// DELETE /api/recipes/:id
router.delete('/:id', (req, res) => {
  const index = recipes.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }
  recipes.splice(index, 1);
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Nested sub-collection: the ingredients belonging to one recipe.
// This is where the relationship between the two resources is expressed.
// ---------------------------------------------------------------------------

// GET /api/recipes/:id/ingredients   supports ?vegan= &category=
router.get('/:id/ingredients', (req, res) => {
  const recipe = recipes.find((r) => r.id === Number(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }

  let result = recipe.ingredientIds
    .map((id) => ingredients.find((i) => i.id === id))
    .filter(Boolean);

  const { vegan, category } = req.query;
  if (vegan !== undefined) {
    const flag = asBoolean(vegan);
    if (flag !== undefined) result = result.filter((i) => i.vegan === flag);
  }
  if (category) {
    result = result.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  }

  res.status(200).json(result);
});

// POST /api/recipes/:id/ingredients — attach an existing ingredient to a recipe
router.post('/:id/ingredients', (req, res) => {
  const recipe = recipes.find((r) => r.id === Number(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }

  const { ingredientId } = req.body || {};
  if (ingredientId === undefined) {
    return res.status(400).json({ error: 'Field "ingredientId" is required' });
  }

  const ingredient = ingredients.find((i) => i.id === Number(ingredientId));
  if (!ingredient) {
    return res.status(404).json({ error: `Ingredient ${ingredientId} not found` });
  }
  if (recipe.ingredientIds.includes(ingredient.id)) {
    return res.status(409).json({ error: `Ingredient ${ingredient.id} is already in this recipe` });
  }

  recipe.ingredientIds.push(ingredient.id);
  res.status(201).json(recipe);
});

// DELETE /api/recipes/:id/ingredients/:ingredientId — detach one ingredient
router.delete('/:id/ingredients/:ingredientId', (req, res) => {
  const recipe = recipes.find((r) => r.id === Number(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: `Recipe ${req.params.id} not found` });
  }

  const position = recipe.ingredientIds.indexOf(Number(req.params.ingredientId));
  if (position === -1) {
    return res
      .status(404)
      .json({ error: `Ingredient ${req.params.ingredientId} is not part of this recipe` });
  }

  recipe.ingredientIds.splice(position, 1);
  res.status(204).end();
});

module.exports = router;

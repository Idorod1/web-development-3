/**
 * In-memory data store.
 *
 * The JSON files are the seed data: they are read once, at startup, into plain
 * arrays. Every route then reads and writes THOSE ARRAYS — the files on disk are
 * never written back to. Restarting the server, or calling `reset()` below,
 * restores the original seed data, which the assignment explicitly allows
 * ("no need to persist after a restart").
 *
 * The spread/map below is a deep-enough copy so that mutations made by the game
 * cannot alter the objects cached by require().
 */

const seedRecipes = require('./recipes.json');
const seedIngredients = require('./ingredients.json');

const recipes = seedRecipes.map((r) => ({ ...r, ingredientIds: [...r.ingredientIds] }));
const ingredients = seedIngredients.map((i) => ({ ...i }));

/** Next free id for a collection, so new items never collide with existing ones. */
function nextId(collection) {
  return collection.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/**
 * Restore both collections to the seed data, in place.
 *
 * Mutates the same arrays every route holds a reference to (rather than
 * reassigning `recipes`/`ingredients`), so existing `require('./store')`
 * callers see the reset without re-importing anything.
 */
function reset() {
  recipes.length = 0;
  recipes.push(...seedRecipes.map((r) => ({ ...r, ingredientIds: [...r.ingredientIds] })));

  ingredients.length = 0;
  ingredients.push(...seedIngredients.map((i) => ({ ...i })));
}

module.exports = { recipes, ingredients, nextId, reset };

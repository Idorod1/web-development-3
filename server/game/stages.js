/**
 * Game stage definitions.
 *
 * SERVER ONLY. This module must never be bundled, imported or otherwise exposed
 * to the client: every stage carries its own solution in `expected`.
 *
 * Each stage has two halves:
 *   - public fields (id, order, title, scenario, hint, concepts, inputs) —
 *     these may be sent to the browser so the player can read the task.
 *   - `expected` — the correct answer. Never leaves the server.
 *
 * Use `publicStage()` / `publicStages()` below to get a safe-to-send copy.
 * Never pass a raw stage object to a template or a JSON response.
 *
 * `expected.path` may contain `:param` placeholders (e.g. /api/recipes/:id).
 * `expected.route` then pins the value each placeholder must take, so the
 * validator can tell "wrong route param" apart from "wrong path shape".
 *
 * Query values are written as strings because that is how they arrive over
 * the wire (req.query); the validator compares them as strings.
 */

const STAGES = [
  // ---------------------------------------------------------------- 1
  {
    id: 1,
    order: 1,
    title: 'List all recipes',
    scenario:
      'The home page of the cookbook needs to display every recipe in the system. ' +
      'Ask the server for the full list of recipes.',
    hint: 'Reading a whole collection is the simplest request there is — just a method and a path.',
    concepts: ['GET'],
    inputs: { query: false, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes'
    }
  },

  // ---------------------------------------------------------------- 2
  {
    id: 2,
    order: 2,
    title: 'Show a single recipe',
    scenario:
      'A user clicked on "Classic Hummus" (recipe id 5) and wants to see its full details. ' +
      'Request that one recipe from the server.',
    hint: 'A single item lives at its own address, underneath the collection it belongs to.',
    concepts: ['GET', 'Route Parameters'],
    inputs: { query: false, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes/:id',
      route: { id: '5' }
    }
  },

  // ---------------------------------------------------------------- 3
  {
    id: 3,
    order: 3,
    title: 'Filter recipes by cuisine',
    scenario:
      'The user opened the "Italian" tab. Ask the server for recipes whose cuisine is italian. ' +
      'The filtering must happen on the server — do not ask for everything and filter locally.',
    hint: 'Filtering a collection does not change its address; it narrows it with a query parameter.',
    concepts: ['GET', 'Query Parameters'],
    inputs: { query: true, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes',
      query: { cuisine: 'italian' }
    }
  },

  // ---------------------------------------------------------------- 4
  {
    id: 4,
    order: 4,
    title: 'A recipe that does not exist',
    scenario:
      'The user followed a stale link to recipe 99, which was never in the cookbook. ' +
      'Send that request anyway and look carefully at how the server answers — ' +
      'the status code matters more than the body here.',
    hint: 'Not every request succeeds. Ask for the missing recipe the same way you would ask for a real one.',
    concepts: ['GET', 'Route Parameters', 'Status Codes', 'Error handling'],
    inputs: { query: false, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes/:id',
      route: { id: '99' }
    },
    // This stage is solved by producing the error, not by avoiding it.
    expectsErrorResponse: true
  },

  // ---------------------------------------------------------------- 5
  {
    id: 5,
    order: 5,
    title: 'Ingredients of a recipe',
    scenario:
      'The recipe page for "Spaghetti Carbonara" (recipe id 2) needs to list the ingredients it uses, ' +
      'but the user ticked the "vegan only" box. ' +
      'Ask the server for the ingredients of that specific recipe, limited to the vegan ones.',
    hint:
      'The ingredients of one recipe are a sub-collection of that recipe — build the path from ' +
      'the recipe outwards. The "vegan only" box is a filter, not part of the address.',
    concepts: ['GET', 'Route Parameters', 'Query Parameters', 'Relationships'],
    inputs: { query: true, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes/:id/ingredients',
      route: { id: '2' },
      query: { vegan: 'true' }
    }
  },

  // ---------------------------------------------------------------- 6
  {
    id: 6,
    order: 6,
    title: 'Quick Italian recipes, best first',
    scenario:
      'A user wants Italian recipes they can cook in 25 minutes or less, ' +
      'ordered from the highest rating to the lowest. ' +
      'Build one request that expresses all three conditions.',
    hint: 'Three separate conditions, three separate query parameters, one request.',
    concepts: ['GET', 'Query Parameters', 'Filtering', 'Sorting'],
    inputs: { query: true, body: false },
    expected: {
      method: 'GET',
      path: '/api/recipes',
      query: { cuisine: 'italian', maxPrepTime: '25', sort: '-rating' }
    }
  },

  // ---------------------------------------------------------------- 7
  {
    id: 7,
    order: 7,
    title: 'Add a new recipe',
    scenario:
      'The user filled in the "new recipe" form with: title "Shakshuka", cuisine "middle-eastern", ' +
      'prepTime 25, servings 2, difficulty "easy", vegetarian true. ' +
      'Send it to the server so it is created and stored.',
    hint:
      'Creating something new is not a GET, and the data is too big for the path — ' +
      'it belongs in the request body as JSON.',
    concepts: ['POST', 'Request Body', 'Status Codes'],
    inputs: { query: false, body: true },
    expected: {
      method: 'POST',
      path: '/api/recipes',
      body: {
        title: 'Shakshuka',
        cuisine: 'middle-eastern',
        prepTime: 25,
        servings: 2,
        difficulty: 'easy',
        vegetarian: true
      }
    }
  },

  // ---------------------------------------------------------------- 8
  {
    id: 8,
    order: 8,
    title: 'Replace a recipe',
    scenario:
      'The entry for "Roasted Chicken with Lemon" (recipe id 10) is being rewritten from scratch: ' +
      'prepTime becomes 75 and servings becomes 4. Everything else keeps its current value — ' +
      'title "Roasted Chicken with Lemon", cuisine "middle-eastern", difficulty "hard", rating 4.8, ' +
      'vegetarian false, ingredientIds [10, 17, 13, 14, 18, 4, 22]. ' +
      'Send the whole recipe so it replaces the stored one.',
    hint:
      'You need to say which recipe (in the path) and what it becomes (in the body). ' +
      'Choose the method that means "replace all of it" — and because it replaces everything, ' +
      'every field has to be in the body, not just the two that changed.',
    concepts: ['PUT', 'Route Parameters', 'Request Body'],
    inputs: { query: false, body: true },
    expected: {
      method: 'PUT',
      path: '/api/recipes/:id',
      route: { id: '10' },
      body: {
        title: 'Roasted Chicken with Lemon',
        cuisine: 'middle-eastern',
        prepTime: 75,
        servings: 4,
        difficulty: 'hard',
        rating: 4.8,
        vegetarian: false,
        ingredientIds: [10, 17, 13, 14, 18, 4, 22]
      }
    }
  },

  // ---------------------------------------------------------------- 9
  {
    id: 9,
    order: 9,
    title: 'Add an ingredient to a recipe',
    scenario:
      'The "Avocado Toast" recipe (id 7) is missing an ingredient: the user wants to add ' +
      'Garlic (ingredient id 13) to it. Attach that existing ingredient to that recipe.',
    hint:
      'This writes into the sub-collection you read in stage 5. ' +
      'The recipe is identified in the path; which ingredient to attach goes in the body.',
    concepts: ['POST', 'Route Parameters', 'Request Body', 'Relationships'],
    inputs: { query: false, body: true },
    expected: {
      method: 'POST',
      path: '/api/recipes/:id/ingredients',
      route: { id: '7' },
      body: { ingredientId: 13 }
    }
  },

  // ---------------------------------------------------------------- 10
  {
    id: 10,
    order: 10,
    title: 'Remove a recipe',
    scenario:
      'The user decided to delete "Garlic Fried Rice" (recipe id 6) from the cookbook. ' +
      'Remove it from the server, then note the status code — a successful delete ' +
      'does not necessarily return any data.',
    hint: 'No body is needed. Naming the resource and choosing the right method is the whole request.',
    concepts: ['DELETE', 'Route Parameters', 'Status Codes'],
    inputs: { query: false, body: false },
    expected: {
      method: 'DELETE',
      path: '/api/recipes/:id',
      route: { id: '6' }
    }
  }
];

/** Strip the solution from a stage, leaving only what the player may see. */
function publicStage(stage) {
  if (!stage) return null;
  const { expected, expectsErrorResponse, ...safe } = stage;
  return { ...safe, total: STAGES.length };
}

/** All stages, solutions removed. Safe to send to the client. */
function publicStages() {
  return STAGES.map(publicStage);
}

/** Full stage object, solution included. Server-side use only. */
function getStage(id) {
  return STAGES.find((s) => s.id === Number(id)) || null;
}

module.exports = {
  STAGES,
  TOTAL_STAGES: STAGES.length,
  getStage,
  publicStage,
  publicStages
};

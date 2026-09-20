/**
 * Resource schemas.
 *
 * This is the data behind the /schemas page. It is rendered into the EJS
 * template on the server at request time (SSR) — the page must never fetch it
 * over AJAX.
 
 */

const schemas = [
  {
    name: 'Recipes',
    key: 'recipes',
    basePath: '/api/recipes',
    description:
      'A dish in the cookbook. Each recipe references the ingredients it uses by id, ' +
      'which is how the two resources are connected.',
    fields: [
      {
        name: 'id',
        type: 'number',
        example: 1,
        notes: 'Unique identifier. Assigned by the server; read-only.'
      },
      {
        name: 'title',
        type: 'string',
        example: 'Margherita Pizza',
        notes: 'Required when creating a recipe.'
      },
      {
        name: 'cuisine',
        type: 'string',
        example: 'italian',
        allowed: ['italian', 'american', 'japanese', 'middle-eastern'],
        notes: 'Required when creating a recipe.'
      },
      {
        name: 'prepTime',
        type: 'number',
        example: 30,
        notes: 'Preparation time in minutes.'
      },
      {
        name: 'servings',
        type: 'number',
        example: 2,
        notes: 'How many people the recipe serves.'
      },
      {
        name: 'difficulty',
        type: 'string',
        example: 'medium',
        allowed: ['easy', 'medium', 'hard']
      },
      {
        name: 'rating',
        type: 'number',
        example: 4.7,
        notes: 'Average user rating, from 0 to 5.'
      },
      {
        name: 'vegetarian',
        type: 'boolean',
        example: true
      },
      {
        name: 'ingredientIds',
        type: 'number[]',
        example: [1, 2, 3, 4, 5],
        references: 'Ingredients.id',
        notes: 'The ingredients this recipe uses. See the Relationship section below.'
      }
    ],
    queryParams: [
      {
        name: 'cuisine',
        type: 'string',
        description: 'Keep only recipes of this cuisine (exact match).',
        example: '?cuisine=italian'
      },
      {
        name: 'difficulty',
        type: 'string',
        description: 'Keep only recipes of this difficulty (exact match).',
        example: '?difficulty=easy'
      },
      {
        name: 'vegetarian',
        type: 'boolean',
        description: 'Keep only vegetarian (true) or non-vegetarian (false) recipes.',
        example: '?vegetarian=true'
      },
      {
        name: 'maxPrepTime',
        type: 'number',
        description: 'Keep only recipes that take at most this many minutes.',
        example: '?maxPrepTime=25'
      },
      {
        name: 'minRating',
        type: 'number',
        description: 'Keep only recipes rated at least this high.',
        example: '?minRating=4.5'
      },
      {
        name: 'search',
        type: 'string',
        description: 'Keep only recipes whose title contains this text (case-insensitive).',
        example: '?search=pizza'
      },
      {
        name: 'sort',
        type: 'string',
        description: 'Order the results by a field. Prefix with "-" for descending order.',
        example: '?sort=-rating'
      }
    ],
    endpoints: [
      { method: 'GET', path: '/api/recipes', description: 'List all recipes. Accepts the query parameters above.' },
      { method: 'GET', path: '/api/recipes/:id', description: 'Get one recipe by id.' },
      { method: 'POST', path: '/api/recipes', description: 'Create a recipe. Send the fields in the request body.' },
      { method: 'PUT', path: '/api/recipes/:id', description: 'Replace a recipe entirely.' },
      { method: 'PATCH', path: '/api/recipes/:id', description: 'Update only the fields you send.' },
      { method: 'DELETE', path: '/api/recipes/:id', description: 'Remove a recipe.' },
      {
        method: 'GET',
        path: '/api/recipes/:id/ingredients',
        description: 'List the ingredients of one recipe. Accepts ?vegan= and ?category=.'
      },
      {
        method: 'POST',
        path: '/api/recipes/:id/ingredients',
        description: 'Attach an existing ingredient. Body: { "ingredientId": number }.'
      },
      {
        method: 'DELETE',
        path: '/api/recipes/:id/ingredients/:ingredientId',
        description: 'Detach one ingredient from a recipe.'
      }
    ]
  },

  {
    name: 'Ingredients',
    key: 'ingredients',
    basePath: '/api/ingredients',
    description:
      'A shared catalog of ingredients. An ingredient exists on its own and may be used ' +
      'by any number of recipes.',
    fields: [
      {
        name: 'id',
        type: 'number',
        example: 1,
        notes: 'Unique identifier. Assigned by the server; read-only.'
      },
      {
        name: 'name',
        type: 'string',
        example: 'Flour',
        notes: 'Required when creating an ingredient.'
      },
      {
        name: 'category',
        type: 'string',
        example: 'dry',
        allowed: ['dry', 'dairy', 'vegetable', 'fruit', 'meat', 'herb', 'spice', 'oil', 'sauce', 'legume'],
        notes: 'Required when creating an ingredient.'
      },
      {
        name: 'unit',
        type: 'string',
        example: 'g',
        allowed: ['g', 'ml', 'unit'],
        notes: 'The unit this ingredient is measured in.'
      },
      {
        name: 'caloriesPer100',
        type: 'number',
        example: 364,
        notes: 'Calories per 100 g / 100 ml / 1 unit.'
      },
      {
        name: 'vegan',
        type: 'boolean',
        example: true
      }
    ],
    queryParams: [
      {
        name: 'category',
        type: 'string',
        description: 'Keep only ingredients in this category (exact match).',
        example: '?category=dairy'
      },
      {
        name: 'vegan',
        type: 'boolean',
        description: 'Keep only vegan (true) or non-vegan (false) ingredients.',
        example: '?vegan=true'
      },
      {
        name: 'maxCalories',
        type: 'number',
        description: 'Keep only ingredients with at most this many calories per 100.',
        example: '?maxCalories=200'
      },
      {
        name: 'search',
        type: 'string',
        description: 'Keep only ingredients whose name contains this text (case-insensitive).',
        example: '?search=oil'
      },
      {
        name: 'sort',
        type: 'string',
        description: 'Order the results by a field. Prefix with "-" for descending order.',
        example: '?sort=-caloriesPer100'
      }
    ],
    endpoints: [
      { method: 'GET', path: '/api/ingredients', description: 'List all ingredients. Accepts the query parameters above.' },
      { method: 'GET', path: '/api/ingredients/:id', description: 'Get one ingredient by id.' },
      {
        method: 'GET',
        path: '/api/ingredients/:id/recipes',
        description: 'List every recipe that uses this ingredient.'
      },
      { method: 'POST', path: '/api/ingredients', description: 'Create an ingredient. Send the fields in the request body.' },
      { method: 'PUT', path: '/api/ingredients/:id', description: 'Replace an ingredient entirely.' },
      { method: 'PATCH', path: '/api/ingredients/:id', description: 'Update only the fields you send.' },
      {
        method: 'DELETE',
        path: '/api/ingredients/:id',
        description: 'Remove an ingredient. It is also detached from every recipe that used it.'
      }
    ]
  }
];

/**
 * How the two resources are connected. Rendered as its own section on the page,
 * because two of the game stages depend on understanding it.
 */
const relationship = {
  summary:
    'A recipe holds an array of ingredient ids. One ingredient can appear in many recipes, ' +
    'and one recipe uses many ingredients.',
  from: 'Recipes.ingredientIds',
  to: 'Ingredients.id',
  kind: 'many-to-many',
  navigate: [
    {
      direction: 'Recipe → its ingredients',
      path: 'GET /api/recipes/:id/ingredients',
      example: 'GET /api/recipes/2/ingredients'
    },
    {
      direction: 'Ingredient → the recipes using it',
      path: 'GET /api/ingredients/:id/recipes',
      example: 'GET /api/ingredients/13/recipes'
    }
  ]
};

/** Status codes this API returns, shown as a reference table on the page. */
const statusCodes = [
  { code: 200, name: 'OK', when: 'A successful GET, PUT or PATCH.' },
  { code: 201, name: 'Created', when: 'A successful POST. The new resource is returned in the body.' },
  { code: 204, name: 'No Content', when: 'A successful DELETE. The response has no body.' },
  { code: 400, name: 'Bad Request', when: 'Required fields are missing, or no updatable field was sent.' },
  { code: 404, name: 'Not Found', when: 'No resource exists at that id or path.' },
  { code: 409, name: 'Conflict', when: 'The ingredient is already attached to that recipe.' }
];

module.exports = { schemas, relationship, statusCodes };

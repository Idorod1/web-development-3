/**
 * Compares a submitted request against a stage's expected answer.
 *
 * SERVER ONLY. The verdict and its message are the only things the client ever
 * learns — never the expectation itself. Messages say WHICH PART is wrong,
 * never what the right value would have been.
 */

/** "/api/recipes/5/" -> ["api","recipes","5"] */
function segments(path) {
  return String(path || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);
}

/**
 * Match a concrete path against a pattern that may contain :params.
 * @returns {{ matched: boolean, params: Object }}
 */
function matchPath(pattern, actual) {
  const want = segments(pattern);
  const got = segments(actual);
  if (want.length !== got.length) return { matched: false, params: {} };

  const params = {};
  for (let i = 0; i < want.length; i += 1) {
    if (want[i].startsWith(':')) {
      params[want[i].slice(1)] = got[i];
    } else if (want[i].toLowerCase() !== got[i].toLowerCase()) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}

/** Equality that tolerates the string/number blur of form input. */
function looseEqual(expected, actual) {
  if (expected === actual) return true;
  if (typeof expected === 'number' || typeof actual === 'number') {
    return Number(expected) === Number(actual);
  }
  if (typeof expected === 'boolean' || typeof actual === 'boolean') {
    return String(expected) === String(actual);
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return (
      expected.length === actual.length &&
      expected.every((value, i) => looseEqual(value, actual[i]))
    );
  }
  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    const keys = Object.keys(expected);
    return (
      keys.length === Object.keys(actual).length &&
      keys.every((key) => looseEqual(expected[key], actual[key]))
    );
  }
  return String(expected).toLowerCase() === String(actual).toLowerCase();
}

/**
 * Check a submission against a stage.
 * @returns {{ correct: boolean, message: string }}
 */
function check(stage, submission) {
  const expected = stage.expected;
  const submitted = submission || {};

  // --- method ---
  const method = String(submitted.method || '').toUpperCase();
  if (method !== expected.method) {
    return {
      correct: false,
      message: `The ${method || 'chosen'} method is not the right one for this action. Think about what the request is doing to the resource.`
    };
  }

  // --- path ---
  const { matched, params } = matchPath(expected.path, submitted.path);
  if (!matched) {
    return {
      correct: false,
      message:
        'The path does not point at the right resource. Check the schemas page for the available endpoints.'
    };
  }

  // --- route parameters ---
  if (expected.route) {
    const wrong = Object.keys(expected.route).find(
      (key) => !looseEqual(expected.route[key], params[key])
    );
    if (wrong) {
      return {
        correct: false,
        message: `The path has the right shape, but the "${wrong}" in it is not the one the scenario asks for.`
      };
    }
  }

  // --- query parameters ---
  const wantQuery = expected.query || {};
  const gotQuery = submitted.query || {};
  const wantKeys = Object.keys(wantQuery);
  const gotKeys = Object.keys(gotQuery).filter((key) => gotQuery[key] !== '');

  const missing = wantKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(gotQuery, key) || gotQuery[key] === ''
  );
  if (missing.length) {
    return {
      correct: false,
      message:
        missing.length === 1
          ? 'The request is missing a query parameter. One condition in the scenario is not expressed yet.'
          : `The request is missing ${missing.length} query parameters. Each condition in the scenario needs its own.`
    };
  }

  const extra = gotKeys.filter((key) => !wantKeys.includes(key));
  if (extra.length) {
    return {
      correct: false,
      message: `The request sends a query parameter this stage does not ask for: "${extra[0]}".`
    };
  }

  const wrongValue = wantKeys.find((key) => !looseEqual(wantQuery[key], gotQuery[key]));
  if (wrongValue) {
    return {
      correct: false,
      message: `The "${wrongValue}" parameter is there, but its value does not match the scenario.`
    };
  }

  // --- request body ---
  if (expected.body) {
    const body = submitted.body;
    if (!body || typeof body !== 'object') {
      return {
        correct: false,
        message: 'This action needs a JSON request body, and none was sent.'
      };
    }

    const wantBodyKeys = Object.keys(expected.body);
    const missingFields = wantBodyKeys.filter(
      (key) => !Object.prototype.hasOwnProperty.call(body, key)
    );
    if (missingFields.length) {
      return { correct: false, message: `The body is missing the "${missingFields[0]}" field.` };
    }

    const extraFields = Object.keys(body).filter((key) => !wantBodyKeys.includes(key));
    if (extraFields.length) {
      return {
        correct: false,
        message: `The body contains a field this stage does not ask you to send: "${extraFields[0]}".`
      };
    }

    const wrongField = wantBodyKeys.find((key) => !looseEqual(expected.body[key], body[key]));
    if (wrongField) {
      return {
        correct: false,
        message: `The "${wrongField}" field in the body does not have the value the scenario describes.`
      };
    }
  } else if (submitted.body && Object.keys(submitted.body).length) {
    return { correct: false, message: 'This action does not need a request body.' };
  }

  return {
    correct: true,
    message: stage.expectsErrorResponse
      ? 'Correct — and notice the status code: the server told you the resource does not exist.'
      : 'Correct. The request matches what the scenario asked for.'
  };
}

module.exports = { check, matchPath };

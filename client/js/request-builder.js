/**
 * Reads the form controls into a plain request object, keeps the live preview
 * in sync, and manages the query-parameter rows.
 *
 * Knows nothing about whether a request is correct — that is the server's job.
 */

const RequestBuilder = (function () {
  const methodEl = document.getElementById('method');
  const pathEl = document.getElementById('path');
  const queryRowsEl = document.getElementById('query-rows');
  const bodyEl = document.getElementById('body');
  const bodyErrorEl = document.getElementById('body-error');
  const previewEl = document.getElementById('request-preview');
  const addParamBtn = document.getElementById('add-param');
  const querySection = document.getElementById('query-section');
  const bodySection = document.getElementById('body-section');

  let onChange = function () {};

  function createRow(key, value) {
    const row = document.createElement('div');
    row.className = 'query-row';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'query-key';
    keyInput.placeholder = 'name';
    keyInput.autocomplete = 'off';
    keyInput.spellcheck = false;
    keyInput.value = key || '';

    const eq = document.createElement('span');
    eq.className = 'query-eq';
    eq.textContent = '=';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'query-value';
    valueInput.placeholder = 'value';
    valueInput.autocomplete = 'off';
    valueInput.spellcheck = false;
    valueInput.value = value || '';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'query-remove';
    remove.setAttribute('aria-label', 'Remove parameter');
    remove.textContent = '×';
    remove.addEventListener('click', function () {
      row.remove();
      if (!queryRowsEl.querySelector('.query-row')) addRow();
      update();
    });

    keyInput.addEventListener('input', update);
    valueInput.addEventListener('input', update);

    row.append(keyInput, eq, valueInput, remove);
    queryRowsEl.appendChild(row);
    return row;
  }

  function addRow(key, value) {
    return createRow(key, value);
  }

  function clearRows() {
    queryRowsEl.innerHTML = '';
  }

  /** Query pairs with a non-empty name, in the order they appear. */
  function readQuery() {
    const query = {};
    queryRowsEl.querySelectorAll('.query-row').forEach(function (row) {
      const key = row.querySelector('.query-key').value.trim();
      const value = row.querySelector('.query-value').value.trim();
      if (key) query[key] = value;
    });
    return query;
  }

  /** Parse the body textarea. Returns { ok, value, error }. */
  function readBody() {
    const raw = bodyEl.value.trim();
    if (!raw) return { ok: true, value: undefined };
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function showBodyError(message) {
    if (message) {
      bodyErrorEl.textContent = message;
      bodyErrorEl.hidden = false;
      bodyEl.classList.add('is-invalid');
    } else {
      bodyErrorEl.hidden = true;
      bodyEl.classList.remove('is-invalid');
    }
  }

  function queryString(query) {
    const params = new URLSearchParams(query);
    const str = params.toString();
    return str ? '?' + str : '';
  }

  function update() {
    const method = methodEl.value;
    const path = pathEl.value.trim();
    const query = readQuery();
    previewEl.textContent = method + ' ' + (path || '/api/') + queryString(query);

    const body = readBody();
    showBodyError(body.ok ? null : 'Invalid JSON: ' + body.error);

    onChange();
  }

  /** The request the player has assembled. */
  function read() {
    const body = readBody();
    return {
      method: methodEl.value,
      path: pathEl.value.trim(),
      query: readQuery(),
      body: body.ok ? body.value : undefined,
      bodyValid: body.ok,
      bodyError: body.ok ? null : body.error
    };
  }

  function reset() {
    methodEl.value = 'GET';
    pathEl.value = '';
    bodyEl.value = '';
    clearRows();
    addRow();
    showBodyError(null);
    update();
  }

  /** Show or hide the optional sections based on what the stage needs. */
  function configure(inputs) {
    const needsQuery = Boolean(inputs && inputs.query);
    const needsBody = Boolean(inputs && inputs.body);
    querySection.hidden = !needsQuery;
    bodySection.hidden = !needsBody;
  }

  addParamBtn.addEventListener('click', function () {
    const row = addRow();
    row.querySelector('.query-key').focus();
    update();
  });

  methodEl.addEventListener('change', update);
  pathEl.addEventListener('input', update);
  bodyEl.addEventListener('input', update);

  addRow();
  update();

  return {
    read: read,
    reset: reset,
    configure: configure,
    update: update,
    queryString: queryString,
    onChange: function (fn) {
      onChange = fn;
    }
  };
})();

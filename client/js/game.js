/**
 * Game controller.
 *
 * Sends every attempt to the server, which decides whether it is correct and
 * performs the real API call. This file deliberately contains no knowledge of
 * what any stage's answer is — it only asks and renders what comes back.
 *
 * Stage changes rewrite the existing DOM; the page is never reloaded.
 */

(function () {
  const form = document.getElementById('request-form');
  const sendBtn = document.getElementById('send');
  const resetBtn = document.getElementById('reset');
  const prevBtn = document.getElementById('prev-stage');
  const nextBtn = document.getElementById('next-stage');
  const completedEl = document.getElementById('completed');

  const stageCard = document.getElementById('stage-card');
  const titleEl = document.getElementById('stage-title');
  const scenarioEl = document.getElementById('stage-scenario');
  const conceptsEl = document.getElementById('stage-concepts');
  const hintEl = document.getElementById('stage-hint');
  const orderEl = document.getElementById('stage-order');
  const counterEl = document.getElementById('stage-counter');
  const totalEl = document.getElementById('stage-total');
  const progressFill = document.getElementById('progress-fill');

  const state = {
    stageId: Number(stageCard.dataset.stageId),
    order: Number(orderEl.textContent),
    total: Number(totalEl.textContent),
    solved: []
  };

  function renderStage(stage) {
    state.stageId = stage.id;
    state.order = stage.order;
    state.total = stage.total;

    stageCard.dataset.stageId = stage.id;
    titleEl.textContent = stage.title;
    scenarioEl.textContent = stage.scenario;
    hintEl.textContent = stage.hint;
    orderEl.textContent = stage.order;
    counterEl.textContent = stage.order;
    totalEl.textContent = stage.total;

    conceptsEl.innerHTML = '';
    stage.concepts.forEach(function (concept) {
      const li = document.createElement('li');
      li.className = 'concept';
      li.textContent = concept;
      conceptsEl.appendChild(li);
    });

    const openHint = stageCard.querySelector('.hint');
    if (openHint) openHint.open = false;

    RequestBuilder.configure(stage.inputs);
    RequestBuilder.reset();
    ResponseView.clear();
    updateNav();
  }

  function updateProgress() {
    const done = state.solved.length;
    progressFill.style.width = (done / state.total) * 100 + '%';
  }

  function updateNav() {
    prevBtn.disabled = state.order <= 1;
    const isSolved = state.solved.indexOf(state.stageId) !== -1;
    nextBtn.hidden = !isSolved || state.order >= state.total;
    completedEl.hidden = !(state.solved.length === state.total);
    updateProgress();
  }

  async function loadStage(order) {
    if (order < 1 || order > state.total) return;
    try {
      const res = await fetch('/api/game/stages/' + order);
      if (!res.ok) throw new Error('Could not load stage ' + order);
      const stage = await res.json();
      renderStage(stage);
    } catch (err) {
      ResponseView.showLocalError(err.message);
    }
  }

  async function submit() {
    const request = RequestBuilder.read();

    if (!request.path) {
      ResponseView.showLocalError('Enter a request path before sending.');
      return;
    }
    if (!request.bodyValid) {
      ResponseView.showLocalError('The request body is not valid JSON: ' + request.bodyError);
      return;
    }

    sendBtn.disabled = true;
    ResponseView.setPending(true);

    try {
      // The stage id travels with every attempt; the server checks it.
      const res = await fetch('/api/game/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: state.stageId,
          method: request.method,
          path: request.path,
          query: request.query,
          body: request.body
        })
      });

      const result = await res.json();

      // result.response is the real API call the server performed on our behalf.
      if (result.response) {
        ResponseView.showResponse(result.response.status, result.response.data);
      }
      ResponseView.showVerdict(result.correct, result.message);

      if (result.correct && state.solved.indexOf(state.stageId) === -1) {
        state.solved.push(state.stageId);
      }
      updateNav();
    } catch (err) {
      ResponseView.showLocalError('Request failed: ' + err.message);
    } finally {
      sendBtn.disabled = false;
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submit();
  });

  resetBtn.addEventListener('click', function () {
    RequestBuilder.reset();
    ResponseView.clear();
  });

  nextBtn.addEventListener('click', function () {
    loadStage(state.order + 1);
  });

  prevBtn.addEventListener('click', function () {
    loadStage(state.order - 1);
  });

  // The first stage is rendered by EJS, so its inputs come from the markup.
  RequestBuilder.configure({
    query: stageCard.dataset.needsQuery === 'true',
    body: stageCard.dataset.needsBody === 'true'
  });
  updateNav();
})();

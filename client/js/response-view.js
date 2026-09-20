/**
 * Renders the server's answer: the real HTTP status code, the returned data,
 * and the success / error verdict that the server decided.
 */

const ResponseView = (function () {
  const panel = document.getElementById('response-panel');
  const statusEl = document.getElementById('status-code');
  const bodyEl = document.getElementById('response-body');
  const feedback = document.getElementById('feedback');
  const verdictEl = document.getElementById('verdict');
  const verdictMessageEl = document.getElementById('verdict-message');

  function statusClass(code) {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  }

  const STATUS_TEXT = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    500: 'Internal Server Error'
  };

  /** Show the real HTTP response the API returned. */
  function showResponse(status, data) {
    statusEl.textContent = status + (STATUS_TEXT[status] ? ' ' + STATUS_TEXT[status] : '');
    statusEl.className = 'status-code ' + statusClass(status);

    if (data === undefined || data === null || data === '') {
      bodyEl.textContent = '(no content)';
    } else if (typeof data === 'string') {
      bodyEl.textContent = data;
    } else {
      bodyEl.textContent = JSON.stringify(data, null, 2);
    }

    panel.hidden = false;
  }

  /** Show the server's verdict for this attempt. */
  function showVerdict(correct, message) {
    feedback.hidden = false;
    feedback.className = 'feedback ' + (correct ? 'is-correct' : 'is-incorrect');
    verdictEl.textContent = correct ? 'Correct' : 'Not quite';
    verdictMessageEl.textContent = message || '';
  }

  /** Client-side problem — nothing was sent, so there is no status code. */
  function showLocalError(message) {
    feedback.hidden = false;
    feedback.className = 'feedback is-incorrect';
    verdictEl.textContent = 'Cannot send';
    verdictMessageEl.textContent = message;
    panel.hidden = true;
  }

  function clear() {
    feedback.hidden = true;
    panel.hidden = true;
    bodyEl.textContent = '';
    statusEl.textContent = '';
    statusEl.className = 'status-code';
  }

  function setPending(isPending) {
    if (isPending) {
      feedback.hidden = false;
      feedback.className = 'feedback is-pending';
      verdictEl.textContent = 'Sending…';
      verdictMessageEl.textContent = '';
    }
  }

  return {
    showResponse: showResponse,
    showVerdict: showVerdict,
    showLocalError: showLocalError,
    setPending: setPending,
    clear: clear
  };
})();

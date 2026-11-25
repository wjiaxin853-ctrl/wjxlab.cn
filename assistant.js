const askForm = document.querySelector('.assistant-form');
const questionInput = askForm.elements.question;
const submitButton = askForm.querySelector('button');
const exampleButtons = document.querySelectorAll('.assistant-examples button');
const responsePanel = document.querySelector('.assistant-response');
const statusMessage = responsePanel.querySelector('.assistant-status');
const result = responsePanel.querySelector('.assistant-result');
const answer = result.querySelector('.assistant-answer');
const sourceGroup = result.querySelector('.assistant-sources');
const sourceList = sourceGroup.querySelector('ul');

function showStatus(message, state) {
  result.hidden = true;
  statusMessage.hidden = false;
  statusMessage.textContent = message;
  responsePanel.dataset.state = state;
}

function showAnswer(text, sources) {
  answer.textContent = text;
  sourceList.replaceChildren();

  if (Array.isArray(sources)) {
    for (const source of sources) {
      const {title, href} = source ?? {};
      if (typeof title !== 'string' || !title.trim() || typeof href !== 'string') continue;
      if (!/^#[a-z][a-z0-9_-]*$/i.test(href) || !document.getElementById(href.slice(1))) continue;

      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = title;
      item.append(link);
      sourceList.append(item);
    }
  }

  sourceGroup.hidden = !sourceList.childElementCount;
  statusMessage.hidden = true;
  result.hidden = false;
  responsePanel.dataset.state = 'answer';
}

questionInput.addEventListener('input', () => {
  questionInput.removeAttribute('aria-invalid');
});

for (const button of exampleButtons) {
  button.addEventListener('click', () => {
    questionInput.value = button.textContent.trim();
    questionInput.focus();
    askForm.requestSubmit();
  });
}

askForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;

  const question = questionInput.value.trim();
  const length = Array.from(question).length;
  if (length < 2 || length > 160) {
    questionInput.setAttribute('aria-invalid', 'true');
    showStatus('请输入 2–160 个字符的问题。', 'error');
    questionInput.focus();
    return;
  }

  questionInput.removeAttribute('aria-invalid');
  submitButton.disabled = true;
  for (const button of exampleButtons) button.disabled = true;
  showStatus('正在查找资料并生成回答…', 'loading');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question}),
      signal: controller.signal
    });

    if (response.status === 429) {
      showStatus('请求较多，请稍后再试。', 'error');
      return;
    }

    if (!response.ok) throw new Error('Request failed');
    const payload = await response.json();
    if (typeof payload?.answer !== 'string' || !payload.answer.trim()) {
      throw new Error('Empty answer');
    }
    showAnswer(payload.answer, payload.sources);
  } catch (error) {
    const message = error.name === 'AbortError'
      ? '等待回答超时，请重新提问。'
      : '暂时无法获取回答，请稍后重试。';
    showStatus(message, 'error');
  } finally {
    clearTimeout(timeout);
    submitButton.disabled = false;
    for (const button of exampleButtons) button.disabled = false;
  }
});

questionInput.disabled = false;
submitButton.disabled = false;
for (const button of exampleButtons) button.disabled = false;

'use strict';

const roleSwitchSpans = document.querySelectorAll('.role-switch');
const messageDeleteSpans = document.querySelectorAll('.message-delete');
const textAreas = document.querySelectorAll('textarea');
const inputField = document.getElementById('input');
const messagesContainer = document.getElementById('messages-container');
const addMessageButton = document.getElementById('add-message');
const systemTextarea = document.getElementById('system');
const submitButton = document.getElementById('submit');
const apiKeyInput = document.getElementById('apiKey');

const downloadButton = document.getElementById('download');
downloadButton.addEventListener('click', downloadChats);

function downloadChats() {
  // combine text from each textarea, separated by a ---
  const text = Array.from(document.querySelectorAll('textarea'))
    .map(t => '*' + t.parentElement.querySelector('button').getAttribute('data-role-type').toUpperCase() + '*' + '\n\n' + t.value)
    .join('\n\n---\n\n');
  const date = new Date();
  const dateString = date.toISOString().split('T')[0];
  const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `chats-${dateString}-${timeString}.md`;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
  a.click();
}

const systemRole = 'system';
const userRole = 'user';
const assistantRole = 'assistant';

let apiKey = localStorage.getItem('apiKey') || '';

if (apiKey) apiKeyInput.value = apiKey;

apiKeyInput.addEventListener('input', () => {
  apiKey = apiKeyInput.value;
  localStorage.setItem('apiKey', apiKey);
});

roleSwitchSpans.forEach(addUserSwitchEventListener);
messageDeleteSpans.forEach(messageDeleteEventListener);
textAreas.forEach(textAreaResizeEventListener);

addMessageButton.addEventListener('click', () => {
  addMessage();
});

function addUserSwitchEventListener(userSwitch) {
  userSwitch.addEventListener('click', () => {
    const isAssistant = userSwitch.dataset.roleType === 'assistant';
    userSwitch.textContent = isAssistant ? 'USER' : 'ASSISTANT';
    userSwitch.dataset.roleType = isAssistant ? 'user' : 'assistant';
  });
}

function messageDeleteEventListener(messageDelete) {
  messageDelete.addEventListener('click', () => {
    deleteMessage(messageDelete);
  });
}

function textAreaResizeEventListener(textArea) {
  textArea.addEventListener('input', () => {
    resizeTextarea(textArea);
  });
}

function resizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
  textarea.rows = textarea.value.split('\n').length > 1 ? textarea.value.split('\n').length : 1;
}

function addMessage(message = '', setAsAssistant = false) {
  const allRoles = document.querySelectorAll('.role-switch');
  const lastRoleType = allRoles[allRoles.length - 1]?.getAttribute('data-role-type') || assistantRole;
  const isUser = lastRoleType === userRole;
  const newRole = setAsAssistant ? assistantRole : isUser ? assistantRole : userRole;

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group mb-3';

  const switchRoleButton = document.createElement('button');
  switchRoleButton.className = 'btn btn-outline-secondary role-switch form-button';
  switchRoleButton.setAttribute('data-role-type', newRole);
  switchRoleButton.setAttribute('type', 'button');
  switchRoleButton.setAttribute('title', 'Switch Role');
  switchRoleButton.tabIndex = -1;
  switchRoleButton.textContent = newRole;
  addUserSwitchEventListener(switchRoleButton);

  const deleteMessageButton = document.createElement('button');
  deleteMessageButton.className = 'btn btn-outline-secondary message-delete form-button';
  const emDash = String.fromCharCode(0x2014);
  deleteMessageButton.textContent = emDash;
  deleteMessageButton.tabIndex = -1;
  deleteMessageButton.setAttribute('type', 'button');
  deleteMessageButton.setAttribute('title', 'Delete Message');
  messageDeleteEventListener(deleteMessageButton);

  const messageInput = document.createElement('textarea');
  messageInput.className = 'form-control message-text';
  messageInput.placeholder = `Enter ${isUser ? 'a user' : 'an assistant'} message here.`;
  messageInput.setAttribute('aria-label', 'message');
  messageInput.setAttribute('rows', '1');
  messageInput.setAttribute('spellcheck', 'false');
  textAreaResizeEventListener(messageInput);

  inputGroup.append(switchRoleButton, messageInput, deleteMessageButton);
  messagesContainer.append(inputGroup);

  messageInput.value = message;
  messageInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function addSpinner() {
  disableOrEnableElements(true);
  const placeholderDiv = document.createElement('div');
  placeholderDiv.id = 'placeholderDiv';

  placeholderDiv.className = 'd-flex align-items-center';

  const loadingParagraph = document.createElement('p');
  loadingParagraph.textContent = 'Fetching response...';

  const spinnerDiv = document.createElement('div');
  spinnerDiv.className = 'spinner-border ms-auto';
  spinnerDiv.setAttribute('role', 'status');
  spinnerDiv.setAttribute('aria-hidden', 'true');

  placeholderDiv.appendChild(loadingParagraph);
  placeholderDiv.appendChild(spinnerDiv);

  messagesContainer.appendChild(placeholderDiv);
}

function removeSpinner() {
  const placeholder = document.getElementById('placeholderDiv');
  if (placeholder) placeholder.remove();
  disableOrEnableElements(false);
}

function disableOrEnableElements(disable = true) {
  const elements = document.querySelectorAll('button, textarea');
  // from elements exclude elements with class 'form-button'
  const filteredElements = Array.from(elements).filter(element => !element.classList.contains('is-disabled'));

  filteredElements.forEach(element => {
    element.disabled = disable;
  });
}

function typeText(text, textArea) {
  let index = 0;
  let inputText = text;
  type(inputText);
  function type() {
    if (index < inputText.length) {
      textArea.value += inputText.charAt(index);
      index++;
      setTimeout(type, 10); // delay of 100ms between characters
    }
  }
}

function deleteMessage(messageDelete) {
  try {
    messageDelete.parentElement.remove();
  } catch (err) {
    console.error('Error deleting message:', err);
  }
}

const form = document.querySelector('form');
let msg = '';

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const messages = [];
  const messageInputs = document.querySelectorAll('#messages-container .input-group');

  messageInputs.forEach(input => {
    const role = input.querySelector('button').dataset.roleType;
    const content = input.querySelector('textarea').value;
    if (!content.trim()) return;
    messages.push({ role, content });
  });

  // stop if there are no messages
  if (messages.length === 0) return;
  msg = messages;

  // Bearer
  const model = 'gpt-3.5-turbo';
  try {
    addSpinner();
    const response = await openAIChatComplete(apiKey, model, messages);
    console.log(response);
    addMessage(response, true);
  } catch (error) {
    console.log(error);
  } finally {
    removeSpinner();
  }

  const data = {
    messages,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    model: 'gpt-3.5-turbo',
    stream: true,
  };

  console.log(JSON.stringify(data));
});

async function openAIChatComplete(apiKey, model, message) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const requestData = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: message,
    }),
  };

  const response = await fetch(url, requestData);

  // check for response errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.error.code}\n${error.error.message}`);
  }

  const data = await response.json();
  const responseText = data.choices[0].message.content;
  return responseText.trim();
}

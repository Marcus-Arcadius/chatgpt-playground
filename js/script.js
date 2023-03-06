'use strict';

const chatGPTForm = document.getElementById('chatgpt-form');
const roleSwitchSpans = document.querySelectorAll('.role-switch');
const messageDeleteSpans = document.querySelectorAll('.message-delete');
const textAreas = document.querySelectorAll('textarea');
const inputField = document.getElementById('input');
const messagesContainer = document.getElementById('messages-container');
const addMessageButton = document.getElementById('add-message');
const systemTextarea = document.getElementById('system');
const submitButton = document.getElementById('submit');
const apiKeyInput = document.getElementById('apiKey');
const downloadFileBrand = 'Downloaded from [Aneejian ChatGPT Playground](https://aneejian.com/)';
const model = 'gpt-3.5-turbo';

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">    
    <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@1.*/css/pico.min.css">
    <title>Aneejian - ChatGPT Playground Export</title>
</head>
<body>
    <main>
        <div class="container">
            <!-- replace me  -->
        </div>
    </main>
    <footer>
        <div class="container">
            <p class="text-center">
                <a href="https://aneejian.com/" target="_blank">Aneejian</a> - <a href="https://aneejian.com/chatgpt-playground/" target="_blank">ChatGPT Playground</a>
            </p>
    </footer>
</body>
</html>`;

const pythonCodeTemplate = `
import openai
API_KEY = '<!-- api key  -->'
openai.api_key = API_KEY
completion = openai.ChatCompletion.create(
  model="<!-- model name  -->", 
  messages=<!-- messages  -->
)
`;

const downloadMarkdownButton = document.getElementById('downloadMarkdown');
downloadMarkdownButton.addEventListener('click', downloadMarkdown);

const downloadHTMLButton = document.getElementById('downloadHTML');
downloadHTMLButton.addEventListener('click', downloadHTML);

const downloadPythonButton = document.getElementById('downloadPython');
downloadPythonButton.addEventListener('click', downloadPython);

function getChats() {
  const textAreas = document.querySelectorAll('textarea');
  if (!textAreas.length) {
    alert('No messages to download.');
    return;
  }
  const text = Array.from(textAreas)
    .map(t => {
      const value = t.value.trim();
      if (!value) return '';
      const roleType = t.parentElement.querySelector('button').getAttribute('data-role-type').toUpperCase();
      return `**${roleType}**\n\n${value}\n\n---\n\n`;
    })
    .join('');
  return text;
}

function getDateTimeStrings() {
  const now = new Date();
  const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const dateString = now.toLocaleDateString(undefined, dateOptions).replace(/\//g, '-');
  const timeString = now.toLocaleTimeString(undefined, timeOptions).replace(/:/g, '-');
  return { dateString, timeString };
}

function createDownloadLink(filename, data, type) {
  const blob = new Blob([data], {
    type,
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

function downloadMarkdown() {
  const text = getChats();
  if (!text.trim()) {
    alert('No messages to download.');
    return;
  }
  const { dateString, timeString } = getDateTimeStrings();
  const filename = `Aneejian-ChatGPT-Playground-${dateString}-${timeString}.md`;
  const markdownText = `${text}\n\n${downloadFileBrand} on ${dateString} at ${timeString}`;
  createDownloadLink(filename, markdownText, 'text/plain');
}

function downloadHTML() {
  let text = getChats();
  if (!text.trim()) {
    alert('No messages to download.');
    return;
  }
  const { dateString, timeString } = getDateTimeStrings();
  const filename = `Aneejian-ChatGPT-Playground-${dateString}-${timeString}.html`;
  text = marked.parse(`${text}\n\n${downloadFileBrand} on ${dateString} at ${timeString}`);
  text = htmlTemplate.replace('<!-- replace me  -->', text);
  createDownloadLink(filename, text, 'text/html');
}

function downloadPython() {
  const messages = getMessages();
  if (!messages.length) {
    alert('No messages to download.');
    return;
  }
  const pythonCode = pythonCodeTemplate
    .replace('<!-- model name  -->', model)
    .replace('<!-- api key  -->', apiKey)
    .replace('<!-- messages  -->', JSON.stringify(messages));
  const { dateString, timeString } = getDateTimeStrings();
  const filename = `Aneejian-ChatGPT-Playground-${dateString}-${timeString}.py`;
  createDownloadLink(filename, pythonCode, 'text/html');
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
    const isAssistant = userSwitch.dataset.roleType === assistantRole;
    userSwitch.textContent = isAssistant ? userRole : assistantRole;
    userSwitch.dataset.roleType = isAssistant ? userRole : assistantRole;
    const textarea = userSwitch.parentElement.querySelector('textarea');
    textarea.placeholder = `Enter ${userSwitch.dataset.roleType === userRole ? 'a user' : 'an assistant'} message here.`;
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
  textArea.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.keyCode === 13) {
      event.preventDefault();
      chatGPTForm.submit.click();
    }
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
  messageInput.placeholder = `Enter ${newRole === userRole ? 'a user' : 'an assistant'} message here.`;
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

function getMessages() {
  const messages = [];
  const messageInputs = document.querySelectorAll('#messages-container .input-group');
  messageInputs.forEach(input => {
    const role = input.querySelector('button').dataset.roleType;
    const content = input.querySelector('textarea').value;
    if (!content.trim()) return;
    messages.push({ role, content });
  });
  return messages;
}

chatGPTForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const messages = getMessages();

  // stop if there are no messages
  if (messages.length === 0) return;

  // Bearer
  try {
    addSpinner();
    const response = await openAIChatComplete(apiKey, model, messages);
    console.log(response);
    addMessage(response, true);
  } catch (error) {
    console.log(error);
  } finally {
    removeSpinner();
    addMessage();
    // scroll to the last textarea
    const lastMessage = document.querySelector('#messages-container .input-group:last-child textarea');
    lastMessage.focus();
  }

  // const data = {
  //   messages,
  //   temperature: 0.7,
  //   max_tokens: 256,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  //   model: 'gpt-3.5-turbo',
  //   stream: true,
  // };

  // console.log(JSON.stringify(data));
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

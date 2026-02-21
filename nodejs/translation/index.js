const pfs = require('fs');
const fs = pfs.promises;
const path = require('path');

// https://www.gaji.jp/blog/2025/03/05/22418/
function hasJapanese(target) {
  target = target.trim();

  if (/\p{Script=Hiragana}/u.test(target)) return true;
  if (/\p{Script=Katakana}/u.test(target)) return true;
  if (/\p{Script=Han}/u.test(target)) return true;

  return false;
};

function normalizeLongEnglishText(englishText, size = 66) {
  let messageText = '';
  let line = '';
  for (const word of englishText.replaceAll('＜', ' ＜ ').replaceAll('＞', ' ＞ ').split(' ')) {
    if (['＜', '＞'].includes(word.trim())) {
      if (word.trim() === '＜' && line.length > 0) {
        messageText += line.trim() + '\n';
        line = '＜';
      } else {
        line += word.trim();
      }
    } else {
      line += word + ' ';
      if (line.length >= size) {
        messageText += line.trim() + '\n';
        line = '';
      }
    }
  }
  messageText += line.trim();
  messageText = messageText.trim();

  return messageText;
}

function getFileType(fileName) {
  const baseName = path.basename(fileName);

  if (baseName === 'CommonEvents.json') return 'common';
  if (baseName.startsWith('Map')) return 'map';
  if (baseName === 'Armors.json') return 'armors';
  if (baseName === 'Enemies.json') return 'enemies';
  if (baseName === 'Items.json') return 'items';
  if (baseName === 'Skills.json') return 'skills';
  if (baseName === 'States.json') return 'states';
}

function extractMetadata(text) {
  const regExp = /<([^<>:]+)(:?)([^>]*)>/g;
  const meta = [];

  for (;;) {
    const match = regExp.exec(text);
    if (match) {
      if (match[2] === ":") {
        meta.push({ key: match[1], value: match[3] });
      }
    } else {
      break;
    }
  }

  return meta;
}

function processGenericObject(injection, object, filterKeys) {
  for (const [ key, value ] of Object.entries(object)) {
    if (filterKeys && !filterKeys.includes(key)) continue;

    if (typeof value === 'string') {
      if (key === 'name' && value.startsWith('---')) continue;
      if (hasJapanese(value)) {
        injection.text(value, { parentObject: object, key });
      }
    } else if (typeof value === 'object' && value) {
      processGenericObject(injection, value);
    }
  }
}

function processArray(injection, array) {
  processGenericObject(injection, array);
}

function processMeta(injection, command) {
  const meta = extractMetadata(command.parameters[0]);
  for (const { key, value } of meta) {
    if (hasJapanese(value)) {
      injection.meta(value, { key, commandObject: command });
    }
  }
}

function processNote(injection, parentObject, objectKey) {
  const meta = extractMetadata(parentObject[objectKey]);
  for (const { key, value } of meta) {
    if (hasJapanese(value)) {
      injection.meta(value, { key, parentObject, objectKey })
    }
  }
}

function processCommandList(injection, commandList) {
  let messageText = '';
  let messageCommandStartIndex = -1;


  for (let i = 0; i < commandList.length; i++) {
    const command = commandList[i];
    const { code, parameters } = command;

    if (code !== 401 && messageText.length > 0 && hasJapanese(messageText)) {
      // textList.push(messageText);
      injection.text(messageText, {
        parentObject: commandList,
        startIndex: messageCommandStartIndex,
        endIndex: i - 1,
        setCurrentIndex: (index) => i = index
      });
      messageText = '';
      messageCommandStartIndex = -1;
    }

    if (code === 357) {
      // plugin command
      processGenericObject(injection, parameters[3]);
    } else if (code === 657) {
      // only for editor display
      // do nothing
    } else if (code === 401) {
      // part of message
      messageText += parameters[0].trim();
      if (messageCommandStartIndex < 0) {
        messageCommandStartIndex = i;
      }
    } else if (code === 108 || code === 408) {
      // comment
      processMeta(injection, command);
    } else {
      processArray(injection, parameters);
    }
  }
}

function processEvent(injection, event) {
  for (const page of event.pages) {
    processCommandList(injection, page.list);
  }
}

function processArmor(injection, armor) {
  processGenericObject(injection, armor, ['name', 'description']);
}

function processEnemy(injection, enemy) {
  processGenericObject(injection, enemy, ['name']);

  if (enemy.note.includes('===EDM')) {
    const [ before, message, after ] = enemy.note.split('===EDM');

    // 段落ごとに翻訳テキストを分ける
    let newTexts = [];
    let isChanged = false;
    for (const block of message.split('\n\n')) {
      if (hasJapanese(block)) {
        injection.func(block.replaceAll('\n', ''), { setText: (text) => {
          newTexts.push(normalizeLongEnglishText(text, 80));
          isChanged = true;
        } });
      } else {
        newTexts.push(block);
      }
    }

    if (isChanged) {
      enemy.note = `${before}\n===EDM\n${newTexts.join('\n\n')}\n===EDM\n${after}`;
    }
  }
}

function processSkill(injection, skill) {
  processGenericObject(injection, skill, ['name', 'description', 'message1', 'message2']);
  processNote(injection, skill, 'note');
}

function processState(injection, state) {
  processGenericObject(injection, state, ['name', 'description', 'message1', 'message2', 'message3', 'message4']);
  processNote(injection, state, 'note');
}

function processScript(injection, script) {
  let block = '';
  let newScript = '';

  const processBlock = () => {
    if (block.length > 0) {
      if (hasJapanese(block)) {
        injection.func(block, { setText: (text) => newScript += text + '\n\n' });
      }
      block = '';
    }
  };
  
  for (const line of script.replaceAll('\r', '').split('\n')) {
    if (line.startsWith('@')) {
      processBlock();
      newScript += line + '\n';
    } else if (line.length > 0) {
      block += line.trim();
    } else {
      processBlock();
    }
  }

  processBlock();

  return newScript;
}

function processObject(injection, type, obj) {
  if (type === 'common') {
    for (const commonEvent of obj) {
      if (commonEvent) {
        processCommandList(injection, commonEvent.list);
      }
    }
  }
  else if (type === 'map') {
    for (const event of obj.events) {
      if (event) {
        processEvent(injection, event);
      }
    }
  }
  else if (type === 'armors' || type === 'items') {
    for (const armor of obj) {
      if (armor) {
        processArmor(injection, armor);
      }
    }
  }
  else if (type === 'enemies') {
    for (const enemy of obj) {
      if (enemy) {
        processEnemy(injection, enemy);
      }
    }
  }
  else if (type === 'skills') {
    for (const enemy of obj) {
      if (enemy) {
        processSkill(injection, enemy);
      }
    }
  }
  else if (type === 'states') {
    for (const enemy of obj) {
      if (enemy) {
        processState(injection, enemy);
      }
    }
  }
}

function proxyInjection(injection) {
  const proxyText = (text) => text
    .replaceAll('\\I [', '\\I[')
    .replaceAll('、', ', ')
    .replaceAll('プクーッ', 'Puff')
    .replaceAll('ギューッ', 'Squeeze')
    .replaceAll('ブブブブブブ‥', 'Vibbbbbbbbb...');

  return {
    text: function(text, options) { injection.text(proxyText(text), options) },
    meta: function(text, options) { injection.meta(proxyText(text), options) },
    func: function(text, options) { injection.func(proxyText(text), options) },
  }
}

async function extractTextFromFile(sourceFileName) {
  const textList = [];
  const injection = {
    text: function(text, { parentObject, key, startIndex, endIndex }) {
      textList.push(text);
    },
    meta: function(text, { key, commandObject, parentObject, objectKey }) {
      textList.push(text);
    },
    func: function(text, { setText }) {
      textList.push(text);
    },
  }

  const type = getFileType(sourceFileName);
  const json = await fs.readFile(sourceFileName, { encoding: 'utf-8' });
  if (type === 'script') {
    return processScript(injection, json);
  }

  const obj = JSON.parse(json);

  processObject(injection, type, obj);

  return textList.join('\n');
}

async function outputObj(sourceFileName, textFileName) {
  const json = await fs.readFile(sourceFileName, { encoding: 'utf-8' });
  const type = getFileType(sourceFileName);
  const textList = (await fs.readFile(textFileName, { encoding: 'utf-8' })).replaceAll('\r', '').split('\n');

  const nextText = () => {
    if (textList.length === 0) throw new Error('Lack of text!');
    return textList.shift();
  }

  const injection = {
    text: function(text, { parentObject, key, startIndex, endIndex, setCurrentIndex }) {
      if (parentObject) {
        if (typeof startIndex === 'number') {
          // message command
          const englishText = nextText();
          const messageText = normalizeLongEnglishText(englishText);

          const originalMessageCommand = parentObject[startIndex];
          const commands = messageText.split('\n').map((text) => {
            return { code: 401, indent: originalMessageCommand.indent, parameters: [text] };
          });
          const originalSize = endIndex - startIndex + 1;

          if (commands.length > 4) {
            console.warn('WARN! English message is too long');
            console.dir({ originalText: text, englishText });
          }

          parentObject.splice(startIndex, originalSize, ...commands);
          setCurrentIndex(startIndex + commands.length);
        } else if (typeof key !== 'undefined') {
          parentObject[key] = nextText();
        }
      }
    },
    meta: function(text, { key, commandObject, parentObject, objectKey }) {
      if (commandObject) {
        commandObject.parameters[0] = commandObject.parameters[0].replace(`<${key}:${text}>`, `<${key}:${nextText()}>`);
      } else {
        parentObject[objectKey] = parentObject[objectKey].replaceAll(`<${key}:${text}>`, `<${key}:${nextText()}>`);
      }
    },
    func: function(text, { setText }) {
      setText(nextText());
    },
  }
  
  if (type === 'script') {
    return processScript(injection, json);
  }
  const obj = JSON.parse(json);

  processObject(injection, type, obj);

  if (textList.length > 0) throw new Error('Remain text!');

  return obj;
}

function outputJsonArray(arr) {
  if (arr.length === 0) return '';

  return arr.map((item) => JSON.stringify(item)).join(',\n');
}

function outputJson(obj, type) {
  let json = '';

  if (type === 'map') {
    let events = '';
    const keyValues = [];
    for (const [ key, value ] of Object.entries(obj)) {
      if (key === 'events') {
        events += '[\n';
        events += outputJsonArray(value);
        events += '\n]';
      } else {
        keyValues.push(`"${key}":` + JSON.stringify(value));
      }
    }
    json = `{\n${keyValues.join(',')},\n"events":${events}\n}`;
  } else {
    // Pure array (ex: common events, armors, etc...)
    json = '[\n';
    json += outputJsonArray(obj);
    json += '\n]';
  }

  return json;
}

const [ , , mode, sourceFileName, dataFileName, outputFileName ] = process.argv;

if (mode === 'output') {
  extractTextFromFile(sourceFileName).then((data) => {
    pfs.writeFileSync(dataFileName, data);
  });
}
else if (mode === 'input') {
  outputObj(sourceFileName, dataFileName).then((obj) => {
    if (typeof obj === 'string') {
      pfs.writeFileSync(outputFileName, obj);
    } else {
      const json = outputJson(obj, getFileType(sourceFileName));
      pfs.writeFileSync(outputFileName, json);
    }
  });
}

// How to use
// node . output .\Map002.json .\text_ja.txt
// node . input .\Map002.json .\text_en.txt .\Map002_en.json

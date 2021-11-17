import * as Y from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { WebrtcProvider } from 'y-webrtc';

import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import '../node_modules/xterm/css/xterm.css';

import Cookies from 'js-cookie';

const ydoc = new Y.Doc();
const provider = new WebrtcProvider(window.location.pathname, ydoc);
const ytext = ydoc.getText('codemirror');

const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

if (!Cookies.get('name'))
  Cookies.set('name', 'User ' + Math.floor(Math.random() * 100));

provider.awareness.setLocalStateField('user', {
  name: Cookies.get('name'),
  color: color,
  colorLight: color,
});

const nameForum = document.getElementById('nameForum');
nameForum.value = Cookies.get('name');
nameForum.onchange = () => {
  provider.awareness.setLocalStateField('user', {
    name: nameForum.value,
  });
  Cookies.set('name', nameForum.value);
};

const view = new EditorView({
  state: EditorState.create({
    doc: ytext.toString(),
    extensions: [
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-editor': { outline: 'none' },
        '.cm-scroller': { overflow: 'auto', scrollbarWidth: 'thin' },
        '.cm-scroller::-webkit-scrollbar': { width: '10px' },
        '.cm-scroller::-webkit-scrollbar-track': { opacity: '0' },
        '.cm-scroller::-webkit-scrollbar-thumb': {
          minHeight: '20px',
          backgroundColor: '#ffffff20',
        },
      }),
      keymap.of(yUndoManagerKeymap),
      basicSetup,
      java(),
      yCollab(ytext, provider.awareness),
      keymap.of(indentWithTab),
      oneDark,
    ],
  }),
  parent: document.getElementById('editor'),
});

const terminal = new Terminal({
  fontFamily: '"Cascadia Code", Menlo, monospace',
  theme: {
    selection: '#44475A',
    background: '#282A36',
    foreground: '#F8F8F2',
    black: '#21222C',
    blue: '#BD93F9',
    cyan: '#8BE9FD',
    green: '#50FA7B',
    magenta: '#FF79C6',
    red: '#FF5555',
    white: '#F8F8F2',
    yellow: '#F1FA8C',
    brightBlack: '#6272A4',
    brightBlue: '#D6ACFF',
    brightCyan: '#A4FFFF',
    brightGreen: '#69FF94',
    brightMagenta: '#FF92DF',
    brightRed: '#FF6E6E',
    brightWhite: '#FFFFFF',
    brightYellow: '#FFFFA5',
  },
  cursorBlink: true,
});
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(document.getElementById('terminal'));
fitAddon.fit();
terminal.writeln(
  [
    '    Basicly Client Side (BCS) is a java IDE that attempts to combine the',
    '    power of a full fledged a editor with the ease of use of the browser',
    '',
    ' ┌ \x1b[1mFeatures\x1b[0m ──────────────────────────────────────────────────────────────────┐',
    ' │                                                                            │',
    ' │  \x1b[31;1mCollaboration just works                \x1b[32mPerformance\x1b[0m                       │',
    ' │  have collaborators join                 xterm.js, codemirror 6, yjs, and  │',
    ' │  alicalik1.github.io/insert_text_here    doppioJVM maximize performance    │',
    ' │                                                                            │',
    ' │  \x1b[33;1mAccessible                              \x1b[34mEasy to learn\x1b[0m                     │',
    ' │  Works on any browser                    Anyone can quickly learn BSC      │',
    ' │                                                                            │',
    ' └────────────────────────────────────────────────────────────────────────────┘',
  ].join('\n\r')
);

const worker = new Worker(new URL('./doppio.js', import.meta.url));
const button = document.getElementById('loadButton');
worker.onmessage = (e) => {
  switch (e.data[0]) {
    case 'changeButton':
      button.id = e.data[1];
      break;
    case 'out':
      terminal.write(e.data[1].replace('\n', '\n\r'));
      break;
    default:
      console.log('default in main from: ' + e.data);
  }
};

var command = '';
terminal.onData((e) => {
  terminal.write(e.replace('', '\b \b').replace(/\r/g, '\n\r'));
  for (let c in e) {
    switch (e[c]) {
      case '\r':
        if (button.id === 'runningButton')
          worker.postMessage(['in', command]);
        command = '';
        break;
      case '':
        if (command.length > 0) command = command.slice(0, -1);
        break;
      default:
        command += e[c];
    }
  }
});

terminal.attachCustomKeyEventHandler(e => {
  if (e.key === 'v' && e.ctrlKey)
    return false;
  if (e.key === 'c' && e.ctrlKey) {
    navigator.clipboard.writeText(terminal.getSelection());
    return false;
  }
});

button.onclick = () => {
  if (button.id == 'runButton' && view.state.doc.toString() != '') {
    button.id = 'compilingButton';
    terminal.reset();
    command = '';
    worker.postMessage(['compileAndRun', view.state.doc.toString()]);
  }
};
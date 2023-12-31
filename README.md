# codemirror-lang-vyper
A CodeMirror extension that provides Vyper syntax highlighting and language support. This is a work in progress.

Thank you to the Replit team for their work on the solidity plugin that the vyper plugin was based on: https://github.com/replit/codemirror-lang-solidity

![Screenshot](/public/cm-vyper-support.png)

## Usage

```ts
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { vyper } from '../src';

// Fetch the content of example.vy
fetch('/example.vy')
    .then(response => response.text())
    .then(doc => {
        new EditorView({
            state: EditorState.create({
                doc,  // use the fetched content here
                extensions: [
                    basicSetup,
                    keymap.of([indentWithTab]),
                    vyper,
                ],
            }),
            parent: document.querySelector('#editor'),
        });
    })
    .catch(error => {
        console.error("Error fetching the Vyper file:", error);
    });
```
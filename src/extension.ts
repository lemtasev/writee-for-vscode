// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	window.showInformationMessage('Congratulations, your extension "wtee" is now active!');
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = commands.registerCommand('wtee.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		window.showInformationMessage('Hello World from wtee!');
	});
	let showHover = commands.registerCommand('wtee.showHover', () => {
		let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
		let doc = editor.document;
		let docContent = doc.getText();
		let length = docContent.length;
		window.showInformationMessage(`字数：${length}`);
	});

	let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);
	context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);
	// add to a list of disposables which are disposed when this extension
    // is deactivated again.
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
// export function deactivate() {
// 	window.showInformationMessage('wtee is deactivate!');
// }


export class WordCounter {

    private _statusBarItem: StatusBarItem | undefined;

    public updateWordCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        if (doc.languageId === "plaintext") {
            let {chinese, all} = this._getWordCount(doc);

            // Update the status bar
            this._statusBarItem.text = `$(pencil) 中 ${chinese} 字，共 ${all} 字`;
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument): {chinese: number, all: number} {
        let docContent = doc.getText();

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/\s+/g, '');
        let all = docContent.length;
        docContent = docContent.replace(/[^\u4e00-\u9fa5]/g, '');
        let chinese = docContent.length;
        return {chinese, all};
    }

    public dispose() {
		if (this._statusBarItem) {
            this._statusBarItem.dispose();
        }
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
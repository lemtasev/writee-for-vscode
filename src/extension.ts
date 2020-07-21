// import * as vscode from 'vscode';
import { window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, languages, env, QuickPickItem, Color, ViewColumn, Uri } from 'vscode';
import * as path from 'path';

export function activate(context: ExtensionContext) {
    window.showInformationMessage('writee已激活！🤩');
    console.log(`user-language: ${env.language}`);

    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    let showCounnt = commands.registerCommand('writee.showCounnt', () => {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        let doc = editor.document;
        let { chinese, all } = wordCounter._getWordCount(doc);
        window.showInformationMessage(`中文字数：${chinese}，全文字数：${all}`);
    });

    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);
    context.subscriptions.push(showCounnt);

    initTest(context);
}

function initTest(context: ExtensionContext) {
    languages.registerHoverProvider('plaintext', {
        provideHover(document, position, token) {
            const t = new Date();
            const s = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
            return {
                contents: [
                    s,
                    `document    ${JSON.stringify(document)}`,
                    `position    ${JSON.stringify(position)}`,
                    `token       ${JSON.stringify(token)}`
                ]
            };
        }
    });

    let test = commands.registerCommand('writee.test', () => {

        // 显示输入框
        // window.showInputBox({
        //     password: true,
        //     placeHolder: 'placeHolderrrrrrrr',
        //     prompt: 'prompttttt'
        // }).then(res => {
        //     console.log(res);
        // });

        // 显示选择列表
        // let itemArr = [];
        // for (let i = 0; i < 5; i++) {
        //     let item = new QuickPickItem('a');   
        // }
        // window.showQuickPick([
        //     {label: 'a', description: 'descriptiondescription', detail: 'detaildetail', picked: true, value: 'a is mine'},
        //     {label: 'b', value: 'b is mine'},
        //     {label: 'c', value: 'c is mine'},
        // ],{
        //     canPickMany: false
        // }).then(res => {
        //     console.log(res);
        // });

        var editor = window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        if (!text) {
            return;
        }
        window.showInformationMessage(text);
    });
    context.subscriptions.push(test);

    context.subscriptions.push(
        commands.registerCommand('writee.webview', (args) => {
            console.log(args);
            console.log(path.basename(args.fsPath)); // 文件名
            console.log(path.dirname(args.fsPath)); // 文件夹
            console.log(path.extname(args.fsPath)); // 后缀
            let filename = path.basename(args.fsPath);
            const panel = window.createWebviewPanel(
                'testWv', // Identifies the type of the webview. Used internally
                filename, // Title of the panel displayed to the user
                ViewColumn.One, // Editor column to show the new webview panel in.
                {
                    // enableScripts: true,
                    retainContextWhenHidden: true
                    // localResourceRoots: [Uri.file('/Users/yangqi')]
                } // Webview options. More on these later.
            );
            
            // const onDiskPath = Uri.file(args.fsPath);
            // wvUri = panel.webview.asWebviewUri(onDiskPath);
            // panel.webview.html = getWebviewContent();
            panel.webview.html = "";
        })
    );
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
            let { chinese, all } = this._getWordCount(doc);

            const showChineseCount = workspace.getConfiguration().get('writee.showChineseCount');
            const showAllCount = workspace.getConfiguration().get('writee.showAllCount');
            const targetWordCount: Number = workspace.getConfiguration().get('writee.targetWordCount') || 0;

            // Update the status bar
            let textArr = [];
            if (showChineseCount) {
                textArr.push(`中 ${chinese} 字`);
            }
            if (showAllCount) {
                textArr.push(`共 ${all} 字`);
            }
            if ((chinese && all) < targetWordCount) {
                this._statusBarItem.color = '#bbb';
            } else {
                this._statusBarItem.color = '#fff';
            }
            // new Color(255, 255, 255, 1);
            this._statusBarItem.tooltip = textArr.join('，');
            this._statusBarItem.text = '$(pencil) ' + textArr.join('，');
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument): { chinese: number, all: number } {
        let docContent = doc.getText();

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/\s+/g, '');
        let all = docContent.length;
        docContent = docContent.replace(/[^\u4e00-\u9fa5]/g, '');
        let chinese = docContent.length;
        return { chinese, all };
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
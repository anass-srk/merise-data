import type { LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import type * as vscode from 'vscode';
import * as vs from "vscode";
import * as path from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { generateMCD, generateMLD } from '../cli/generator.js';
import { createEntityScriptServices } from '../language/entity-script-module.js';
import { NodeFileSystem } from 'langium/node';
import { extractDocument } from '../cli/cli-util.js';
import { Model } from '../language/generated/ast.js';

let client: LanguageClient;

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);
    let disposable = vs.commands.registerCommand("extension.generate_mcd", () => {
      const activeEditor = vs.window.activeTextEditor;
      if (activeEditor) {
        const fileName = activeEditor.document.fileName; 
        const services = createEntityScriptServices(NodeFileSystem).EntityScript;
        // extractAstNode<Model>(fileName, services).then(model => {
        //   generateMCD(model,fileName,path.dirname(fileName));
        // });
        extractDocument(fileName, services).then(doc => {
          const res = doc.parseResult
          if(res.lexerErrors.length == 0 && res.parserErrors.length == 0){
            generateMCD(res.value as Model, fileName, path.dirname(fileName));
            vs.window.showInformationMessage("MCD Generated !");
          }else{
            vs.window.showErrorMessage("Fix the errors first !");
          }
        })
      }
    });
    context.subscriptions.push(disposable);
    disposable = vs.commands.registerCommand("extension.generate_mld", () => {
      const activeEditor = vs.window.activeTextEditor;
      if (activeEditor) {
        const fileName = activeEditor.document.fileName; 
        const services = createEntityScriptServices(NodeFileSystem).EntityScript;
        // extractAstNode<Model>(fileName, services).then(model => {
        //   generateMCD(model,fileName,path.dirname(fileName));
        // });
        extractDocument(fileName, services).then(doc => {
          const res = doc.parseResult
          if(res.lexerErrors.length == 0 && res.parserErrors.length == 0){
            generateMLD(res.value as Model, fileName, path.dirname(fileName));
            vs.window.showInformationMessage("MLD Generated !");
          }else{
            vs.window.showErrorMessage("Fix the errors first !");
          }
        })
      }
    });
    context.subscriptions.push(disposable);
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: '*', language: 'entity-script' }]
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'entity-script',
        'Entity Script',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    return client;
}

import { DocumentState, EmptyFileSystem } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  Diagnostic,
  NotificationType,
} from "vscode-languageserver/browser.js";
import { createEntityScriptServices } from "./entity-script-module.js";
import { Model } from "./generated/ast.js";

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, EntityScript } = createEntityScriptServices({
  connection,
  ...EmptyFileSystem,
});

startLanguageServer(shared);

type DocumentChange = {
  uri: string;
  content: string;
  diagnostics: Diagnostic[];
};
const documentChangeNotification = new NotificationType<DocumentChange>(
  "browser/DocumentChange"
);

const jsonSerializer = EntityScript.serializer.JsonSerializer;
shared.workspace.DocumentBuilder.onBuildPhase(
  DocumentState.Validated,
  (docs) => {
    for (const document of docs) {
      const model = document.parseResult.value as Model;

      // only generate commands if there are no errors
      if (
        document.diagnostics === undefined ||
        document.diagnostics.filter((i) => i.severity === 1).length === 0
      ) {
        connection.sendNotification(documentChangeNotification, {
          uri: document.uri.toString(),
          content: jsonSerializer.serialize(model, {
            sourceText: true,
            textRegions: true,
            refText: true
          }),
          diagnostics: document.diagnostics ?? [],
        });
      }
    }
  }
);

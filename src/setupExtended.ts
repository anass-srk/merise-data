import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import { createEntityScriptServices } from './language/entity-script-module.js';
import { EmptyFileSystem } from 'langium';
import { CancellationTokenSource } from 'vscode';
import { genMCD, genMLD, genSQL } from './cli/generator.js';
import { Model } from './language/generated/ast.js';
import Pako from 'pako';
import { Buffer } from 'buffer';
import plantumlEncoder from "plantuml-encoder";

export const setupConfigExtended = (): UserConfig => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/entity-script-grammar.json', new URL('../syntaxes/entity-script.tmLanguage.json', import.meta.url));

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                languageId: 'entity-script',
                code: `// Entity Script is running in the web!`,
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'entity-script-web',
                        publisher: 'generator-langium',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'entity-script',
                                extensions: [
                                    '.entity-script'
                                ],
                                configuration: './language-configuration.json'
                            }],
                            grammars: [{
                                language: 'entity-script',
                                scopeName: 'source.entity-script',
                                path: './entity-script-grammar.json'
                            }]
                        }
                    },
                    filesOrContents: extensionFilesOrContents,
                }],                
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.semanticHighlighting.enabled': true
                    })
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};

export const executeExtended = async (htmlElement: HTMLElement) => {
  const userConfig = setupConfigExtended();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig, htmlElement);
  return wrapper
};

// function setStatus(msg: string) {
//   const elm = document?.getElementById("status-msg");
//   if (elm) {
//     elm.innerHTML = msg;
//   }
// }

export const _helper = (wrapper: MonacoEditorLanguageClientWrapper,canvas: HTMLCanvasElement,type: "MCD" | "MLD" = "MCD") => {
  console.log("HERE !",wrapper.getEditor())

  const ctx = canvas.getContext("2d")

  const gen = (type == "MCD" ? genMCD : genMLD)

  const services = createEntityScriptServices(EmptyFileSystem).EntityScript;


  wrapper.getEditor()?.onDidChangeModelContent(() => {
    const content = wrapper.getModel()!.getValue() as string
    const src = new CancellationTokenSource()
    services.parser.AsyncParser.parse(content,src.token).then(res => {
      if(res.lexerErrors.length == 0 && res.parserErrors.length == 0){
        const src = getPlantUMLUrl(gen(res.value as Model));
        console.log(src)
        
        const img = new Image();

        img.onload = function () {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas.style.width = canvas.width + "px"
          canvas.style.height = canvas.height + "px";
          // ctx!.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
          ctx!.drawImage(img,0,0);
        };

        img.src = src;

        img.onerror = function () {
          console.error("Failed to load image:", src);
        };

      }
    })
  })

}

export const helper = (
  wrapper: MonacoEditorLanguageClientWrapper,
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  canvas3: HTMLPreElement
) => {
  console.log("HERE !", wrapper.getEditor());

  const canvas = [
    {
      canvas: canvas1,
      gen: genMCD
    },
    {
      canvas: canvas2,
      gen: genMLD
    }
  ]

  const client = wrapper.getLanguageClient();
  if (!client) {
    throw new Error("Unable to obtain language client!");
  }

  // listen for document change notifications
  client.onNotification("browser/DocumentChange", onDocumentChange);

  function onDocumentChange(resp: any) {
    const model: Model = JSON.parse(resp.content);

    canvas3.innerHTML = `<pre><code class="language-sql" id="sql-code">${genSQL(model)}</code></pre>`;

    canvas.forEach(c => {

      const puml = c.gen(model);
      const src = getPlantUMLUrl(puml);

      const img = new Image();

      img.onload = function () {
        c.canvas.width = img.naturalWidth;
        c.canvas.height = img.naturalHeight;
        c.canvas.style.width = c.canvas.width + "px";
        c.canvas.style.height = c.canvas.height + "px";
        // ctx!.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        c.canvas.getContext("2d")!.drawImage(img, 0, 0);
      };

      img.src = src;

      img.onerror = function () {
        console.error("Failed to load image:", src);
      };
    })
  }
};

// Function to generate the PlantUML URL
function getPlantUMLUrl(plantUMLCode: string) {
  // const encodedCode = encodePlantUML(plantUMLCode);
  const encodedCode = plantumlEncoder.encode(plantUMLCode)
  return `http://www.plantuml.com/plantuml/png/${encodedCode}`;
}
import type { Model } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = expandToNode`
        "use strict";

        ${joinToNode(model.entities, entity => `console.log('Entity: , ${entity.name + " " + entity.attributes.map(a => a.name + ':' + a.type).join(', ')}!');`, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

export function generateMCD(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.puml`;

  const fileNode = expandToNode`
        @startuml mcd-${data.name}
        allow_mixing

        ${joinToNode(
          model.entities,
          (entity) =>
            `object ${entity.name} {\n${entity.attributes
              .map((att) => (att.primary ? "  <u>" : "  ") + att.name)
              .join("\n")}\n}`,
          { appendNewLineIfNotEmpty: true }
        )}

        ${joinToNode(
          model.relations,
          (rel) =>
            `usecase ${rel.name} as "\n  ${rel.desc}\n  --\n${rel.attributes
              .map((att) => "  " + att.name)
              .join("\n")}\n"`,
          { appendNewLineIfNotEmpty: true }
        )}

        ${joinToNode(
          model.links,
          (link) => link.entity.ref?.name + ' -- ' + link.relation.ref?.name + ": " + link.mult,
          { appendNewLineIfNotEmpty: true }
        )}

        @enduml
    `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}
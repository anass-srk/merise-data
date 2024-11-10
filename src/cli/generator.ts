import { Entity, Model, Relation } from '../language/generated/ast.js';
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

  const code = genMCD(model)

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, code);
  return generatedFilePath;
}

export function genMCD2(model: Model){
  const links = new Map<Relation,{entity: Entity,mult: string}[]>()

  model.links.forEach((l) => {
    const rel = l.relation.ref;
    const ent = l.entity.ref;
    console.info("REL : ",rel)
    console.info("ENT : ",ent)
    if (rel && ent) {
      if (links.has(rel)) {
        links.get(rel)!.push({ entity: ent, mult: l.mult});
      } else {
        links.set(rel, [{ entity: ent, mult: l.mult }]);
      }
    }
  });

  console.info("LINKS : ",links)

  const fileNode = expandToNode`
        @startuml mcd
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
          links,
          (link) => link[1][0].entity.name + ' -- ' + link[0].name + ": " + link[1][1].mult + '\n' + link[1][1].entity.name + ' -- ' + link[0].name + ": " + link[1][0].mult,
          { appendNewLineIfNotEmpty: true }
        )}

        @enduml
    `.appendNewLineIfNotEmpty();
    return toString(fileNode)
}

export function genMCD(model: Model) {
  const links = new Map<Relation, { entity: Entity; mult: string }[]>();
  
  const entities = new Map<string,Entity>()
  for(const ent of model.entities){
    entities.set(ent.name,ent)
  }

  const relations = new Map<string,Relation>()
  for(const rel of model.relations){
    relations.set(rel.name,rel)
  }

  model.links.forEach((l) => {
    const rel = relations.get(l.relation.$refText)
    const ent = entities.get(l.entity.$refText);
    console.info("REL : ", rel);
    console.info("ENT : ", ent);
    if (rel && ent) {
      if (links.has(rel)) {
        links.get(rel)!.push({ entity: ent, mult: l.mult });
      } else {
        links.set(rel, [{ entity: ent, mult: l.mult }]);
      }
    }
  });

  console.info("LINKS : ", links);

  const fileNode = expandToNode`
        @startuml mcd
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
          links,
          (link) =>
            link[1][0].entity.name +
            " -- " +
            link[0].name +
            ": " +
            link[1][1].mult +
            "\n" +
            link[1][1].entity.name +
            " -- " +
            link[0].name +
            ": " +
            link[1][0].mult,
          { appendNewLineIfNotEmpty: true }
        )}

        @enduml
    `.appendNewLineIfNotEmpty();
  return toString(fileNode);
}

type MyAttribute = {
  is_primary: boolean,
  is_foreign: boolean,
  name: string,
  type: string
}

type MyEntity = {
  name: string,
  attributes: MyAttribute[]
}

type MyRelation = {
  ea: string,
  am: string,
  eb: string,
  bm: string
}

type MyInfo = {
  mult: number,
  entity: MyEntity
}

function entityToMine(e: Entity) : MyEntity{
  return {
    name: e.name,
    attributes: e.attributes.map<MyAttribute>(
      att => ({
        is_primary: att.primary,
        name: att.name,
        type: att.type,
        is_foreign: false
      })
    )
  }
}

export function generateMLD(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.puml`;

  const code = genMLD(model)

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, code);
  return generatedFilePath;
}

export function genMLD(model: Model): string {

  const links = new Map<Relation, MyInfo[]>();

  const entities = new Map<string, Entity>();
  for (const ent of model.entities) {
    entities.set(ent.name, ent);
  }

  const relations = new Map<string, Relation>();
  for (const rel of model.relations) {
    relations.set(rel.name, rel);
  }


  const Order = new Map<string,number>()
  Order.set("1,1",2)
  Order.set("0,1",3)
  Order.set("1,N",0)
  Order.set("0,N",1)

  const rorder = new Map<number,string>()
  rorder.set(0, "|{")
  rorder.set(1, "o{");
  rorder.set(2, "||");
  rorder.set(3, "o|");


  model.links.forEach((l) => {
    const rel = relations.get(l.relation.$refText);
    const ent = entities.get(l.entity.$refText);
    console.info("REL : ", rel);
    console.info("ENT : ", ent);
    if (rel && ent) {
      const nent = entityToMine(ent)
      if (links.has(rel)) {
        links.get(rel)!.push({entity: nent,mult: Order.get(l.mult)!});
      } else {
        links.set(rel, [{entity: nent,mult: Order.get(l.mult)!}]);
      }
    }
  });

  const new_ents: Map<string,MyEntity> = new Map();
  const new_rels: MyRelation[] = []

  links.forEach((l,r) => {
    
    l.sort((a,b) => a.mult - b.mult)
    
    const myatts: MyAttribute[] = r.attributes.map<MyAttribute>(att => ({
      is_primary: false,
      is_foreign: false,
      name: att.name,
      type: att.type
    }))

    let target = l[0].entity;

    if(l.length == 2){
      if(l.filter(v => v.mult <= 1).length == 2){
        target = {
          name: r.name,
          attributes: l[0].entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
            is_foreign: true,
            is_primary: true,
            name: att.name,
            type: att.type
          }))
        }
        new_rels.push({
          ea: l[0].entity.name,
          eb: r.name,
          am: rorder.get(2)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[0].mult)!
        })
        new_rels.push({
          ea: l[1].entity.name,
          eb: r.name,
          am: rorder.get(2)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[1].mult)!
        })
      }else{
        new_rels.push({
          ea: l[1].entity.name,
          eb: l[0].entity.name,
          am: rorder.get(l[1].mult)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[0].mult)!
        });
      }
      target.attributes.push(...myatts)
      target.attributes.push(...l[1].entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
        is_foreign: true,
        is_primary: true,
        name: att.name,
        type: att.type
      })))
      


    }
    // else if(l.length == 3){
    //   target = {
    //     name: r.name,
    //     attributes: myatts
    //   }
    //   l.forEach(i => {
    //     target.attributes.push(...i.entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
    //       is_foreign: true,
    //       is_primary: true,
    //       name: att.name,
    //       type: att.type
    //     })))
    //     new_rels.push({
    //       ea: i.entity.name,
    //       eb: r.name,
    //       am: rorder.get(i.mult)!.split("").reverse().join("").replace("{","}"),
    //       bm: rorder.get(i.mult)!
    //     });
    //   })
    // }

    target.attributes.sort((a,b) => {
      const ap = (a.is_primary ? 2 : 0) + (a.is_foreign ? 1 : 0)
      const bp = (b.is_primary ? 2 : 0) + (b.is_foreign ? 1 : 0)
      return ap - bp
    })

    if(!new_ents.has(target.name)){
      new_ents.set(target.name,target)
    }
    
  })

  model.entities.forEach(e => {
    if (!new_ents.has(e.name)) {
      new_ents.set(e.name, entityToMine(e));
    }
  })

  const fileNode = expandToNode`
        @startuml mld
        allow_mixing

        skinparam DefaultFontStyle center
        skinparam ObjectBackgroundColor #FFFFDE

        ${joinToNode(
          new_ents,
          (entity) => {
            const spaces = (entity[1].attributes.filter(att => att.is_primary && !att.is_foreign).length != 0 ? "    " : "") 
            return `object ${entity[0]} {\n
            <#transparent,#transparent>${entity[1].attributes
              .map(
                (att) =>
                  `|${
                    att.is_foreign
                      ? "<b>" + (att.is_primary ? "<u>" : "") + "# "
                      : (att.is_primary && !att.is_foreign ? "<u><&key> " : spaces)
                  } ${att.name} |<color:#979797>${att.type}</color>|`
              )
              .join("\n")}\n}`;
          },
          { appendNewLineIfNotEmpty: true }
        )}

        ${joinToNode(
          new_rels,
          (rel) => `${rel.ea} ${rel.am}--${rel.bm} ${rel.eb}`,
          { appendNewLineIfNotEmpty: true }
        )}

        @enduml
    `.appendNewLineIfNotEmpty();
  return toString(fileNode)
}

export function genMLD2(model: Model): string {

  const links = new Map<Relation, MyInfo[]>();

  const Order = new Map<string,number>()
  Order.set("1,1",2)
  Order.set("0,1",3)
  Order.set("1,N",0)
  Order.set("0,N",1)

  const rorder = new Map<number,string>()
  rorder.set(0, "|{")
  rorder.set(1, "o{");
  rorder.set(2, "||");
  rorder.set(3, "o|");


  model.links.forEach((l) => {
    const rel = l.relation.ref;
    const ent = l.entity.ref;
    if (rel && ent) {
      const nent = entityToMine(ent)
      if (links.has(rel)) {
        links.get(rel)!.push({entity: nent,mult: Order.get(l.mult)!});
      } else {
        links.set(rel, [{entity: nent,mult: Order.get(l.mult)!}]);
      }
    }
  });

  const new_ents: Map<string,MyEntity> = new Map();
  const new_rels: MyRelation[] = []

  links.forEach((l,r) => {
    
    l.sort((a,b) => a.mult - b.mult)
    
    const myatts: MyAttribute[] = r.attributes.map<MyAttribute>(att => ({
      is_primary: false,
      is_foreign: false,
      name: att.name,
      type: att.type
    }))

    let target = l[0].entity;

    if(l.length == 2){
      if(l.filter(v => v.mult <= 1).length == 2){
        target = {
          name: r.name,
          attributes: l[0].entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
            is_foreign: true,
            is_primary: true,
            name: att.name,
            type: att.type
          }))
        }
        new_rels.push({
          ea: l[0].entity.name,
          eb: r.name,
          am: rorder.get(2)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[0].mult)!
        })
        new_rels.push({
          ea: l[1].entity.name,
          eb: r.name,
          am: rorder.get(2)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[1].mult)!
        })
      }else{
        new_rels.push({
          ea: l[1].entity.name,
          eb: l[0].entity.name,
          am: rorder.get(l[1].mult)!.split("").reverse().join("").replace("{","}"),
          bm: rorder.get(l[0].mult)!
        });
      }
      target.attributes.push(...myatts)
      target.attributes.push(...l[1].entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
        is_foreign: true,
        is_primary: true,
        name: att.name,
        type: att.type
      })))
      


    }
    // else if(l.length == 3){
    //   target = {
    //     name: r.name,
    //     attributes: myatts
    //   }
    //   l.forEach(i => {
    //     target.attributes.push(...i.entity.attributes.filter(att => att.is_primary).map<MyAttribute>(att => ({
    //       is_foreign: true,
    //       is_primary: true,
    //       name: att.name,
    //       type: att.type
    //     })))
    //     new_rels.push({
    //       ea: i.entity.name,
    //       eb: r.name,
    //       am: rorder.get(i.mult)!.split("").reverse().join("").replace("{","}"),
    //       bm: rorder.get(i.mult)!
    //     });
    //   })
    // }

    target.attributes.sort((a,b) => {
      const ap = (a.is_primary ? 2 : 0) + (a.is_foreign ? 1 : 0)
      const bp = (b.is_primary ? 2 : 0) + (b.is_foreign ? 1 : 0)
      return ap - bp
    })

    if(!new_ents.has(target.name)){
      new_ents.set(target.name,target)
    }
    
  })

  model.entities.forEach(e => {
    if (!new_ents.has(e.name)) {
      new_ents.set(e.name, entityToMine(e));
    }
  })

  const fileNode = expandToNode`
        @startuml mld
        allow_mixing

        skinparam DefaultFontStyle center
        skinparam ObjectBackgroundColor #FFFFDE

        ${joinToNode(
          new_ents,
          (entity) => {
            const spaces = (entity[1].attributes.filter(att => att.is_primary && !att.is_foreign).length != 0 ? "    " : "") 
            return `object ${entity[0]} {\n
            <#transparent,#transparent>${entity[1].attributes
              .map(
                (att) =>
                  `|${
                    att.is_foreign
                      ? "<b>" + (att.is_primary ? "<u>" : "") + "# "
                      : (att.is_primary && !att.is_foreign ? "<u><&key> " : spaces)
                  } ${att.name} |<color:#979797>${att.type}</color>|`
              )
              .join("\n")}\n}`;
          },
          { appendNewLineIfNotEmpty: true }
        )}

        ${joinToNode(
          new_rels,
          (rel) => `${rel.ea} ${rel.am}--${rel.bm} ${rel.eb}`,
          { appendNewLineIfNotEmpty: true }
        )}

        @enduml
    `.appendNewLineIfNotEmpty();
  return toString(fileNode)
}
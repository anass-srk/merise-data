import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { Entity, Relation, type EntityScriptAstType, type Model } from './generated/ast.js';
import type { EntityScriptServices } from './entity-script-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: EntityScriptServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.EntityScriptValidator;
    const checks: ValidationChecks<EntityScriptAstType> = {
      Model: validator.modelValidations,
      Entity: validator.AtLeastOnePrimaryKey
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class EntityScriptValidator {

  modelValidations(model: Model, accept: ValidationAcceptor): void{
    this.UniqueNames(model, accept);
    this.ValidateMultiplicity(model,accept);
  }

  ValidateMultiplicity(model: Model,accept: ValidationAcceptor): void{
    let links = new Map<Relation,[string,Entity][]>()
    model.links.forEach(l => {
      const rel = l.relation.ref
      const ent = l.entity.ref
      if(rel && ent){
        if(links.has(rel)){
          links.get(rel)!.push([l.mult,ent])
        }else{
          links.set(rel,[[l.mult,ent]]);
        }
      }
    })
    links.forEach((l,r) => {
      if(l.length == 1){
        accept('error',`An association has to be related to 2 entities at least ! Check '${r.name}' !`,{
          node: r
        })
      }
      if(l.length > 3){
        accept("error",`An association can be related to 3 entites at most ! The association '${r.name}' has ${l.length} entities !`,{
          node: r
        })
      }
      const one_to = l.filter((p) => p[0][0] == '1')
      if(one_to.length >= 2){
        accept("error", `Circular Dependency - Cannot create entity '${one_to[0][1].name}' without ${one_to.slice(1).map(v => "'"+v[1].name+"'").join(' or ')} and vice-versa !`,{
          node: r
        });
      }
    })
  }

  AtLeastOnePrimaryKey(e: Entity, accept: ValidationAcceptor): void {
    let hasPK = false;
    for (const att of e.attributes) {
      if (hasPK) break;
      if (att.primary) {
        hasPK = true;
      }
    }
    if (!hasPK) {
      accept("error", `the entity "${e.name}" doesn't have a primary key !`, {
        node: e,
      });
    };
  }

  UniqueNames(model: Model, accept: ValidationAcceptor): void {
    let names = new Set<string>();
    model.entities.forEach((e) => {
      if (names.has(e.name)) {
        accept("error", `The name "${e.name}" is already used !`, {
          node: e,
          property: "name",
        });
      }
      let atts = new Set<string>();
      for (let att of e.attributes) {
        if (atts.has(att.name)) {
          accept(
            "error",
            `The name "${att.name}" is already used by another attribute !`,
            { node: e, property: "attributes" }
          );
        }
        atts.add(att.name);
      }
      names.add(e.name);
    });
    model.relations.forEach((r) => {
      if (names.has(r.name)) {
        accept("error", `The name "${r.name}" is already used !`, {
          node: r,
          property: "name",
        });
      }
      let atts = new Set<string>();
      for (let att of r.attributes) {
        if (atts.has(att.name)) {
          accept(
            "error",
            `The name "${att.name}" is already used by another attribute !`,
            { node: r, property: "attributes" }
          );
        }
        atts.add(att.name);
      }
      names.add(r.name);
    });
  }
}

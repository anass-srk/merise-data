import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { type EntityScriptAstType, type Model } from './generated/ast.js';
import type { EntityScriptServices } from './entity-script-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: EntityScriptServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.EntityScriptValidator;
    const checks: ValidationChecks<EntityScriptAstType> = {
      Model: validator.modelValidations,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class EntityScriptValidator {

  modelValidations(model: Model, accept: ValidationAcceptor): void{
    this.AtLeastOnePrimaryKey(model,accept);
    this.UniqueNames(model, accept);
  }

  AtLeastOnePrimaryKey(model: Model, accept: ValidationAcceptor): void {
    model.entities.forEach((e) => {
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
      }
    });
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

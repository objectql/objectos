/**
 * Workflow YAML Parser
 *
 * Parses workflow definitions from YAML format
 */

import * as yaml from 'js-yaml';
import type {
  WorkflowDefinition,
  StateConfig,
  TransitionConfig,
  YAMLWorkflowDefinition,
  YAMLStateConfig,
  YAMLTransitionConfig,
} from './types.js';

/**
 * Parse a workflow definition from YAML string
 */
export function parseWorkflowYAML(yamlContent: string, id?: string): WorkflowDefinition {
  const parsed = yaml.load(yamlContent) as YAMLWorkflowDefinition;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML workflow definition');
  }

  if (!parsed.name) {
    throw new Error('Workflow definition must have a name');
  }

  if (!parsed.states || Object.keys(parsed.states).length === 0) {
    throw new Error('Workflow definition must have at least one state');
  }

  // Find the initial state
  const initialStateEntry = Object.entries(parsed.states).find(
    ([_, state]) => (state as any).initial === true,
  );

  if (!initialStateEntry) {
    throw new Error('Workflow definition must have an initial state');
  }

  const initialState = initialStateEntry[0];

  // Parse states
  const states: Record<string, StateConfig> = {};
  for (const [stateName, stateConfig] of Object.entries(parsed.states)) {
    states[stateName] = parseStateConfig(stateName, stateConfig);
  }

  // Validate transitions reference valid states
  for (const [stateName, state] of Object.entries(states)) {
    if (state.transitions) {
      for (const [transitionName, transition] of Object.entries(state.transitions)) {
        const target = (transition as any).target;
        if (!states[target]) {
          throw new Error(
            `Invalid transition "${transitionName}" in state "${stateName}": ` +
              `target state "${target}" does not exist`,
          );
        }
      }
    }
  }

  const workflowId = id || generateWorkflowId(parsed.name);
  const version = parsed.version || '1.0.0';

  return {
    id: workflowId,
    name: parsed.name,
    description: parsed.description,
    type: parsed.type,
    version,
    states,
    initialState,
    metadata: parsed.metadata,
  };
}

/**
 * Parse a state configuration from YAML
 */
function parseStateConfig(name: string, config: YAMLStateConfig): StateConfig {
  const transitions: Record<string, TransitionConfig> = {};

  if (config.transitions) {
    for (const [transitionName, transitionConfig] of Object.entries(config.transitions)) {
      transitions[transitionName] = parseTransitionConfig(transitionName, transitionConfig);
    }
  }

  return {
    name,
    initial: config.initial,
    final: config.final,
    onEnter: config.on_enter,
    onExit: config.on_exit,
    transitions,
    metadata: config.metadata,
  };
}

/**
 * Parse a transition configuration from YAML
 */
function parseTransitionConfig(
  name: string,
  config: YAMLTransitionConfig | string,
): TransitionConfig {
  // Handle shorthand syntax: transition: target_state
  if (typeof config === 'string') {
    return {
      target: config,
    };
  }

  if (!config.target) {
    throw new Error(`Transition "${name}" must have a target state`);
  }

  return {
    target: config.target,
    guards: config.guards,
    actions: config.actions,
    metadata: config.metadata,
  };
}

/**
 * Generate a workflow ID from name
 */
function generateWorkflowId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Validate a workflow definition
 */
export function validateWorkflowDefinition(definition: WorkflowDefinition): string[] {
  const errors: string[] = [];

  if (!definition.id) {
    errors.push('Workflow must have an ID');
  }

  if (!definition.name) {
    errors.push('Workflow must have a name');
  }

  if (!definition.version) {
    errors.push('Workflow must have a version');
  }

  if (!definition.states || Object.keys(definition.states).length === 0) {
    errors.push('Workflow must have at least one state');
  }

  if (!definition.initialState) {
    errors.push('Workflow must have an initial state');
  }

  if (definition.initialState && !definition.states[definition.initialState]) {
    errors.push(`Initial state "${definition.initialState}" does not exist`);
  }

  // Check for at least one final state
  const hasFinalState = Object.values(definition.states).some((s) => (s as any).final === true);
  if (!hasFinalState) {
    errors.push('Workflow must have at least one final state');
  }

  // Validate each state
  for (const [stateName, state] of Object.entries(definition.states)) {
    if ((state as any).transitions) {
      for (const [transitionName, transition] of Object.entries((state as any).transitions)) {
        if (!definition.states[(transition as any).target]) {
          errors.push(
            `Invalid transition "${transitionName}" in state "${stateName}": ` +
              `target state "${(transition as any).target}" does not exist`,
          );
        }
      }
    }
  }

  return errors;
}

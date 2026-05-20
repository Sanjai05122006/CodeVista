import vm from "vm";
import { TraceEventType, TraceStep } from "../../types/analysis";

const acorn = require("acorn") as typeof import("acorn");
const walk = require("acorn-walk") as {
  ancestor: (
    node: unknown,
    visitors: Record<string, (node: any, ancestors: any[]) => void>
  ) => void;
};

const USER_CODE_FILENAME = "codevista-user.js";
const MAX_TRACE_STEPS = 300;
const MAX_CODE_LENGTH = 20_000;
const EXECUTION_TIMEOUT_MS = 1_500;
const MAX_SERIALIZED_STRING_LENGTH = 200;
const MAX_OBJECT_KEYS = 20;
const MAX_ARRAY_ITEMS = 20;

type ScopeInfo = {
  parent: ScopeInfo | null;
  names: Set<string>;
  boundaryStart: number;
};

type Insertion = {
  pos: number;
  text: string;
};

const escapeJsString = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n");

const createScope = (parent: ScopeInfo | null, boundaryStart: number): ScopeInfo => ({
  parent,
  names: new Set(),
  boundaryStart,
});

const getNearestScope = (
  ancestors: any[],
  scopeMap: WeakMap<object, ScopeInfo>,
  fallback: ScopeInfo
) => {
  for (let index = ancestors.length - 2; index >= 0; index -= 1) {
    const candidate = ancestors[index];
    if (candidate && typeof candidate === "object") {
      const scope = scopeMap.get(candidate as object);
      if (scope) {
        return scope;
      }
    }
  }

  return fallback;
};

const collectPatternNames = (pattern: any, target: Set<string>) => {
  if (!pattern || typeof pattern !== "object") {
    return;
  }

  switch (pattern.type) {
    case "Identifier":
      target.add(pattern.name);
      return;
    case "RestElement":
      collectPatternNames(pattern.argument, target);
      return;
    case "AssignmentPattern":
      collectPatternNames(pattern.left, target);
      return;
    case "ArrayPattern":
      for (const element of pattern.elements ?? []) {
        collectPatternNames(element, target);
      }
      return;
    case "ObjectPattern":
      for (const property of pattern.properties ?? []) {
        if (property.type === "Property") {
          collectPatternNames(property.value, target);
        } else if (property.type === "RestElement") {
          collectPatternNames(property.argument, target);
        }
      }
      return;
    default:
      return;
  }
};

const buildScopes = (ast: any) => {
  const programScope = createScope(null, 0);
  const scopeMap = new WeakMap<object, ScopeInfo>();
  const functionNameByNode = new WeakMap<object, string>();
  const statementScopes = new WeakMap<object, ScopeInfo>();

  scopeMap.set(ast, programScope);

  walk.ancestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      const parentScope = getNearestScope(ancestors, scopeMap, programScope);
      if (node.id?.name) {
        parentScope.names.add(node.id.name);
      }

      const functionScope = createScope(parentScope, node.body.start);
      for (const parameter of node.params ?? []) {
        collectPatternNames(parameter, functionScope.names);
      }
      scopeMap.set(node.body, functionScope);
      functionNameByNode.set(node, node.id?.name || "anonymous");
    },
    FunctionExpression(node: any, ancestors: any[]) {
      const parentScope = getNearestScope(ancestors, scopeMap, programScope);
      const functionScope = createScope(parentScope, node.body.start);
      if (node.id?.name) {
        functionScope.names.add(node.id.name);
      }
      for (const parameter of node.params ?? []) {
        collectPatternNames(parameter, functionScope.names);
      }
      scopeMap.set(node.body, functionScope);
      functionNameByNode.set(node, node.id?.name || "anonymous");
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      const parentScope = getNearestScope(ancestors, scopeMap, programScope);
      if (node.body?.type !== "BlockStatement") {
        functionNameByNode.set(node, "anonymous");
        return;
      }

      const functionScope = createScope(parentScope, node.body.start);
      for (const parameter of node.params ?? []) {
        collectPatternNames(parameter, functionScope.names);
      }
      scopeMap.set(node.body, functionScope);
      functionNameByNode.set(node, "anonymous");
    },
    VariableDeclaration(node: any, ancestors: any[]) {
      const currentScope = getNearestScope(ancestors, scopeMap, programScope);
      for (const declaration of node.declarations ?? []) {
        collectPatternNames(declaration.id, currentScope.names);
      }
    },
    CatchClause(node: any, ancestors: any[]) {
      const parentScope = getNearestScope(ancestors, scopeMap, programScope);
      const catchScope = createScope(parentScope, node.body.start);
      collectPatternNames(node.param, catchScope.names);
      scopeMap.set(node.body, catchScope);
    },
    Statement(node: any, ancestors: any[]) {
      const scope = getNearestScope(ancestors, scopeMap, programScope);
      statementScopes.set(node, scope);
    },
  });

  return { statementScopes, functionNameByNode, programScope };
};

const getScopeVariableNames = (
  scope: ScopeInfo | null | undefined,
  statementStart: number
) => {
  const names = new Set<string>();
  let current = scope;

  while (current) {
    if (statementStart >= current.boundaryStart) {
      for (const name of current.names) {
        if (name !== "__cvTrace") {
          names.add(name);
        }
      }
    }
    current = current.parent;
  }

  return Array.from(names).sort();
};

const buildSnapshotExpression = (names: string[]) => {
  if (names.length === 0) {
    return "{}";
  }

  return `{ ${names
    .map((name) => `'${escapeJsString(name)}': __cvTrace.read(() => ${name})`)
    .join(", ")} }`;
};

const applyInsertions = (source: string, insertions: Insertion[]) => {
  return insertions
    .sort((left, right) => right.pos - left.pos)
    .reduce((current, insertion) => {
      return `${current.slice(0, insertion.pos)}${insertion.text}${current.slice(insertion.pos)}`;
    }, source);
};

const instrumentJavascript = (code: string) => {
  const ast = acorn.parse(code, {
    ecmaVersion: "latest",
    sourceType: "script",
    locations: true,
    ranges: true,
  });

  const { statementScopes, functionNameByNode, programScope } = buildScopes(ast);
  const insertions: Insertion[] = [];

  walk.ancestor(ast, {
    FunctionDeclaration(node: any) {
      if (node.body?.type !== "BlockStatement") {
        return;
      }

      const name = functionNameByNode.get(node) ?? "anonymous";
      const line = node.loc?.start?.line ?? null;
      insertions.push({
        pos: node.body.start + 1,
        text: `__cvTrace.enterFunction('${escapeJsString(name)}', ${line ?? "null"});try{`,
      });
      insertions.push({
        pos: node.body.end - 1,
        text: `}finally{__cvTrace.exitFunction();}`,
      });
    },
    FunctionExpression(node: any) {
      if (node.body?.type !== "BlockStatement") {
        return;
      }

      const name = functionNameByNode.get(node) ?? "anonymous";
      const line = node.loc?.start?.line ?? null;
      insertions.push({
        pos: node.body.start + 1,
        text: `__cvTrace.enterFunction('${escapeJsString(name)}', ${line ?? "null"});try{`,
      });
      insertions.push({
        pos: node.body.end - 1,
        text: `}finally{__cvTrace.exitFunction();}`,
      });
    },
    ArrowFunctionExpression(node: any) {
      if (node.body?.type !== "BlockStatement") {
        return;
      }

      const name = functionNameByNode.get(node) ?? "anonymous";
      const line = node.loc?.start?.line ?? null;
      insertions.push({
        pos: node.body.start + 1,
        text: `__cvTrace.enterFunction('${escapeJsString(name)}', ${line ?? "null"});try{`,
      });
      insertions.push({
        pos: node.body.end - 1,
        text: `}finally{__cvTrace.exitFunction();}`,
      });
    },
    ReturnStatement(node: any) {
      const line = node.loc?.start?.line ?? null;
      if (node.argument) {
        insertions.push({
          pos: node.argument.start,
          text: `__cvTrace.recordReturn(${line ?? "null"}, `,
        });
        insertions.push({
          pos: node.argument.end,
          text: `)`,
        });
      } else {
        insertions.push({
          pos: node.start,
          text: `__cvTrace.recordReturn(${line ?? "null"}, undefined);`,
        });
      }
    },
    Statement(node: any, ancestors: any[]) {
      if (
        node.type === "BlockStatement" ||
        node.type === "EmptyStatement" ||
        node.type === "ReturnStatement" ||
        node.type === "FunctionDeclaration"
      ) {
        return;
      }

      const parent = ancestors[ancestors.length - 2] as any;
      if (!parent || (parent.type !== "Program" && parent.type !== "BlockStatement")) {
        return;
      }

      const scope = statementScopes.get(node) ?? programScope;
      const names = getScopeVariableNames(scope, node.start);
      const line = node.loc?.start?.line ?? null;
      const eventType =
        node.type === "VariableDeclaration"
          ? "assignment"
          : node.type === "ExpressionStatement"
          ? "assignment"
          : node.type === "IfStatement"
          ? "branch"
          : node.type === "ForStatement" ||
            node.type === "WhileStatement" ||
            node.type === "ForOfStatement" ||
            node.type === "ForInStatement" ||
            node.type === "DoWhileStatement"
          ? "loop_iteration"
          : "assignment";

      insertions.push({
        pos: node.start,
        text: `__cvTrace.snapshot(${line ?? "null"}, '${eventType}', ${buildSnapshotExpression(names)});`,
      });
    },
  });

  const instrumentedSource = applyInsertions(code, insertions);
  return `
const __cvTrace = globalThis.__cvTrace;
${instrumentedSource}
__cvTrace.snapshot(null, 'complete', {});
`;
};

const serializeValue = (
  value: unknown,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet()
): unknown => {
  if (value == null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_SERIALIZED_STRING_LENGTH
      ? `${value.slice(0, MAX_SERIALIZED_STRING_LENGTH)}...`
      : value;
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value as object)) {
    return "[Circular]";
  }

  seen.add(value as object);

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return `[Array(${value.length})]`;
    }

    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => serializeValue(item, depth + 1, seen));
  }

  if (depth >= 2) {
    return "[Object]";
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
  const next: Record<string, unknown> = {};

  for (const [key, entryValue] of entries) {
    next[key] = serializeValue(entryValue, depth + 1, seen);
  }

  return next;
};

export const traceJavascriptExecution = (code: string): TraceStep[] => {
  if (!code.trim() || code.length > MAX_CODE_LENGTH) {
    return [];
  }

  try {
    const instrumented = instrumentJavascript(code);
    const trace: TraceStep[] = [];
    const callStack: string[] = [];

    const tracerApi = {
      read: (reader: () => unknown) => {
        try {
          return serializeValue(reader());
        } catch {
          return "[Unavailable]";
        }
      },
      snapshot: (
        lineNumber: number | null,
        eventType: TraceEventType,
        variables: Record<string, unknown>
      ) => {
        if (trace.length >= MAX_TRACE_STEPS) {
          return;
        }

        trace.push({
          step: trace.length + 1,
          line_number: typeof lineNumber === "number" ? lineNumber : null,
          event_type: eventType,
          variables: serializeValue(variables) as Record<string, unknown>,
          call_stack: [...callStack],
        });
      },
      enterFunction: (name: string, lineNumber: number | null) => {
        callStack.push(name || "anonymous");
        tracerApi.snapshot(lineNumber, "call", {});
      },
      exitFunction: () => {
        callStack.pop();
      },
      recordReturn: (lineNumber: number | null, value: unknown) => {
        const serializedValue = serializeValue(value);
        if (trace.length < MAX_TRACE_STEPS) {
          trace.push({
            step: trace.length + 1,
            line_number: typeof lineNumber === "number" ? lineNumber : null,
            event_type: "return",
            variables: null,
            call_stack: [...callStack],
            return_value: serializedValue,
          });
        }

        return value;
      },
    };

    const context = vm.createContext({
      console: {
        log: () => undefined,
        error: () => undefined,
        warn: () => undefined,
        info: () => undefined,
      },
      globalThis: {},
    });

    (context.globalThis as Record<string, unknown>).__cvTrace = tracerApi;
    vm.runInContext(`${instrumented}\n//# sourceURL=${USER_CODE_FILENAME}`, context, {
      timeout: EXECUTION_TIMEOUT_MS,
    });

    return trace;
  } catch {
    return [];
  }
};

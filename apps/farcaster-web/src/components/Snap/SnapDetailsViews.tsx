import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Streamdown } from 'streamdown';

type KvEntry = {
  key: string;
  value: string;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ConversationMessage = {
  index: number;
  user: string;
  agent: string;
};

export function buildNestedKvEntries(
  entries: KvEntry[],
): Record<string, JsonValue> {
  const root: Record<string, JsonValue> = {};

  for (const entry of entries) {
    const parts = entry.key.split(':').filter(Boolean);
    if (parts.length === 0) {
      root[entry.key] = parseKvValue(entry.value);
      continue;
    }

    let current = root;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        current[part] = parseKvValue(entry.value);
        continue;
      }

      const next = current[part];
      if (!isJsonObject(next)) {
        const child: Record<string, JsonValue> = {};
        if (typeof next !== 'undefined') {
          child.$value = next;
        }
        current[part] = child;
        current = child;
        continue;
      }
      current = next;
    }
  }

  return sortJsonObject(root);
}

export function ConversationTranscript({
  messages,
}: {
  messages: ConversationMessage[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <React.Fragment key={message.index}>
          <div className="flex justify-start">
            <div className="max-w-[85%] select-text rounded-2xl bg-black px-3 py-2 text-sm text-white dark:bg-[#383838]">
              {message.user}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[95%] select-text py-1 pl-3 pr-2 text-sm text-default [&_*]:select-text [&_li]:my-0 [&_ol]:my-1 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-1">
              <Streamdown mode="streaming">{message.agent}</Streamdown>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export function SourceCodeBlock({ value }: { value: string }) {
  return (
    <pre className="font-mono min-h-0 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-default">
      <code>
        {value.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {highlightSourceLine(line)}
            {index < value.split('\n').length - 1 ? '\n' : null}
          </React.Fragment>
        ))}
      </code>
    </pre>
  );
}

export function JsonTree({
  value,
  name,
  defaultOpen = false,
}: {
  value: JsonValue;
  name?: string;
  defaultOpen?: boolean;
}) {
  if (isJsonObject(value)) {
    return (
      <JsonBranch
        name={name}
        value={value}
        openBracket="{"
        closeBracket="}"
        defaultOpen={defaultOpen}
      />
    );
  }

  if (Array.isArray(value)) {
    return (
      <JsonBranch
        name={name}
        value={Object.fromEntries(value.map((item, index) => [index, item]))}
        openBracket="["
        closeBracket="]"
        defaultOpen={defaultOpen}
      />
    );
  }

  return (
    <div className="flex min-w-max flex-row gap-2">
      {name ? <JsonKey name={name} /> : null}
      <span className={jsonPrimitiveClassName(value)}>
        {formatJsonValue(value)}
      </span>
    </div>
  );
}

function JsonBranch({
  name,
  value,
  openBracket,
  closeBracket,
  defaultOpen,
}: {
  name?: string;
  value: Record<string, JsonValue>;
  openBracket: '{' | '[';
  closeBracket: '}' | ']';
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const entries = Object.entries(value);

  return (
    <div className="min-w-max">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-max flex-row items-center gap-1 text-left"
      >
        {open ? (
          <ChevronDown size={14} className="text-muted/60" />
        ) : (
          <ChevronRight size={14} className="text-muted/60" />
        )}
        {name ? <JsonKey name={name} /> : null}
        <span>{openBracket}</span>
        {open ? null : (
          <span className="text-muted">
            {' '}
            {entries.length} {entries.length === 1 ? 'item' : 'items'}{' '}
            {closeBracket}
          </span>
        )}
      </button>
      {open ? (
        <>
          <div className="ml-4 border-l pl-3 border-default">
            {entries.map(([key, child]) => (
              <JsonTree key={key} name={key} value={child} />
            ))}
          </div>
          <div>{closeBracket}</div>
        </>
      ) : null}
    </div>
  );
}

function parseKvValue(value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function isJsonObject(value: JsonValue | undefined): value is {
  [key: string]: JsonValue;
} {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sortJsonObject(
  value: Record<string, JsonValue>,
): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [
        key,
        isJsonObject(child) ? sortJsonObject(child) : child,
      ]),
  );
}

function JsonKey({ name }: { name: string }) {
  return (
    <span className="font-semibold text-default">{JSON.stringify(name)}:</span>
  );
}

function formatJsonValue(value: string | number | boolean | null) {
  return JSON.stringify(value);
}

function jsonPrimitiveClassName(value: string | number | boolean | null) {
  if (typeof value === 'string') {
    return 'text-default';
  }
  if (typeof value === 'number') {
    return 'text-action';
  }
  if (typeof value === 'boolean') {
    return 'text-highlight';
  }
  return 'text-muted';
}

const sourceTokenPattern =
  /(\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|default|else|export|extends|false|for|from|function|if|import|interface|let|new|null|return|switch|throw|true|try|type|undefined|var|while)\b|\b\d+(?:\.\d+)?\b|[{}[\](),.;:<>/=+\-*])/g;

function highlightSourceLine(line: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(sourceTokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(line.slice(lastIndex, index));
    }
    nodes.push(
      <span key={`${index}-${token}`} className={sourceTokenClassName(token)}>
        {token}
      </span>,
    );
    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}

function sourceTokenClassName(token: string) {
  if (token.startsWith('//')) {
    return 'text-muted';
  }
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
    return 'text-highlight';
  }
  if (/^\d/.test(token)) {
    return 'text-action';
  }
  if (/^(false|null|true|undefined)$/.test(token)) {
    return 'text-highlight';
  }
  if (/^[{}[\](),.;:<>/=+\-*]$/.test(token)) {
    return 'text-muted';
  }
  return 'text-action';
}

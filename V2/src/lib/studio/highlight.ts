/**
 * A small syntax highlighter.
 *
 * The IDE needs colour on seven languages. A real grammar engine (TextMate,
 * tree-sitter, Shiki) is 300 kB before it renders a character, and this pane
 * shows a dozen static files — so this is a rule-ordered scanner instead:
 * ~120 lines, no dependency, and it tokenises the entire workspace in under a
 * millisecond.
 *
 * The trade is real and worth naming: it does not understand syntax, only
 * patterns. It gets the seven languages in `project.ts` right; point it at
 * pathological code and it will mis-colour something. That is an acceptable
 * failure for a viewer and would not be for an editor.
 */
import type { Lang } from "./project";

export type TokenKind =
  | "plain"
  | "keyword"
  | "control"
  | "string"
  | "comment"
  | "number"
  | "fn"
  | "type"
  | "constant"
  | "variable"
  | "punct"
  | "tag";

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
}

interface Rule {
  readonly kind: TokenKind;
  readonly re: RegExp;
}

const rule = (kind: TokenKind, source: string): Rule => ({ kind, re: new RegExp(source, "y") });

const TS_CONTROL =
  "return|await|async|if|else|for|of|in|while|do|switch|case|break|continue|try|catch|finally|throw|yield";
const TS_KEYWORD =
  "const|let|var|function|import|export|from|type|interface|enum|class|extends|implements|new|typeof|instanceof|as|satisfies|readonly|private|public|protected|static|default|declare|namespace|keyof|infer|is|void|never|unknown|any|string|number|boolean|null|undefined|true|false|this|super|delete";

const TS_RULES: Rule[] = [
  rule("comment", "//[^\\n]*"),
  rule("comment", "/\\*[\\s\\S]*?\\*/"),
  rule("string", "`(?:\\\\[\\s\\S]|[^`\\\\])*`"),
  rule("string", '"(?:\\\\.|[^"\\\\])*"'),
  rule("string", "'(?:\\\\.|[^'\\\\])*'"),
  rule("number", "\\b\\d[\\d_]*(?:\\.\\d+)?\\b"),
  rule("control", `\\b(?:${TS_CONTROL})\\b`),
  rule("keyword", `\\b(?:${TS_KEYWORD})\\b`),
  rule("constant", "\\b[A-Z][A-Z0-9_]{2,}\\b"),
  rule("type", "\\b[A-Z][A-Za-z0-9_]*\\b"),
  rule("fn", "\\b[a-z_$][\\w$]*(?=\\s*\\()"),
  rule("variable", "\\b[a-z_$][\\w$]*\\b"),
  rule("punct", "[{}()\\[\\].,;:?!<>=+\\-*/%&|^~]+"),
];

const RULES: Record<Lang, Rule[]> = {
  ts: TS_RULES,
  // JavaScript is TypeScript minus the annotations; one rule set covers both.
  js: TS_RULES,
  json: [
    rule("variable", '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'),
    rule("string", '"(?:\\\\.|[^"\\\\])*"'),
    rule("number", "-?\\b\\d[\\d_]*(?:\\.\\d+)?\\b"),
    rule("keyword", "\\b(?:true|false|null)\\b"),
    rule("punct", "[{}\\[\\],:]"),
  ],
  yaml: [
    rule("comment", "#[^\\n]*"),
    rule("variable", "(?<=^|\\n)\\s*[-\\w.$/]+(?=\\s*:)"),
    rule("string", '"(?:\\\\.|[^"\\\\])*"'),
    rule("string", "'(?:[^'])*'"),
    rule("constant", "\\$\\{[^}]*\\}"),
    rule("number", "\\b\\d[\\d_]*(?:\\.\\d+)?\\b"),
    rule("keyword", "\\b(?:true|false|null|on|off|yes|no)\\b"),
    rule("punct", "[-:|>{}\\[\\],]"),
  ],
  docker: [
    rule("comment", "#[^\\n]*"),
    rule(
      "keyword",
      "(?<=^|\\n)(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|HEALTHCHECK|SHELL)\\b",
    ),
    rule("control", "\\b(?:AS|as)\\b"),
    rule("string", '"(?:\\\\.|[^"\\\\])*"'),
    rule("constant", "--[\\w-]+"),
    rule("number", "\\b\\d[\\d_.]*\\b"),
    rule("punct", "[\\[\\],:=\\\\]"),
  ],
  shell: [
    rule("comment", "#[^\\n]*"),
    rule("string", '"(?:\\\\.|[^"\\\\])*"'),
    rule("string", "'(?:[^'])*'"),
    rule("constant", "\\$\\{?[\\w.]+\\}?"),
    rule("keyword", "\\b(?:npm|npx|phala|docker|git|curl|cargo|node|set|export|if|then|fi|echo)\\b"),
    rule("punct", "[|&;<>()$]"),
  ],
  markdown: [
    rule("comment", "(?<=^|\\n)#{1,6}[^\\n]*"),
    rule("string", "`[^`\\n]*`"),
    rule("keyword", "\\*\\*[^*\\n]+\\*\\*"),
    rule("constant", "\\[[^\\]\\n]*\\]\\([^)\\n]*\\)"),
    rule("punct", "[|\\-]+"),
  ],
  rego: [
    rule("comment", "#[^\\n]*"),
    rule("string", '"(?:\\\\.|[^"\\\\])*"'),
    rule("control", "\\b(?:if|else|not|every|some|in|with)\\b"),
    rule("keyword", "\\b(?:package|import|default|contains|as|input|data|count)\\b"),
    rule("number", "\\b\\d+\\b"),
    rule("fn", "\\b[a-z_][\\w]*(?=\\s*\\()"),
    rule("variable", "\\b[a-z_][\\w]*\\b"),
    rule("punct", "[{}()\\[\\].,;:=<>!|&]+"),
  ],
  env: [
    rule("comment", "#[^\\n]*"),
    rule("variable", "(?<=^|\\n)[A-Z_][A-Z0-9_]*(?==)"),
    rule("punct", "="),
    rule("string", "(?<==)[^\\n]*"),
  ],
};

/**
 * Tokenise source into lines of tokens.
 *
 * One pass over the text: at each position the language's rules are tried in
 * order and the first sticky match wins. Anything unmatched is consumed one
 * character at a time as `plain`, which is what keeps a bad pattern from ever
 * dropping content — the worst case is uncoloured text, never missing text.
 */
export function tokenize(source: string, lang: Lang): Token[][] {
  const rules = RULES[lang];
  const tokens: Token[] = [];
  let index = 0;
  let pending = "";

  const flush = () => {
    if (pending) {
      tokens.push({ kind: "plain", text: pending });
      pending = "";
    }
  };

  while (index < source.length) {
    let matched = false;
    for (const { kind, re } of rules) {
      re.lastIndex = index;
      const match = re.exec(source);
      if (match && match[0].length > 0) {
        flush();
        tokens.push({ kind, text: match[0] });
        index += match[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      pending += source[index];
      index++;
    }
  }
  flush();

  // Split on newlines AFTER tokenising, so multi-line strings and block
  // comments keep their colour across the lines they span.
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part.length > 0) lines[lines.length - 1]!.push({ kind: token.kind, text: part });
    });
  }
  return lines;
}

/** CSS variable carrying each token kind's colour. */
export const TOKEN_COLOR: Record<TokenKind, string> = {
  plain: "var(--vsc-text)",
  keyword: "var(--vsc-keyword)",
  control: "var(--vsc-control)",
  string: "var(--vsc-string)",
  comment: "var(--vsc-comment)",
  number: "var(--vsc-number)",
  fn: "var(--vsc-fn)",
  type: "var(--vsc-type)",
  constant: "var(--vsc-const)",
  variable: "var(--vsc-var)",
  punct: "var(--vsc-punct)",
  tag: "var(--vsc-tag)",
};

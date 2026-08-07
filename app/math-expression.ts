type MathToken =
  | { type: "number"; value: number }
  | { type: "name"; value: string }
  | { type: "operator"; value: string }
  | { type: "left" }
  | { type: "right" };

function tokenizeMath(raw: string): MathToken[] {
  const normalized = raw
    .toLowerCase()
    .replace(/π/g, "pi")
    .replace(/÷/g, "/")
    .replace(/[×·]/g, "*")
    .replace(/[−–]/g, "-");
  const tokens: MathToken[] = [];
  let index = 0;
  while (index < normalized.length) {
    const rest = normalized.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const name = rest.match(/^[a-z]+/);
    if (name) {
      tokens.push({ type: "name", value: name[0] });
      index += name[0].length;
      continue;
    }
    const symbol = normalized[index];
    if ("+-*/^".includes(symbol)) tokens.push({ type: "operator", value: symbol });
    else if (symbol === "(") tokens.push({ type: "left" });
    else if (symbol === ")") tokens.push({ type: "right" });
    else throw new Error("Unsupported character");
    index += 1;
  }
  return tokens;
}

export function evaluateMathExpression(
  raw: string,
  variables: Readonly<Record<string, number>> = {},
) {
  const tokens = tokenizeMath(raw);
  let position = 0;

  const peek = () => tokens[position];
  const take = () => tokens[position++];

  function parseExpression(): number {
    let value = parseTerm();
    while (true) {
      const next = peek();
      if (next?.type !== "operator" || !["+", "-"].includes(next.value)) break;
      const operator = take();
      if (operator.type !== "operator") throw new Error("Expected operator");
      const right = parseTerm();
      value = operator.value === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseUnary();
    while (true) {
      const next = peek();
      if (next?.type !== "operator" || !["*", "/"].includes(next.value)) break;
      const operator = take();
      if (operator.type !== "operator") throw new Error("Expected operator");
      const right = parseUnary();
      value = operator.value === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseUnary(): number {
    const token = peek();
    if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
      take();
      const value = parseUnary();
      return token.value === "-" ? -value : value;
    }
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePrimary();
    const token = peek();
    if (token?.type === "operator" && token.value === "^") {
      take();
      return base ** parseUnary();
    }
    return base;
  }

  function parsePrimary(): number {
    const token = take();
    if (!token) throw new Error("Unexpected end");
    if (token.type === "number") return token.value;
    if (token.type === "left") {
      const value = parseExpression();
      if (take()?.type !== "right") throw new Error("Missing parenthesis");
      return value;
    }
    if (token.type === "name") {
      if (token.value in variables) return variables[token.value];
      if (token.value === "pi") return Math.PI;
      if (token.value === "e") return Math.E;
      if (take()?.type !== "left") throw new Error("Expected function parenthesis");
      const argument = parseExpression();
      if (take()?.type !== "right") throw new Error("Missing function parenthesis");
      const functions: Record<string, (value: number) => number> = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        sqrt: Math.sqrt,
        ln: Math.log,
        log: Math.log10,
        abs: Math.abs,
      };
      const fn = functions[token.value];
      if (!fn) throw new Error("Unknown function");
      return fn(argument);
    }
    throw new Error("Expected value");
  }

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid expression");
  return result;
}

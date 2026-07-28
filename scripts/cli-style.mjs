/**
 * Shared terminal styling for MyMemos CLI scripts.
 * Respects NO_COLOR and non-TTY output (CI / pipes).
 * Set FORCE_COLOR=1 to force ANSI when piping.
 */

const FORCE_COLOR =
  process.env.FORCE_COLOR === "1" ||
  process.env.FORCE_COLOR === "true" ||
  process.env.FORCE_COLOR === "2" ||
  process.env.FORCE_COLOR === "3";

const NO_COLOR =
  typeof process.env.NO_COLOR === "string" || process.env.CI === "true" || process.env.CI === "1";

/** Whether ANSI colors should be applied. */
export const colorEnabled = FORCE_COLOR || (!NO_COLOR && Boolean(process.stdout.isTTY));

const ESC = "\u001b[";

/**
 * Wrap text in an ANSI SGR sequence when color is enabled.
 * Pass semicolon-joined codes (e.g. `"1;96"`) — do not nest `paint` calls.
 */
function paint(codes, text) {
  if (!colorEnabled) return String(text);
  return `${ESC}${codes}m${text}${ESC}0m`;
}

export const c = {
  bold: (t) => paint("1", t),
  dim: (t) => paint("2", t),
  italic: (t) => paint("3", t),
  underline: (t) => paint("4", t),
  red: (t) => paint("31", t),
  green: (t) => paint("32", t),
  yellow: (t) => paint("33", t),
  blue: (t) => paint("34", t),
  magenta: (t) => paint("35", t),
  cyan: (t) => paint("36", t),
  white: (t) => paint("37", t),
  brightCyan: (t) => paint("96", t),
  brightGreen: (t) => paint("92", t),
  brightYellow: (t) => paint("93", t),
  brightRed: (t) => paint("91", t),
  brightBlue: (t) => paint("94", t),
};

/** Brand label used as a prefix on log lines. */
export function brand(label = "MyMemos") {
  return paint("1;96", label);
}

/** Horizontal rule. */
export function rule(width = 52) {
  return c.dim("─".repeat(width));
}

/**
 * Prints a framed banner for a script / phase.
 * @param {string} title
 * @param {string} [subtitle]
 */
export function banner(title, subtitle) {
  const lines = ["", rule(), `  ${brand()}  ${c.bold(title)}`];
  if (typeof subtitle === "string" && subtitle.length > 0) {
    lines.push(`  ${c.dim(subtitle)}`);
  }
  lines.push(rule(), "");
  console.log(lines.join("\n"));
}

/** Success line. */
export function ok(message) {
  console.log(`${paint("1;92", "✔")} ${message}`);
}

/** Info line. */
export function info(message) {
  console.log(`${paint("1;94", "ℹ")} ${message}`);
}

/** Warning line (stdout). */
export function warn(message) {
  console.log(`${paint("1;93", "⚠")} ${message}`);
}

/** Error line (stderr). */
export function fail(message) {
  console.error(`${paint("1;91", "✖")} ${message}`);
}

/** Step / in-progress line. */
export function step(message) {
  console.log(`${paint("1;36", "›")} ${message}`);
}

/** Dim helper / hint line. */
export function hint(message) {
  console.log(`  ${c.dim(message)}`);
}

/** Indented bullet. */
export function bullet(message) {
  console.log(`  ${c.dim("•")} ${message}`);
}

/**
 * Numbered fix / instruction list (stderr).
 * @param {string[]} items
 */
export function numbered(items) {
  for (let i = 0; i < items.length; i += 1) {
    console.error(`  ${paint("1;36", `${i + 1}.`)} ${items[i]}`);
  }
}

/**
 * Command suggestion (looks copy-pasteable).
 * @param {string} commandText
 */
export function command(commandText) {
  console.error(`  ${c.dim("$")} ${c.bold(commandText)}`);
}

/**
 * Multi-line error block with title and optional body lines.
 * @param {string} title
 * @param {string[]} [details]
 */
export function errorBlock(title, details = []) {
  console.error("");
  console.error(rule());
  console.error(`  ${paint("1;91", "✖")} ${c.bold(title)}`);
  console.error(rule());
  for (const line of details) {
    console.error(`  ${line}`);
  }
  console.error("");
}

/**
 * Formats a path or URL for emphasis.
 * @param {string} value
 */
export function path(value) {
  return paint("4;36", value);
}

/**
 * Formats a key/value pair for summary rows.
 * @param {string} key
 * @param {string} value
 */
export function kv(key, value) {
  return `${c.dim(key.padEnd(12))} ${value}`;
}

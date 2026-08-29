export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type FlapVariant = "letter" | "board" | "mini" | "index" | "pair";

export function flapChar(
  char: string,
  variant: FlapVariant = "letter",
  extraClass = "",
): string {
  if (char === " ") {
    return '<span class="flap-space" aria-hidden="true"></span>';
  }
  const cls = extraClass ? ` ${extraClass}` : "";
  return `<span class="flap flap--${variant}${cls}" aria-hidden="true">${escapeHtml(char)}</span>`;
}

export function flapTitle(text: string): string {
  const inner = [...text.toUpperCase()]
    .map((char) => (char === " " ? '<span class="flap-space" aria-hidden="true"></span>' : flapChar(char, "letter")))
    .join("");
  return `<div class="flap-row flap-row--title" role="img" aria-label="${escapeHtml(text)}">${inner}</div>`;
}

export function flapHomeTitle(): string {
  const ping = "PING".split("").map((c) => flapChar(c, "letter")).join("");
  const pong = "PONG".split("").map((c) => flapChar(c, "letter")).join("");
  return `<div class="flap-row flap-row--title home-title" role="img" aria-label="Ping Pong">${ping}<span class="home-ball" aria-hidden="true"></span>${pong}</div>`;
}

export function flapBoard(value: number, animate = false): string {
  const anim = animate ? " flap-flip" : "";
  return `<span class="flap flap--board${anim}" aria-label="${value}">${value}</span>`;
}

export function flapPair(value: number, pad = 2): string {
  const str = String(value).padStart(pad, "0");
  const inner = [...str].map((d) => flapChar(d, "mini")).join("");
  return `<span class="flap-row flap-row--digits">${inner}</span>`;
}

export function flapSet(value: number): string {
  return `<span class="flap flap--set" aria-label="${value}">${value}</span>`;
}

export function flapIndex(n: string | number): string {
  return `<span class="flap flap--index" aria-hidden="true">${escapeHtml(String(n))}</span>`;
}

export function flapStrip(text: string, extraClass = ""): string {
  const cls = extraClass ? ` ${extraClass}` : "";
  return `<span class="flap-strip${cls}">${escapeHtml(text)}</span>`;
}

export function livePill(): string {
  return `<span class="live-pill"><span class="live-dot" aria-hidden="true"></span>En vivo</span>`;
}

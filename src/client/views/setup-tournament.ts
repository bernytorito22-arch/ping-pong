import type { Rules } from "../../domain/types";
import { createRoom } from "../api";
import { navigateTo } from "../router";
import { flapIndex } from "../ui/flap";
import { chevronLeft, dice } from "../ui/icons";
import { applyRuleToggle, renderRulesToggles } from "../ui/rules";

const DEFAULT_RULES: Rules = { matchType: "best_of_3", pointsTo: 11 };
const PRESETS = [4, 8, 16] as const;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 16;

export function renderSetupTournament(container: HTMLElement): void {
  let names = ["", ""];
  let rules: Rules = { ...DEFAULT_RULES };
  let busy = false;
  let error = "";

  const filled = () => names.map((n) => n.trim()).filter(Boolean).length;
  const oddHint = () => {
    const n = filled() || names.length;
    if (n % 2 === 1) {
      return `<p class="setup-hint">Número impar: alguien pasa automático (bye) al azar.</p>`;
    }
    return "";
  };

  const render = () => {
    container.innerHTML = `
      <div class="setup-view">
        <div class="page-header">
          <a class="button back-link" href="/" aria-label="Volver">${chevronLeft}</a>
          <h1>Nuevo torneo</h1>
          <span class="header-spacer" aria-hidden="true"></span>
        </div>
        ${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : ""}
        <div class="setup-grid">
          <div class="setup-column">
            <div class="field">
              <span class="field-label">Jugadores (${names.length})</span>
              <div class="flap-toggle-group" role="group" aria-label="Atajos de cantidad">
                ${PRESETS.map(
                  (n) =>
                    `<button type="button" class="flap-toggle ${names.length === n ? "is-active" : ""}" data-count="${n}">${n}</button>`,
                ).join("")}
              </div>
              <div class="player-count-bar">
                <button type="button" id="remove-name" ${names.length <= MIN_PLAYERS ? "disabled" : ""} aria-label="Quitar jugador">−</button>
                <span class="player-count-num">${names.length}</span>
                <button type="button" id="add-name" ${names.length >= MAX_PLAYERS ? "disabled" : ""} aria-label="Agregar jugador">+</button>
              </div>
            </div>
            ${oddHint()}
            <div class="player-list" id="names-list">
              ${names
                .map(
                  (name, i) => `
                <div class="player-row">
                  ${flapIndex(i + 1)}
                  <input type="text" value="${escapeHtml(name)}" placeholder="Jugador ${i + 1}" />
                </div>`,
                )
                .join("")}
            </div>
            <button type="button" id="shuffle-names" class="button-aleatorio">${dice} Aleatorio</button>
          </div>
          <div class="setup-column setup-column--rules">
            ${renderRulesToggles(rules)}
            <button type="button" id="create-room" class="primary setup-start" ${busy ? "disabled" : ""}>
              ${busy ? "Creando…" : "Empezar torneo"}
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  };

  const bindEvents = () => {
    container.querySelectorAll<HTMLInputElement>("#names-list input").forEach((input, i) => {
      input.addEventListener("input", () => {
        names[i] = input.value;
      });
    });

    container.querySelectorAll<HTMLButtonElement>("[data-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const n = Number(btn.dataset.count);
        if (n > names.length) names = [...names, ...Array(n - names.length).fill("")];
        else names = names.slice(0, n);
        render();
      });
    });

    container.querySelector("#add-name")!.addEventListener("click", () => {
      if (names.length < MAX_PLAYERS) {
        names.push("");
        render();
      }
    });

    container.querySelector("#remove-name")!.addEventListener("click", () => {
      if (names.length > MIN_PLAYERS) {
        names.pop();
        render();
      }
    });

    container.querySelector("#shuffle-names")!.addEventListener("click", () => {
      names = shuffle(names);
      render();
    });

    container.querySelectorAll<HTMLButtonElement>(".flap-toggle[data-rule]").forEach((btn) => {
      btn.addEventListener("click", () => {
        rules = applyRuleToggle(rules, btn.dataset.rule!, btn.dataset.value!);
        render();
      });
    });

    container.querySelector("#create-room")!.addEventListener("click", async () => {
      const cleaned = names.map((n) => n.trim()).filter(Boolean);
      if (cleaned.length < MIN_PLAYERS) {
        error = "Necesitas al menos 2 nombres";
        render();
        return;
      }
      busy = true;
      error = "";
      render();
      try {
        const { id } = await createRoom("tournament", cleaned, rules);
        navigateTo(`/t/${id}`);
      } catch (err) {
        busy = false;
        error = err instanceof Error ? err.message : "No se pudo crear";
        render();
      }
    });
  };

  render();
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

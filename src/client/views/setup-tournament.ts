import type { MatchType, PointsTo, Rules } from "../../domain/types";
import { createRoom } from "../api";

const DEFAULT_RULES: Rules = { matchType: "best_of_3", pointsTo: 11 };

export function renderSetupTournament(container: HTMLElement): void {
  let names = ["", ""];
  let rules: Rules = { ...DEFAULT_RULES };
  let busy = false;
  let error = "";

  const render = () => {
    container.innerHTML = `
      <div class="stack setup-view">
        <h1>Nuevo torneo</h1>
        <p>Agrega entre 2 y 16 jugadores.</p>
        ${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : ""}
        <div class="stack" id="names-list">
          ${names
            .map(
              (name, i) => `
            <div class="name-row" data-index="${i}">
              <input type="text" value="${escapeHtml(name)}" placeholder="Jugador ${i + 1}" />
              <button type="button" class="remove-name" ${names.length <= 2 ? "disabled" : ""}>−</button>
            </div>`,
            )
            .join("")}
        </div>
        <div class="row">
          <button type="button" id="add-name" ${names.length >= 16 ? "disabled" : ""}>+ Jugador</button>
          <button type="button" id="shuffle-names">Mezclar nombres</button>
        </div>
        ${renderRules(rules)}
        <div class="row">
          <a class="button" href="/">Cancelar</a>
          <button type="button" id="create-room" class="primary" ${busy ? "disabled" : ""}>
            ${busy ? "Creando…" : "Crear torneo"}
          </button>
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

    container.querySelectorAll<HTMLButtonElement>(".remove-name").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.closest("[data-index]")!.getAttribute("data-index"));
        if (names.length > 2) {
          names.splice(i, 1);
          render();
        }
      });
    });

    container.querySelector("#add-name")!.addEventListener("click", () => {
      if (names.length < 16) {
        names.push("");
        render();
      }
    });

    container.querySelector("#shuffle-names")!.addEventListener("click", () => {
      names = shuffle(names);
      render();
    });

    container.querySelector<HTMLSelectElement>("#match-type")!.addEventListener("change", (e) => {
      rules = { ...rules, matchType: (e.target as HTMLSelectElement).value as MatchType };
    });

    container.querySelector<HTMLSelectElement>("#points-to")!.addEventListener("change", (e) => {
      rules = { ...rules, pointsTo: Number((e.target as HTMLSelectElement).value) as PointsTo };
    });

    container.querySelector("#create-room")!.addEventListener("click", async () => {
      const cleaned = names.map((n) => n.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        error = "Necesitas al menos 2 nombres";
        render();
        return;
      }
      busy = true;
      error = "";
      render();
      try {
        const { id } = await createRoom("tournament", cleaned, rules);
        location.href = `/t/${id}`;
      } catch (err) {
        busy = false;
        error = err instanceof Error ? err.message : "No se pudo crear";
        render();
      }
    });
  };

  render();
}

function renderRules(rules: Rules): string {
  return `
    <div class="field">
      <label for="match-type">Modo de partido</label>
      <select id="match-type">
        <option value="one_set" ${rules.matchType === "one_set" ? "selected" : ""}>1 set</option>
        <option value="best_of_3" ${rules.matchType === "best_of_3" ? "selected" : ""}>Mejor de 3</option>
        <option value="best_of_5" ${rules.matchType === "best_of_5" ? "selected" : ""}>Mejor de 5</option>
      </select>
    </div>
    <div class="field">
      <label for="points-to">Puntos por set</label>
      <select id="points-to">
        <option value="7" ${rules.pointsTo === 7 ? "selected" : ""}>7</option>
        <option value="11" ${rules.pointsTo === 11 ? "selected" : ""}>11</option>
      </select>
    </div>
  `;
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

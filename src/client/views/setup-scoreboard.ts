import type { MatchType, PointsTo, Rules } from "../../domain/types";
import { createRoom } from "../api";

const DEFAULT_RULES: Rules = { matchType: "best_of_3", pointsTo: 11 };

export function renderSetupScoreboard(container: HTMLElement): void {
  let names = ["", ""];
  let rules: Rules = { ...DEFAULT_RULES };
  let busy = false;
  let error = "";

  const render = () => {
    container.innerHTML = `
      <div class="stack setup-view">
        <h1>Solo marcador</h1>
        <p>Dos jugadores y las reglas del partido.</p>
        ${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : ""}
        <div class="stack" id="names-list">
          ${names
            .map(
              (name, i) => `
            <div class="name-row" data-index="${i}">
              <input type="text" value="${escapeHtml(name)}" placeholder="Jugador ${i + 1}" />
            </div>`,
            )
            .join("")}
        </div>
        ${renderRules(rules)}
        <div class="row">
          <a class="button" href="/">Cancelar</a>
          <button type="button" id="create-room" class="primary" ${busy ? "disabled" : ""}>
            ${busy ? "Creando…" : "Crear marcador"}
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLInputElement>("#names-list input").forEach((input, i) => {
      input.addEventListener("input", () => {
        names[i] = input.value;
      });
    });

    container.querySelector<HTMLSelectElement>("#match-type")!.addEventListener("change", (e) => {
      rules = { ...rules, matchType: (e.target as HTMLSelectElement).value as MatchType };
    });

    container.querySelector<HTMLSelectElement>("#points-to")!.addEventListener("change", (e) => {
      rules = { ...rules, pointsTo: Number((e.target as HTMLSelectElement).value) as PointsTo };
    });

    container.querySelector("#create-room")!.addEventListener("click", async () => {
      const cleaned = names.map((n) => n.trim());
      if (!cleaned[0] || !cleaned[1]) {
        error = "Ingresa los dos nombres";
        render();
        return;
      }
      busy = true;
      error = "";
      render();
      try {
        const { id } = await createRoom("scoreboard", cleaned, rules);
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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

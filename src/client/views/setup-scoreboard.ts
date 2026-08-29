import type { Rules } from "../../domain/types";
import { createRoom } from "../api";
import { navigateTo } from "../router";
import { flapIndex } from "../ui/flap";
import { chevronLeft } from "../ui/icons";
import { applyRuleToggle, renderRulesToggles } from "../ui/rules";

const DEFAULT_RULES: Rules = { matchType: "best_of_3", pointsTo: 11 };

export function renderSetupScoreboard(container: HTMLElement): void {
  let names = ["", ""];
  let rules: Rules = { ...DEFAULT_RULES };
  let busy = false;
  let error = "";

  const render = () => {
    container.innerHTML = `
      <div class="setup-view">
        <div class="page-header">
          <a class="button back-link" href="/" aria-label="Volver">${chevronLeft}</a>
          <h1>Solo marcador</h1>
          <span class="header-spacer" aria-hidden="true"></span>
        </div>
        ${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : ""}
        <div class="setup-grid">
          <div class="setup-column">
            <div class="field">
              <span class="field-label">Jugadores</span>
            </div>
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
          </div>
          <div class="setup-column setup-column--rules">
            ${renderRulesToggles(rules)}
            <button type="button" id="create-room" class="primary setup-start" ${busy ? "disabled" : ""}>
              ${busy ? "Creando…" : "Empezar"}
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLInputElement>("#names-list input").forEach((input, i) => {
      input.addEventListener("input", () => {
        names[i] = input.value;
      });
    });

    container.querySelectorAll<HTMLButtonElement>(".flap-toggle[data-rule]").forEach((btn) => {
      btn.addEventListener("click", () => {
        rules = applyRuleToggle(rules, btn.dataset.rule!, btn.dataset.value!);
        render();
      });
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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

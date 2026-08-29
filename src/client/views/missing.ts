import { flapTitle } from "../ui/flap";

export function renderMissing(container: HTMLElement): void {
  container.innerHTML = `
    <div class="missing-view">
      ${flapTitle("404")}
      <h1>Sala no existe</h1>
      <p class="error-msg">No existe o expiró.</p>
      <a class="button primary" href="/">Volver al inicio</a>
    </div>
  `;
}

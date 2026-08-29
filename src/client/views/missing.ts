export function renderMissing(container: HTMLElement): void {
  container.innerHTML = `
    <div class="stack">
      <h1>Sala no existe</h1>
      <p class="error-msg">No existe o expiró.</p>
      <a class="button primary" href="/">Volver al inicio</a>
    </div>
  `;
}

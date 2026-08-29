import { flapHomeTitle } from "../ui/flap";
import { navigateTo } from "../router";

export function renderHome(container: HTMLElement): void {
  container.innerHTML = `
    <div class="home-view">
      ${flapHomeTitle()}
      <p class="home-footer">Comparte el link y juega</p>
      <div class="home-actions">
        <a class="button primary" href="/nuevo">Nuevo torneo</a>
        <a class="button" href="/marcador">Solo marcador</a>
      </div>
      <form id="join-form" class="home-join">
        <label for="join-id">Unirse a una sala</label>
        <input id="join-id" name="id" type="text" placeholder="Código o URL" autocomplete="off" />
        <button type="submit" class="primary">Entrar</button>
      </form>
    </div>
  `;

  container.querySelector<HTMLFormElement>("#join-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = container.querySelector<HTMLInputElement>("#join-id")!.value.trim();
    const id = extractRoomId(raw);
    if (!id) {
      alert("Ingresa un código válido");
      return;
    }
    navigateTo(`/t/${id}`);
  });
}

function extractRoomId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/t\/([23456789abcdefghjkmnpqrstuvwxyz]{6})/i);
  if (fromUrl) return fromUrl[1]!.toLowerCase();
  if (/^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

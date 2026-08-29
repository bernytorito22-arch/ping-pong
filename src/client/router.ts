type NavigateListener = () => void;

let listener: NavigateListener | null = null;

export function setNavigateListener(fn: NavigateListener): void {
  listener = fn;
}

export function navigateTo(path: string, replace = false): void {
  const target = path.startsWith("/") ? path : `/${path}`;
  const current = location.pathname + location.search + location.hash;
  if (current !== target) {
    if (replace) history.replaceState(null, "", target);
    else history.pushState(null, "", target);
  }
  listener?.();
}

export function installLinkInterceptor(): void {
  document.addEventListener("click", (event) => {
    const anchor = (event.target as Element).closest("a[href]");
    if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const url = new URL(anchor.href, location.origin);
    if (url.origin !== location.origin) return;

    event.preventDefault();
    navigateTo(url.pathname + url.search + url.hash);
  });
}

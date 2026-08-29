import type { ApplyErrorCode } from "./domain/types";

const MESSAGES: Record<ApplyErrorCode, string> = {
  not_found: "No encontrado",
  expired: "La sala expiró",
  invalid: "Acción no válida",
  match_not_ready: "El partido no está listo",
  randomize_locked: "No se puede mezclar: ya hay puntos jugados",
  undo_blocked: "No se puede deshacer: el siguiente partido ya tiene puntos",
};

export function errorMessage(code: ApplyErrorCode): string {
  return MESSAGES[code];
}

export function isApplyError(err: unknown): err is { code: ApplyErrorCode } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

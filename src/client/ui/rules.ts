import type { MatchType, PointsTo, Rules } from "../../domain/types";

export function renderRulesToggles(rules: Rules): string {
  return `
    <div class="field">
      <span class="field-label">Puntos</span>
      <div class="flap-toggle-group" role="group" aria-label="Puntos por set">
        <button type="button" class="flap-toggle ${rules.pointsTo === 7 ? "is-active" : ""}" data-rule="pointsTo" data-value="7">7</button>
        <button type="button" class="flap-toggle ${rules.pointsTo === 11 ? "is-active" : ""}" data-rule="pointsTo" data-value="11">11</button>
      </div>
    </div>
    <div class="field">
      <span class="field-label">Sets</span>
      <div class="flap-toggle-group" role="group" aria-label="Sets">
        <button type="button" class="flap-toggle ${rules.matchType === "one_set" ? "is-active" : ""}" data-rule="matchType" data-value="one_set">1</button>
        <button type="button" class="flap-toggle ${rules.matchType === "best_of_3" ? "is-active" : ""}" data-rule="matchType" data-value="best_of_3">3</button>
        <button type="button" class="flap-toggle ${rules.matchType === "best_of_5" ? "is-active" : ""}" data-rule="matchType" data-value="best_of_5">5</button>
      </div>
    </div>
  `;
}

export function applyRuleToggle(
  rules: Rules,
  rule: string,
  value: string,
): Rules {
  if (rule === "matchType") return { ...rules, matchType: value as MatchType };
  if (rule === "pointsTo") return { ...rules, pointsTo: Number(value) as PointsTo };
  return rules;
}

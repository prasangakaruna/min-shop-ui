import type { NutritionFacts, NutritionFactsRow } from '@/lib/api';

export function parseNutritionRowsText(text: string): NutritionFactsRow[] {
  const rows: NutritionFactsRow[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('|').map((p) => p.trim());
    if (parts.length < 2) continue;
    const label = parts[0] ?? '';
    const amount = parts[1] ?? '';
    const dv = (parts[2] ?? '').trim();
    let indent = 0;
    if (parts.length >= 4 && parts[3] !== undefined && parts[3] !== '') {
      const n = parseInt(parts[3], 10);
      if (!Number.isNaN(n)) indent = Math.min(3, Math.max(0, n));
    }
    const row: NutritionFactsRow = { label, amount, indent };
    if (dv) row.dv = dv;
    rows.push(row);
  }
  return rows;
}

export function nutritionFormToPayload(form: {
  nutrition_serves_about: string;
  nutrition_serving_size: string;
  nutrition_serving_weight: string;
  nutrition_calories: string;
  nutrition_rows_text: string;
}): NutritionFacts | null {
  const rows = parseNutritionRowsText(form.nutrition_rows_text);
  const serves_about = form.nutrition_serves_about.trim();
  const serving_size = form.nutrition_serving_size.trim();
  const serving_weight = form.nutrition_serving_weight.trim();
  const calories = form.nutrition_calories.trim();
  if (!serves_about && !serving_size && !serving_weight && !calories && rows.length === 0) return null;
  const out: NutritionFacts = { rows };
  if (serves_about) out.serves_about = serves_about;
  if (serving_size) out.serving_size = serving_size;
  if (serving_weight) out.serving_weight = serving_weight;
  if (calories) out.calories = calories;
  return out;
}

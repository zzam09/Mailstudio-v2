export interface GeneratedGuide {
  guide: string;
  fields: string[];
}

export function detectTemplateFields(content: string): string[] {
  const fields = new Set<string>();
  const matches = content.matchAll(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g);

  for (const match of matches) {
    const field = match[1]?.trim();
    if (field) {
      fields.add(field);
    }
  }

  return Array.from(fields);
}

export function generateGuide(content: string): GeneratedGuide {
  const fields = detectTemplateFields(content);

  return {
    guide:
      fields.length > 0
        ? `Detected fields: ${fields.join(", ")}`
        : "No dynamic fields detected.",
    fields,
  };
}

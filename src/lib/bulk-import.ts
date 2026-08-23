export interface ParseError {
  blockIndex: number;
  message: string;
}

export interface ParsedExamQuestion {
  questionText: string;
  answerText: string;
  language: "en" | "si";
  category?: string;
  correctOptionLabel?: string;
}

export interface ParsedVocabWord {
  term: string;
  definition?: string;
  exampleSentence?: string;
  sourceBook?: string;
}

function splitBlocks(text: string): string[] {
  return text
    .split(/^\s*---\s*$/m)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

// A block is a sequence of lines. A line starting with "Label:" opens (or
// switches to) that field; any line before the next label is appended to
// whichever field is currently open, so fields can span multiple lines.
function parseFields(block: string, labels: string[]): Map<string, string> {
  const labelPattern = new RegExp(`^(${labels.join("|")})\\s*:\\s*(.*)$`, "i");
  const fields = new Map<string, string>();
  let currentLabel: string | null = null;

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trimEnd();
    const match = line.match(labelPattern);
    if (match) {
      currentLabel = match[1].toLowerCase();
      const existing = fields.get(currentLabel);
      fields.set(currentLabel, existing ? `${existing}\n${match[2]}` : match[2]);
    } else if (currentLabel && line.trim() !== "") {
      fields.set(currentLabel, `${fields.get(currentLabel)}\n${line}`);
    }
    // Unlabeled lines before any label has started are discarded — callers
    // needing a leading unlabeled field (exam questions) extract it
    // themselves before handing the remainder to parseFields.
  }

  for (const [key, value] of fields) {
    fields.set(key, value.trim());
  }
  return fields;
}

// Exam blocks have a fixed shape: an optional metadata header
// (Category/Language/Option, one per line), then free-text question lines,
// then an "Answer:" line that starts the (possibly multi-line) answer.
// Metadata is only recognized in the header — once question text starts,
// later lines are never reinterpreted as metadata.
export function parseExamQuestionBlocks(text: string): {
  items: ParsedExamQuestion[];
  errors: ParseError[];
} {
  const items: ParsedExamQuestion[] = [];
  const errors: ParseError[] = [];
  const metaPattern = /^(Category|Language|Option)\s*:\s*(.*)$/i;
  const answerPattern = /^Answer\s*:\s*(.*)$/i;

  splitBlocks(text).forEach((block, blockIndex) => {
    const meta = new Map<string, string>();
    const questionLines: string[] = [];
    const answerLines: string[] = [];
    let state: "header" | "question" | "answer" = "header";

    for (const rawLine of block.split("\n")) {
      const line = rawLine.trimEnd();

      if (state === "header") {
        if (line.trim() === "") continue;
        const metaMatch = line.match(metaPattern);
        if (metaMatch) {
          meta.set(metaMatch[1].toLowerCase(), metaMatch[2].trim());
          continue;
        }
        state = "question";
        // fall through — this line is the first line of the question
      }

      if (state === "question") {
        const answerMatch = line.match(answerPattern);
        if (answerMatch) {
          state = "answer";
          if (answerMatch[1].trim() !== "") answerLines.push(answerMatch[1]);
          continue;
        }
        questionLines.push(line);
        continue;
      }

      answerLines.push(line);
    }

    const questionText = questionLines.join("\n").trim();
    const answerText = answerLines.join("\n").trim();
    const languageRaw = (meta.get("language") ?? "en").trim().toLowerCase();

    if (!questionText) {
      errors.push({ blockIndex, message: "Missing question text" });
      return;
    }
    if (!answerText) {
      errors.push({ blockIndex, message: "Missing \"Answer:\" line" });
      return;
    }
    if (languageRaw !== "en" && languageRaw !== "si") {
      errors.push({ blockIndex, message: `Unknown language "${languageRaw}" (use en or si)` });
      return;
    }

    items.push({
      questionText,
      answerText,
      language: languageRaw,
      category: meta.get("category") || undefined,
      correctOptionLabel: meta.get("option") || undefined,
    });
  });

  return { items, errors };
}

export function parseVocabWordBlocks(text: string): {
  items: ParsedVocabWord[];
  errors: ParseError[];
} {
  const items: ParsedVocabWord[] = [];
  const errors: ParseError[] = [];

  splitBlocks(text).forEach((block, blockIndex) => {
    const fields = parseFields(block, ["Term", "Definition", "Example", "Source"]);
    const term = (fields.get("term") ?? "").trim();

    if (!term) {
      errors.push({ blockIndex, message: "Missing \"Term:\" line" });
      return;
    }

    items.push({
      term,
      definition: fields.get("definition") || undefined,
      exampleSentence: fields.get("example") || undefined,
      sourceBook: fields.get("source") || undefined,
    });
  });

  return { items, errors };
}

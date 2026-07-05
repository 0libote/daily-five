import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, type DecorationSet, type EditorView, ViewPlugin } from "@codemirror/view";
import { END, START } from "./daily-note";

const marker = Decoration.line({ attributes: { class: "daily-five-editor-marker" } });
const block = Decoration.line({ attributes: { class: "daily-five-editor-line" } });
const score = Decoration.line({ attributes: { class: "daily-five-editor-line daily-five-editor-score" } });

export function dailyFiveLineTypes(lines: string[]): Array<"marker" | "line" | "score" | undefined> {
  let inside = false;
  return lines.map((line) => {
    if (line.includes(START)) {
      inside = true;
      return "marker";
    }
    if (line.includes(END)) {
      inside = false;
      return "marker";
    }
    if (!inside) return undefined;
    return /^[🟩🟨⬛]+$/.test(line.trim()) ? "score" : "line";
  });
}

function decorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const lines = Array.from({ length: view.state.doc.lines }, (_, index) => view.state.doc.line(index + 1).text);
  dailyFiveLineTypes(lines).forEach((type, index) => {
    if (!type) return;
    const number = index + 1;
    const line = view.state.doc.line(number);
    builder.add(line.from, line.from, type === "marker" ? marker : type === "score" ? score : block);
  });
  return builder.finish();
}

export const dailyFiveEditor = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  constructor(view: EditorView) { this.decorations = decorations(view); }
  update(update: { docChanged: boolean; view: EditorView }) {
    if (update.docChanged) this.decorations = decorations(update.view);
  }
}, { decorations: (plugin) => plugin.decorations });

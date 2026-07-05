import { requestUrl } from "obsidian";
import { readAnswer } from "./cache";

export { readAnswer } from "./cache";

export interface AnswerSettings {
  cacheUrl: string;
  enableApi: boolean;
  apiUrl: string;
}

export async function resolveAnswer(
  date: string,
  settings: AnswerSettings,
): Promise<string> {
  for (const url of [
    settings.cacheUrl,
    ...(settings.enableApi && settings.apiUrl ? [settings.apiUrl] : []),
  ]) {
    try {
      const response = await requestUrl({
        url: url.replace("{date}", encodeURIComponent(date)),
      });
      const answer = readAnswer(response.json, date);
      if (answer) return answer;
    } catch {
      // Try the next explicitly configured source.
    }
  }
  throw new Error("No answer is available for today.");
}

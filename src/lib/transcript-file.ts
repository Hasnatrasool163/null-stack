import { MAX_TRANSCRIPT_CHARS } from "@/lib/schemas";

/** File types the transcript box accepts (plain text and caption exports). */
export const TRANSCRIPT_ACCEPT =
  ".txt,.md,.markdown,.vtt,.srt,.log,.csv,text/plain,text/markdown,text/vtt";

const TEXT_EXT = /\.(txt|md|markdown|vtt|srt|log|csv)$/i;
const BINARY_EXT =
  /\.(pdf|docx?|rtf|pages|odt|pptx?|xlsx?|zip|png|jpe?g|mp3|mp4|m4a|wav)$/i;
const MAX_BYTES = 2 * 1024 * 1024;

export type ReadResult =
  | { ok: true; text: string; name: string; cleaned: boolean }
  | { ok: false; message: string };

/**
 * Caption files (.vtt/.srt) are mostly timing noise: drop the header, cue
 * numbers and "00:00:01.000 --> 00:00:04.000" lines, keep who said what.
 */
function stripCaptions(raw: string): string {
  return (
    raw
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .filter(
        (line) =>
          !/^WEBVTT/.test(line) &&
          !/^\d+$/.test(line.trim()) &&
          !/-->/.test(line) &&
          !/^(NOTE|STYLE|REGION)\b/.test(line),
      )
      // Keep the speaker: "<v Ayesha>Hi</v>" becomes "Ayesha: Hi".
      .map((line) =>
        line
          .replace(/<v(?:\.[^\s>]*)?\s+([^>]+)>/g, "$1: ")
          .replace(/<\/?[a-z][^>]*>/gi, "")
          .trimEnd(),
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Reads a dropped/uploaded file in the browser. Nothing is uploaded to the server here. */
export async function readTranscriptFile(file: File): Promise<ReadResult> {
  if (BINARY_EXT.test(file.name)) {
    return {
      ok: false,
      message: `${file.name} is not a plain-text file. Export the transcript as .txt (or .vtt/.srt captions) and try again.`,
    };
  }
  if (
    !TEXT_EXT.test(file.name) &&
    file.type &&
    !file.type.startsWith("text/")
  ) {
    return { ok: false, message: `${file.name} is not a text file.` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: `${file.name} is too large (max 2 MB).` };
  }
  const raw = await file.text();
  if (raw.includes("\u0000")) {
    return {
      ok: false,
      message: `${file.name} looks like a binary file, not text.`,
    };
  }
  const isCaptions = /\.(vtt|srt)$/i.test(file.name) || /^WEBVTT/.test(raw);
  const text = (
    isCaptions ? stripCaptions(raw) : raw.replace(/\r\n?/g, "\n")
  ).trim();
  if (!text) return { ok: false, message: `${file.name} is empty.` };
  if (text.length > MAX_TRANSCRIPT_CHARS) {
    return {
      ok: false,
      message: `${file.name} has ${text.length.toLocaleString("en-US")} characters; the limit is ${MAX_TRANSCRIPT_CHARS.toLocaleString("en-US")}. Trim it and try again.`,
    };
  }
  return { ok: true, text, name: file.name, cleaned: isCaptions };
}

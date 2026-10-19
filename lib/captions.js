// Caption engine shared by the browser and tests (UMD-style export).
//
// Words are the source of truth for karaoke highlighting. Lines are derived
// groupings used for display and SRT/VTT export. No dependencies.

(function (global) {
  "use strict";

  const MAX_WORDS_PER_LINE = 6;
  const MAX_LINE_GAP = 0.8; // seconds of silence that closes a caption line
  const WORKFLOW_MAX_SCENES = 8; // free-run cap per storyboard

  function cloneWords(words) {
    return (words || []).map((w) => ({ text: w.text, start: w.start, end: w.end }));
  }

  // Groups timed words into caption lines. A line closes when it is full,
  // when a long pause follows, or at sentence punctuation.
  function buildCaptionLines(words, options) {
    const opts = options || {};
    const maxWords = opts.maxWords || MAX_WORDS_PER_LINE;
    const maxGap = typeof opts.maxGap === "number" ? opts.maxGap : MAX_LINE_GAP;
    const lines = [];
    let current = null;

    for (const raw of words || []) {
      if (!raw || typeof raw.start !== "number" || typeof raw.end !== "number") continue;
      const word = { text: String(raw.text).trim(), start: raw.start, end: raw.end };
      if (!word.text) continue;

      if (!current) {
        current = { start: word.start, end: word.end, words: [word] };
      } else if (word.start - current.end > maxGap || current.words.length >= maxWords) {
        lines.push(current);
        current = { start: word.start, end: word.end, words: [word] };
      } else {
        current.end = word.end;
        current.words.push(word);
      }

      if (current && /[.!?…。！？]$/.test(word.text)) {
        lines.push(current);
        current = null;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // Distributes a plain text's words evenly across a duration, weighted by
  // word length. This is the no-provider fallback when real timings
  // are unavailable (honest estimates, refined once audio exists).
  function wordsFromText(text, duration, startOffset = 0) {
    const tokens = String(text || "").split(/\s+/).filter(Boolean);
    if (!tokens.length || !Number.isFinite(duration) || duration <= 0) return [];
    const weights = tokens.map((t) => Math.max(1, t.length));
    const total = weights.reduce((sum, w) => sum + w, 0);
    const words = [];
    let cursor = startOffset;
    const scale = duration / total;
    tokens.forEach((token, index) => {
      const span = weights[index] * scale;
      words.push({ text: token, start: cursor, end: cursor + Math.max(0.12, span) });
      cursor += span;
    });
    words[words.length - 1].end = startOffset + duration;
    return words;
  }

  // Spreads the words of a caption line evenly across [start, end] — used when
  // the user edits line text but word timings no longer match.
  function wordsForEditedLine(line, text) {
    const tokens = String(text || "").split(/\s+/).filter(Boolean);
    if (!tokens.length || typeof line.start !== "number") return [];
    const duration = Math.max(0.2, (line.end || line.start + 1) - line.start);
    return wordsFromText(tokens.join(" "), duration, line.start);
  }

  // Sticky karaoke lookup: the active line stays visible until the next line
  // starts; the active word is the last word that has started.
  function lineAndWordAt(lines, time) {
    if (!lines || !lines.length) return null;
    let lineIndex = -1;
    let wordIndex = -1;
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].start <= time) {
        lineIndex = i;
      } else break;
    }
    if (lineIndex < 0) return null;
    const line = lines[lineIndex];
    for (let i = 0; i < line.words.length; i += 1) {
      if (line.words[i].start <= time) {
        wordIndex = i;
      } else break;
    }
    return { lineIndex, wordIndex };
  }

  // Splits a script (or prompt) into scene-sized sentences, capped at maxScenes.
  // Returns { scenes: [{ text }], skipped } so callers can report truncation honestly.
  function splitScenes(text, maxScenes) {
    const cap = maxScenes || WORKFLOW_MAX_SCENES;
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return { scenes: [], skipped: 0 };
    let sentences = clean.split(/(?<=[.!?…。！？])\s+/).map((s) => s.trim()).filter(Boolean);
    if (!sentences.length) sentences = [clean];
    const kept = sentences.slice(0, cap);
    return { scenes: kept.map((sentence) => ({ text: sentence })), skipped: Math.max(0, sentences.length - cap) };
  }

  function timestamp(seconds, decimal) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const totalMs = Math.round(seconds * 1000);
    const ms = String(totalMs % 1000).padStart(3, "0");
    const s = String(Math.floor(totalMs / 1000) % 60).padStart(2, "0");
    const m = String(Math.floor(totalMs / 60000) % 60).padStart(2, "0");
    const h = String(Math.floor(totalMs / 3600000)).padStart(2, "0");
    return `${h}:${m}:${s}${decimal}${ms}`;
  }

  function lineText(line) {
    return line.words.map((w) => w.text).join(" ");
  }

  function formatSrt(lines) {
    if (!lines || !lines.length) return "";
    return lines
      .map((line, index) => {
        const from = timestamp(line.start, ",");
        const to = timestamp(Math.max(line.end, line.start + 0.1), ",");
        return `${index + 1}\n${from} --> ${to}\n${lineText(line)}`;
      })
      .join("\n\n");
  }

  function formatVtt(lines) {
    const body = formatSrt(lines).replace(/,/g, ".");
    return `WEBVTT\n\n${body}`;
  }

  // Parses SRT (and VTT — both use block --> text) caption files.
  function parseSrt(text) {
    const timeRegex = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/g;
    const blocks = String(text || "").replace(/\r/g, "").split(/\n\s*\n/);
    const entries = [];
    timeRegex.lastIndex = 0;
    for (const block of blocks) {
      const match = timeRegex.exec(block);
      timeRegex.lastIndex = 0;
      if (!match) continue;
      const start = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
      const end = Number(match[5]) * 3600 + Number(match[6]) * 60 + Number(match[7]) + Number(match[8]) / 1000;
      const body = block
        .replace(timeRegex, "")
        .split("\n")
        .filter((l) => l.trim() && !/^\d+$/.test(l.trim()))
        .join(" ")
        .trim();
      if (body) entries.push({ start, end: Math.max(end, start + 0.1), text: body });
    }
    return entries;
  }

  const CaptionsLib = {
    cloneWords: cloneWords,
    buildCaptionLines: buildCaptionLines,
    wordsFromText: wordsFromText,
    wordsForEditedLine: wordsForEditedLine,
    lineAndWordAt: lineAndWordAt,
    lineText: lineText,
    timestamp: timestamp,
    formatSrt: formatSrt,
    formatVtt: formatVtt,
    parseSrt: parseSrt,
    splitScenes: splitScenes,
    MAX_WORDS_PER_LINE: MAX_WORDS_PER_LINE,
    MAX_LINE_GAP: MAX_LINE_GAP,
    WORKFLOW_MAX_SCENES: WORKFLOW_MAX_SCENES
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CaptionsLib;
  }
  global.CaptionsLib = CaptionsLib;
})(typeof window !== "undefined" ? window : globalThis);

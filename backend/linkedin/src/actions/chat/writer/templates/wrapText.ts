/**
 * Approximate per-character width as a fraction of font size, used to
 * estimate wrapped-text width without loading real font metrics. This
 * is deliberately a rough average across common proportional sans-serif
 * fonts (most letters ~0.5-0.6em, 'i'/'l' narrower, 'M'/'W' wider) —
 * not glyph-accurate. Callers should keep real max-width budgets with
 * some safety margin (~10-15%) rather than relying on this being exact.
 */
const AVERAGE_CHAR_WIDTH_EM = 0.56;

const NARROW_CHARS = new Set(["i", "l", "j", "I", ".", ",", "'", "!", ":", ";", "|"]);
const WIDE_CHARS = new Set(["m", "w", "M", "W", "@"]);

function estimateCharWidth(char: string, fontSizePx: number): number {
    if (NARROW_CHARS.has(char)) return fontSizePx * (AVERAGE_CHAR_WIDTH_EM * 0.55);
    if (WIDE_CHARS.has(char)) return fontSizePx * (AVERAGE_CHAR_WIDTH_EM * 1.35);
    return fontSizePx * AVERAGE_CHAR_WIDTH_EM;
}

function estimateTextWidth(text: string, fontSizePx: number): number {
    let width = 0;
    for (const char of text) {
        width += estimateCharWidth(char, fontSizePx);
    }
    return width;
}

export type WrapTextOptions = {
    maxWidthPx: number;
    fontSizePx: number;
    maxLines: number;
};

export type WrappedText = {
    lines: string[];
    truncated: boolean;
};

/**
 * Greedy word-wrap using the approximate width estimator above. Breaks
 * on whitespace only (never mid-word) — a single word wider than
 * maxWidthPx on its own is placed on its own line rather than being
 * force-split, since breaking a word mid-character is worse for
 * readability than one slightly-overflowing line.
 *
 * If the text still doesn't fit within maxLines, the last line is
 * truncated with a trailing "…" and truncated is reported true.
 */
export function wrapText(text: string, options: WrapTextOptions): WrappedText {
    const { maxWidthPx, fontSizePx, maxLines } = options;
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return { lines: [], truncated: false };
    }

    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        const candidateWidth = estimateTextWidth(candidate, fontSizePx);

        if (candidateWidth <= maxWidthPx || !currentLine) {
            currentLine = candidate;
            continue;
        }

        lines.push(currentLine);
        currentLine = word;

        if (lines.length === maxLines) {
            const truncatedLine = truncateToWidth(currentLine, maxWidthPx, fontSizePx);
            lines[lines.length - 1] = truncatedLine;
            return { lines, truncated: true };
        }
    }

    if (currentLine) {
        if (lines.length < maxLines) {
            lines.push(currentLine);
        } else {
            const lastLine = lines[lines.length - 1];
            const truncatedLine = truncateToWidth(`${lastLine} ${currentLine}`, maxWidthPx, fontSizePx);
            lines[lines.length - 1] = truncatedLine;
            return { lines, truncated: true };
        }
    }

    return { lines, truncated: false };
}

/**
 * Truncates a single line to fit maxWidthPx, appending "…". Removes
 * characters from the end until the estimated width (including the
 * ellipsis itself) fits, rather than a naive fixed character-count cut.
 */
function truncateToWidth(text: string, maxWidthPx: number, fontSizePx: number): string {
    const ellipsis = "…";
    const ellipsisWidth = estimateTextWidth(ellipsis, fontSizePx);
    let result = text;

    while (result.length > 0 && estimateTextWidth(result, fontSizePx) + ellipsisWidth > maxWidthPx) {
        result = result.slice(0, -1);
    }

    return result.trimEnd() + ellipsis;
}
import { wrapText } from "./wrapText";
import sharp from "sharp";

const CANVAS_SIZE = 1200;

const FRAME_LEFT = 0;
const FRAME_TOP = 410;
const FRAME_RIGHT = 1200;
const FRAME_BOTTOM = 770;
const FRAME_CORNER_RADIUS = 40;

const HEADING_FONT_SIZE = 40;
const HEADING_MAX_WIDTH = 820;
const HEADING_MAX_LINES = 3;
const HEADING_LINE_HEIGHT = 52;
const HEADING_START_X = 235;
const HEADING_START_Y = 500;

const CREDIT_FONT_SIZE = 26;
const CREDIT_START_X = 240;
const CREDIT_Y = FRAME_BOTTOM + 90;
const AVATAR_CX = 170;
const AVATAR_CY = CREDIT_Y - 10;
const AVATAR_R = 45;

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

type QuoteCardInput = {
    heading: string;
    credit?: string | null;
};

/**
 * Builds the raw SVG string for quote_card_v1. wrapText handles the
 * heading's line-breaking + truncation (matching the real template's
 * visible ellipsis-truncation behavior); everything else is static
 * layout matching the reference image (dark navy background, bracket-
 * quote frame, opening/closing quote glyphs).
 */
function buildQuoteCardSvg({ heading, credit }: QuoteCardInput): string {
    const wrapped = wrapText(heading, {
        maxWidthPx: HEADING_MAX_WIDTH,
        fontSizePx: HEADING_FONT_SIZE,
        maxLines: HEADING_MAX_LINES,
    });

    const headingLines = wrapped.lines
        .map((line, i) => `<tspan x="${HEADING_START_X}" y="${HEADING_START_Y + i * HEADING_LINE_HEIGHT}">${escapeXml(line)}</tspan>`)
        .join("");

    const creditBlock = credit
        ? `
        <circle cx="${AVATAR_CX}" cy="${AVATAR_CY}" r="${AVATAR_R}" fill="#3a3a55" />
        <text x="${CREDIT_START_X}" y="${CREDIT_Y}" font-family="sans-serif" font-size="${CREDIT_FONT_SIZE}" fill="#ffffff">${escapeXml(credit)}</text>
        `
        : "";

    return `
<svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#191933" />

    <path
        d="M ${FRAME_LEFT} ${FRAME_TOP}
           L ${FRAME_RIGHT - FRAME_CORNER_RADIUS} ${FRAME_TOP}
           Q ${FRAME_RIGHT} ${FRAME_TOP} ${FRAME_RIGHT} ${FRAME_TOP + FRAME_CORNER_RADIUS}
           L ${FRAME_RIGHT} ${(FRAME_TOP + FRAME_BOTTOM) / 2}
           M ${FRAME_LEFT + 160} ${(FRAME_TOP + FRAME_BOTTOM) / 2 + 40}
           L ${FRAME_LEFT + 160} ${FRAME_BOTTOM - FRAME_CORNER_RADIUS}
           Q ${FRAME_LEFT + 160} ${FRAME_BOTTOM} ${FRAME_LEFT + 160 + FRAME_CORNER_RADIUS} ${FRAME_BOTTOM}
           L ${FRAME_RIGHT} ${FRAME_BOTTOM}"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
    />

    <text x="130" y="${FRAME_TOP + 100}" font-family="sans-serif" font-size="80" font-weight="700" fill="#8b7ae8">"</text>
    <text x="985" y="${(FRAME_TOP + FRAME_BOTTOM) / 2 + 25}" font-family="sans-serif" font-size="80" font-weight="700" fill="#8b7ae8">"</text>

    <text font-family="sans-serif" font-size="${HEADING_FONT_SIZE}" fill="#ffffff">
        ${headingLines}
    </text>

    ${creditBlock}
</svg>
`.trim();
}

export type GeneratedImage = {
    buffer: Buffer;
    truncated: boolean;
};

export async function generateQuoteCard(input: QuoteCardInput): Promise<GeneratedImage> {
    const wrapped = wrapText(input.heading, {
        maxWidthPx: HEADING_MAX_WIDTH,
        fontSizePx: HEADING_FONT_SIZE,
        maxLines: HEADING_MAX_LINES,
    });

    const svg = buildQuoteCardSvg(input);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return { buffer, truncated: wrapped.truncated };
}
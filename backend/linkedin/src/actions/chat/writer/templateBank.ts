import { LinkedinMediaType } from "../../../generated/prisma";

export type ContentSlotField = "textHeading" | "textSubheading" | "textCredit" | "textParagraph";

/**
 * A single field's real contract within a template — what it's FOR
 * (description), how long it can be (maxLength — enforced both in the
 * prompt shown to D and in harness validation, so D isn't guessing at a
 * limit and the harness doesn't have to silently truncate anything),
 * and whether it's required.
 */
export type FieldSpec = {
    description: string;
    maxLength: number;
    required: boolean;
};

export type TemplateDefinition = {
    templateId: string;
    mediaType: Extract<LinkedinMediaType, "IMAGE" | "CAROUSEL">;
    /** What this template is FOR, not just its mechanical shape. */
    description: string;
    /**
     * Recommended slide/page count — shown to D as the target to aim
     * for. For IMAGE this is always 1 and IS the hard requirement
     * (a single image has no flexible count). For CAROUSEL this is a
     * recommendation, not a hard equality requirement — minSlots/
     * maxSlots below is what's actually enforced.
     */
    slotCount: number;
    /**
     * Enforced range for CAROUSEL. Ignored for IMAGE (always exactly 1,
     * checked directly against slotCount instead). A carousel is
     * repeated images expressing a flow — the story can reasonably need
     * fewer or more slides than the recommended count, so this is a
     * real range, not slotCount repeated as both min and max.
     */
    minSlots?: number;
    maxSlots?: number;
    /**
     * Only the fields this template actually renders, each with its own
     * spec. Any ContentSlotField NOT present as a key here must stay
     * null on every slot.
     */
    fields: Partial<Record<ContentSlotField, FieldSpec>>;
};

/**
 * Hardcoded for now, not a DB table — real image-generation functions
 * land next week; this bank exists so D has real templates to choose
 * from and the harness has something concrete to validate against in
 * the meantime. Move to a DB-backed LinkedinTemplate model later if/when
 * templates need to be added without a redeploy.
 */
export const TEMPLATE_BANK: TemplateDefinition[] = [
    {
        templateId: "quote_card_v1",
        mediaType: "IMAGE",
        description: "A single striking quote or one-line insight inside a bracketed quotation frame, dark navy background with subtle wave line art in the corners. Best for a sharp, standalone statement meant to be screenshotted or saved.",
        slotCount: 1,
        fields: {
            textHeading: {
                description: "The quote or insight itself, rendered large inside the quotation frame. This is the entire visual — the only thing the reader's eye lands on. Must stand alone, no surrounding context. The frame visibly truncates with '…' if this runs long, so write it tight enough to land as a complete thought within the limit — do not rely on truncation to end the sentence for you.",
                maxLength: 90,
                required: true,
            },
            textCredit: {
                description: "Attribution line beneath the frame, rendered next to a circular avatar as 'Name | Title/Role' — e.g. 'Ateeb | Builder & Data Science Student'. Always include both a name and a short role/title separated by '|', not just a name alone.",
                maxLength: 50,
                required: false,
            },
        },
    },
    {
        templateId: "chat_capture_v1",
        mediaType: "IMAGE",
        description: "A dark card styled as a captured chat exchange — a rounded user message bubble at the top, followed by an AI response below it. Best for a hook framed as a real question someone asked and the answer that followed, used to hold attention by presenting the post as an authentic captured moment rather than authored copy.",
        slotCount: 1,
        fields: {
            textSubheading: {
                description: "The user's message, rendered inside the rounded bubble at the top of the card — a real question or line someone actually asked, phrased exactly as a person would type it. Not a heading, not a summary — the literal message.",
                maxLength: 80,
                required: true,
            },
            textParagraph: {
                description: "The AI's response beneath the bubble — the actual answer, written in full sentences and short paragraphs, not a bullet list. This carries the real substance; make it worth reading in full, since it's the reason the card holds attention.",
                maxLength: 420,
                required: true,
            },
        },
    },
];

export function findTemplate(templateId: string | null): TemplateDefinition | null {
    if (!templateId) return null;
    return TEMPLATE_BANK.find((t) => t.templateId === templateId) ?? null;
}

/**
 * Manifest block for D's context — every template's id, mediaType,
 * description, and full per-field contract (what each field is for,
 * its character limit, whether it's required), so D knows not just
 * WHICH fields to fill but what they mean and how long they can be.
 */
export function formatTemplateManifest(): string {
    const rows = TEMPLATE_BANK.map((t) => {
        const fieldLines = Object.entries(t.fields).map(([fieldName, spec]) => {
            const tag = spec.required ? "required" : "optional";
            return `    - ${fieldName} (${tag}, max ${spec.maxLength} chars): ${spec.description}`;
        });

        const slotLine = t.mediaType === "IMAGE"
            ? `${t.slotCount} slot (fixed)`
            : `recommended ${t.slotCount} slots, acceptable range ${t.minSlots}–${t.maxSlots}`;

        return [
            `- ${t.templateId} [${t.mediaType}, ${slotLine}]`,
            `  ${t.description}`,
            `  fields:`,
            ...fieldLines,
            `  Any field not listed above must stay null on every slot.`,
        ].join("\n");
    });

    return [
        "## Available Media Templates",
        "Choose template_id from this exact list, or use media.type=\"NONE\" with template_id=null if no template fits. Never invent a templateId that isn't listed here — it will fail validation and the post will not be created. Respect every field's max length — going over truncates or fails validation, it does not get shortened for you.",
        ...rows,
    ].join("\n");
}
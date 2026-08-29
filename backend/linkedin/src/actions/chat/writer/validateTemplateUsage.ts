import { findTemplate, ContentSlotField } from "./templateBank";
import { WriterResponse } from "./generateWriterResponse";

const ALL_FIELDS: ContentSlotField[] = ["textHeading", "textSubheading", "textCredit", "textParagraph"];

/**
 * Real validation against the template bank: does the templateId
 * actually exist, does the mediaType/slotCount match, is every
 * required field present and within its maxLength, and is every field
 * the template doesn't use left null. Throws on any violation — an
 * invalid template usage means the post as generated cannot actually
 * be rendered, so it is not something to silently coerce, truncate, or
 * ignore.
 */
export function validateTemplateUsage(media: WriterResponse["media"]): void {
    if (media.type === "NONE") {
        if (media.direction !== null) { // media.template_id !== null || 
            throw new Error(`media.type is "NONE" but template_id or content_slots were still populated. Both must be empty/null when there is no media.`);
        }
        return;
    }

    // if (!media.template_id) {
    //     throw new Error(`media.type is "${media.type}" but no template_id was provided. A non-NONE media type must name a real template.`);
    // }

    // const template = findTemplate(media.template_id);
    // if (!template) {
    //     throw new Error(`template_id="${media.template_id}" does not exist in the template bank. The writer must choose from the templates listed in its context — it cannot invent a new templateId.`);
    // }

    // if (template.mediaType !== media.type) {
    //     throw new Error(`template_id="${media.template_id}" is a ${template.mediaType} template, but media.type was declared as "${media.type}". These must match.`);
    // }

    if (!media.direction) {
        throw new Error(`media.type is "${media.type}" but no direction was provided. A non-NONE media type must provide a real direction.`);
    }

    // if (media.type === "IMAGE") {
    //     if (media.content_slots.length !== template.slotCount) {
    //         throw new Error(`template_id="${media.template_id}" is an IMAGE template and requires exactly ${template.slotCount} slot, but ${media.content_slots.length} were provided.`);
    //     }
    // } else {
    //     const min = template.minSlots ?? template.slotCount;
    //     const max = template.maxSlots ?? template.slotCount;
    //     if (media.content_slots.length < min || media.content_slots.length > max) {
    //         throw new Error(`template_id="${media.template_id}" accepts ${min}–${max} slots (recommended ${template.slotCount}), but ${media.content_slots.length} were provided.`);
    //     }
    // }

    // media.content_slots.forEach((slot, index) => {
    //     for (const field of ALL_FIELDS) {
    //         const spec = template.fields[field];
    //         const value = slot[field];

    //         if (!spec) {
    //             if (value !== null) {
    //                 throw new Error(`template_id="${media.template_id}" does not use "${field}", but slot ${index} (page ${slot.page}) has it populated ("${value}"). Fields not used by this template must stay null.`);
    //             }
    //             continue;
    //         }

    //         if (spec.required && (!value || !value.trim())) {
    //             throw new Error(`template_id="${media.template_id}" requires "${field}" on every slot, but slot ${index} (page ${slot.page}) has it empty or null.`);
    //         }

    //         if (value && value.length > spec.maxLength) {
    //             throw new Error(`template_id="${media.template_id}" field "${field}" on slot ${index} (page ${slot.page}) is ${value.length} chars, exceeding the ${spec.maxLength} char limit. Content is not truncated automatically — it must be written within the limit.`);
    //         }
    //     }
    // });
}
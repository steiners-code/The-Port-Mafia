import { LinkedinPostCategory } from "../../generated/prisma";
import { startOfWeek, isBefore } from "date-fns";
import { prisma } from "../../lib/db";

/**
 * Approximate single-timezone-per-country mapping. Deliberately not
 * precise for countries spanning multiple zones (US, Russia, Australia,
 * Canada, etc.) — "primary/most common zone" is an accepted
 * approximation for now, not a gap to silently work around with fake
 * precision. Extend as real users from unmapped countries show up;
 * unmapped countries fall back to UTC rather than guessing.
 */
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
    US: "America/New_York",
    GB: "Europe/London",
    PK: "Asia/Karachi",
    IN: "Asia/Kolkata",
    AE: "Asia/Dubai",
    DE: "Europe/Berlin",
    FR: "Europe/Paris",
    CA: "America/Toronto",
    AU: "Australia/Sydney",
    JP: "Asia/Tokyo",
    SG: "Asia/Singapore",
    // TODO: extend as real users from other countries show up.
};

const DEFAULT_TIMEZONE = "UTC";

/**
 * Default 3-2-1-1 allocation shape (SOUL_A.md §4) — mechanical, harness-
 * created, no AI call needed for a brand new week. Rollover-with-
 * analysis (adjusting the shape based on how the previous week actually
 * performed) is a SEPARATE, not-yet-built path — see
 * WEEK_SLOT_ALLOCATION_DECISIONS.md. This function only ever creates the
 * fixed default; it does not analyze anything.
 */
const DEFAULT_WEEKLY_ALLOCATION: { category: LinkedinPostCategory; allocated: number }[] = [
    { category: "EDUCATIONAL", allocated: 3 },
    { category: "PERSONAL", allocated: 2 },
    { category: "BUILD_IN_PUBLIC", allocated: 1 },
    { category: "ADAPTIVE", allocated: 1 },
];

function resolveTimezone(localeCountry: string | null | undefined): string {
    if (!localeCountry) return DEFAULT_TIMEZONE;
    return COUNTRY_TIMEZONE_MAP[localeCountry.toUpperCase()] ?? DEFAULT_TIMEZONE;
}

/**
 * Current Monday for a given IANA timezone, as a UTC Date. date-fns'
 * startOfWeek operates on the Date object's own represented instant, so
 * "now in that timezone" has to be computed first via Intl before
 * startOfWeek can find the correct Monday for THAT timezone's calendar,
 * not the server's.
 */
function currentMondayInTimezone(timezone: string): Date {
    const now = new Date();

    const zonedNowString = now.toLocaleString("en-US", { timeZone: timezone });
    const zonedNow = new Date(zonedNowString);

    return startOfWeek(zonedNow, { weekStartsOn: 1 });
}

async function createDefaultAllocation(userId: string, weekStartDate: Date) {
    await prisma.linkedinWeekSlotAllocation.createMany({
        data: DEFAULT_WEEKLY_ALLOCATION.map((entry) => ({
            userId,
            weekStartDate,
            category: entry.category,
            allocated: entry.allocated,
        })),
        skipDuplicates: true,
    });

    return weekStartDate;
}

/**
 * Resolves the current week's weekStartDate for a user, creating a fresh
 * default allocation if none exists yet or if the existing one has
 * fallen behind the current Monday for that user's country.
 *
 * This does NOT implement the analyzed-rollover path from
 * WEEK_SLOT_ALLOCATION_DECISIONS.md (cases 2/4 — AI-driven reallocation
 * based on how the previous week performed) — that's still a separate,
 * not-yet-built decision. This function only ever produces the fixed
 * 3-2-1-1 default, mechanically, for whichever week is current.
 */
export async function resolveWeekStart(userId: string, locale_country: string): Promise<Date> {
    const timezone = resolveTimezone(locale_country);
    const currentMonday = currentMondayInTimezone(timezone);

    const latestAllocation = await prisma.linkedinWeekSlotAllocation.findFirst({
        where: { userId },
        orderBy: { weekStartDate: "desc" },
        select: { weekStartDate: true },
    });

    // No allocation exists at all yet — first-ever trigger for this
    // user. Create the current week's default outright.
    if (!latestAllocation) {
        return createDefaultAllocation(userId, currentMonday);
    }

    // Existing allocation is still current — this week's Monday hasn't
    // passed it yet. Nothing to create; use what's there.
    if (!isBefore(latestAllocation.weekStartDate, currentMonday)) {
        return latestAllocation.weekStartDate;
    }

    // Existing allocation is stale — the current Monday has moved past
    // it. Roll over to a fresh default for the new week.
    // TODO: AI will decide on past week's performance if it exists in the db. if not, then default
    return createDefaultAllocation(userId, currentMonday);
}
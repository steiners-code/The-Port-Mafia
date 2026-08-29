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
    // TODO: ADD TIMEZONE TO DATABASE DURING ACCOUNT AUTH FOR THAT USER
};

const DEFAULT_TIMEZONE = "UTC";

export function resolveTimezone(localeCountry: string | null | undefined): string {
    if (!localeCountry) return DEFAULT_TIMEZONE;
    return COUNTRY_TIMEZONE_MAP[localeCountry.toUpperCase()] ?? DEFAULT_TIMEZONE;
}

/**
 * True if the given IANA timezone's current wall-clock time falls
 * within the 4:00 AM trigger window (3:30–4:50 AM), a ±~30-50min
 * offset around the target hour so an hourly cron sweep reliably
 * catches every timezone at least once near their local 4 AM, without
 * needing per-minute granularity in the scheduler itself.
 */
export function isHitting4AMWindow(timezone: string): boolean {
    const zonedNowString = new Date().toLocaleString("en-US", { timeZone: timezone });
    const zonedNow = new Date(zonedNowString);

    const hours = zonedNow.getHours();
    const minutes = zonedNow.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const windowStart = 3 * 60 + 30; // 3:30 AM
    const windowEnd = 4 * 60 + 50;   // 4:50 AM

    return totalMinutes >= windowStart && totalMinutes <= windowEnd;
}
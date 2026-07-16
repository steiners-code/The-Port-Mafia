import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

// --- Risk weights -----------------------------------------------------
// Lower weights = easier to spoof / noisier signal (UA fields are fully
// client-controlled). Higher weights = harder to fake or corroborated
// by infra-level data (IP-derived geo).
const RISK = {
    BROWSER_MISMATCH: 10,
    OS_MISMATCH: 15,
    ENGINE_MISMATCH: 10,
    DEVICE_MISMATCH: 15,
    IP_CHANGED_SAME_COUNTRY: 10,
    IP_CHANGED_DIFFERENT_COUNTRY: 40,
    GEO_LOOKUP_FAILED: 15,
} as const;

const MEDIUM_RISK_THRESHOLD = 25; // warn, don't block
const HIGH_RISK_THRESHOLD = 55;   // revoke sessions, force re-login

// TODO: revokeAllRefreshTokens()

// TODO: warnUserSuspiciousActivity(sessionId)

// --- Normalization --------------------------------------------------------

function normalizeIp(ip: string): string {
    // Strip IPv6-mapped IPv4 prefix (e.g. "::ffff:1.2.3.4" -> "1.2.3.4")
    // so the same client IP doesn't register as "changed" depending on
    // which stack/proxy captured it.
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

// --- Main -----------------------------------------------------------------

export async function verifyFingerprint(
    userId: string,
    sessionId: string,
    originalIpAddress: string,
    originalUserAgent: string,
    incomingIp: string,
    userAgent: string
) {
    let riskScore = 0;
    const reasons: string[] = [];

    const originalParser = new UAParser(originalUserAgent);
    const originalOs = originalParser.getOS().name;
    const originalBrowser = originalParser.getBrowser().name;
    const originalDevice = originalParser.getDevice().model;
    const originalEngine = originalParser.getEngine().name;

    const incomingParser = new UAParser(userAgent);
    const incomingOs = incomingParser.getOS().name;
    const incomingBrowser = incomingParser.getBrowser().name;
    const incomingDevice = incomingParser.getDevice().model;
    const incomingEngine = incomingParser.getEngine().name;

    if (incomingBrowser !== originalBrowser) {
        riskScore += RISK.BROWSER_MISMATCH;
        reasons.push(`browser: ${originalBrowser ?? 'unknown'} -> ${incomingBrowser ?? 'unknown'}`);
    }
    if (incomingOs !== originalOs) {
        riskScore += RISK.OS_MISMATCH;
        reasons.push(`os: ${originalOs ?? 'unknown'} -> ${incomingOs ?? 'unknown'}`);
    }
    if (incomingEngine !== originalEngine) {
        riskScore += RISK.ENGINE_MISMATCH;
        reasons.push(`engine: ${originalEngine ?? 'unknown'} -> ${incomingEngine ?? 'unknown'}`);
    }
    if (incomingDevice !== originalDevice) {
        riskScore += RISK.DEVICE_MISMATCH;
        reasons.push(`device: ${originalDevice ?? 'unknown'} -> ${incomingDevice ?? 'unknown'}`);
    }

    const originalIp = normalizeIp(originalIpAddress);
    const currentIp = normalizeIp(incomingIp);

    if (currentIp !== originalIp) {
        const originalGeo = geoip.lookup(originalIp);
        const incomingGeo = geoip.lookup(currentIp);

        if (!originalGeo || !incomingGeo) {
            riskScore += RISK.GEO_LOOKUP_FAILED;
            reasons.push('ip changed, geo lookup incomplete');
        } else if (incomingGeo.country !== originalGeo.country) {
            riskScore += RISK.IP_CHANGED_DIFFERENT_COUNTRY;
            reasons.push(`country: ${originalGeo.country} -> ${incomingGeo.country}`);
        } else {
            riskScore += RISK.IP_CHANGED_SAME_COUNTRY;
            reasons.push('ip changed, same country');
        }
    }

    if (riskScore >= HIGH_RISK_THRESHOLD) {
        // TODO:
        // await revokeAllRefreshTokens(userId);
        // await warnUserSuspiciousActivity(sessionId, {
        //     userId,
        //     reasons,
        //     score: riskScore,
        //     sessionRevoked: true,
        // });

        return {
            valid: false,
            code: 'SIGN_IN',
            message: 'SESSION_REVOKED',
            reasons
        };
    }

    if (riskScore >= MEDIUM_RISK_THRESHOLD) {
        // TODO:
        // await warnUserSuspiciousActivity(sessionId, {
        //     userId,
        //     reasons,
        //     score: riskScore,
        //     sessionRevoked: false,
        // });

        return {
            valid: true,
            code: 'SUCCESS',
            message: 'FLAGGED',
            reasons
        };
    }

    return {
        valid: true,
        code: 'SUCCESS',
        message: 'Y$U_A*E_N$T_^_B@D_B$Y',
        reasons
    };
}
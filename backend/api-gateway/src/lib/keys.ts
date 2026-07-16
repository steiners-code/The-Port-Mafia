/**
 * @importPublicKey this function imports `public.pem` the same way. Key is converted to verify signed JWT
 * 
 * @param pem secret `*.pem` key as string
 * 
 * @returns Cryptographic key for verifying JWT
 */

export const importPublicKey = async (rawPem: string) => {
    const pem = rawPem.replace(/\\n/g, "\n");

    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(
        pem.indexOf(pemHeader) + pemHeader.length,
        pem.indexOf(pemFooter)
    ).replace(/\s/g, "");

    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    return await crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        true,
        ["verify"]
    );
};
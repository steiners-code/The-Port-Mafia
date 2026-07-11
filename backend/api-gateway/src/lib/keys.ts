/**
 * @importPrivateKey function for getting private key for JWT
 * 
 * @param pem secret `*.pem` key as string
 * 
 * @returns Cryptographic key for signing JWT
 * 
 * - Removes header and footer from the key string
 * - Decodes its contents to an ArrayBuffer via Base64
 * - Converts it as cryptographic key for signing JWT
 */

export const importPrivateKey = async (pem: string) => {
    // Remove PEM headers and footers and newlines
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
        pem.indexOf(pemHeader) + pemHeader.length,
        pem.indexOf(pemFooter)
    ).replace(/\s/g, "");

    // Base64 decode the string to an ArrayBuffer
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    return await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        true,
        ["sign"]
    );
};

/**
 * @importPublicKey this function imports `public.pem` the same way. Key is converted to verify signed JWT
 * 
 * @param pem secret `*.pem` key as string
 * 
 * @returns Cryptographic key for verifying JWT
 */

export const importPublicKey = async (pem: string) => {
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
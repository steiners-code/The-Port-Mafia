import ImageKit from "imagekit";

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;

if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("Critical: ImageKit server credentials not fully configured (IMAGEKIT_PRIVATE_KEY / IMAGEKIT_PUBLIC_KEY / IMAGEKIT_URL_ENDPOINT).");
}

const imagekit = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

type UploadGeneratedImageArgs = {
    buffer: Buffer;
    fileName: string;
    folder?: string;
};

/**
 * Server-to-server upload — no signed token, no auth route, since this
 * runs entirely on linkedin-service's own backend with the private key
 * held server-side only. The browser-facing signed-upload flow (MAIN's
 * /blob/upload-auth) exists for a different threat model (untrusted
 * client uploading directly) that doesn't apply here.
 */
export async function uploadGeneratedImage({ buffer, fileName, folder = "mafia/linkedin-generated" }: UploadGeneratedImageArgs) {
    const result = await imagekit.upload({
        file: buffer,
        fileName,
        folder,
        useUniqueFileName: true,
    });

    return {
        url: result.url,
        fileId: result.fileId,
    };
}
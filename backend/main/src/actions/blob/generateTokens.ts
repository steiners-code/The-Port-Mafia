import { ImageKit } from "@imagekit/nodejs";

const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

export function generateTokens() {
    try {
        const { token, expire, signature } = client.helper.getAuthenticationParameters();

        return {
            status: 200,
            success: true,
            message: "Tokens generated!",
            data: {
                token,
                expire,
                signature
            }
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Couldn't generate tokens.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        }
    }
}

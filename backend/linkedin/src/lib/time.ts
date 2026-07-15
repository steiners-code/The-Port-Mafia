export function calculateExpiryDate(expiresInSeconds: number): Date {
    return new Date(Date.now() + (expiresInSeconds * 1000));
}
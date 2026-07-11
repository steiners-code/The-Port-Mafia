// All the backend working services with their urls
// are added in here. These are used by api-gateway
// to re-route request to the target host

export const SERVICE_MAP = {
    home: "http://localhost:3801",
    linkedin: "http://localhost:3801",
} as const;
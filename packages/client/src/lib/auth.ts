import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin + "/api/v6/auth" : "http://localhost:3100/api/v6/auth",
    plugins: [
        organizationClient()
    ]
})

# OpenID Connect Authentication for TinaCMS

This custom authentication provider enables self-hosted TinaCMS to authenticate users via any OpenID Connect (OIDC) compliant identity provider such as Keycloak, Auth0, Okta, Azure AD, Google, etc.

## Features

- ✅ Full OpenID Connect / OAuth 2.0 support
- ✅ Works with any OIDC-compliant provider
- ✅ Token-based authentication
- ✅ Optional email/domain-based authorization
- ✅ Client-side and server-side validation
- ✅ Automatic token refresh handling
- ✅ Secure logout with provider support

## Files Created

1. **`tina/OpenIDAuthProvider.ts`** - Client-side auth provider
2. **`tina/OpenIDBackendAuthProvider.ts`** - Server-side auth provider
3. **`.env.oidc.example`** - Environment variable template

## Setup Instructions

### 1. Configure Your OIDC Provider

First, register your application with your OIDC provider (Keycloak, Auth0, Okta, etc.):

1. Create a new application/client
2. Set the **Redirect URI** to: `http://localhost:3000` (for development) or your production URL
3. Note your **Client ID** and **Client Secret**
4. Find the OIDC endpoints (usually available at `/.well-known/openid-configuration`)

### 2. Set Environment Variables

Copy the example file and configure your OIDC settings:

```bash
cp .env.oidc.example .env.local
```

Edit `.env.local` with your OIDC provider details:

```env
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUTHORIZE_URL=https://your-provider.com/oauth/authorize
OIDC_TOKEN_URL=https://your-provider.com/oauth/token
OIDC_USERINFO_URL=https://your-provider.com/oauth/userinfo
OIDC_REDIRECT_URI=http://localhost:3000
OIDC_LOGOUT_URL=https://your-provider.com/oauth/logout
```

**Optional Authorization Rules:**

```env
# Restrict to specific email addresses
OIDC_AUTHORIZED_EMAILS=admin@example.com,editor@example.com

# Or restrict to specific domains
OIDC_AUTHORIZED_DOMAINS=example.com,mycompany.com
```

### 3. Update TinaCMS Configuration

Update `tina/config.ts` to use the OpenID auth provider:

```typescript
import { defineConfig } from "tinacms";
import { OpenIDAuthProvider } from "./OpenIDAuthProvider";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  // ... other config

  authProvider: isLocal
    ? new LocalAuthProvider()
    : new OpenIDAuthProvider({
        clientId: process.env.OIDC_CLIENT_ID!,
        authorizeUrl: process.env.OIDC_AUTHORIZE_URL!,
        tokenUrl: process.env.OIDC_TOKEN_URL!,
        userInfoUrl: process.env.OIDC_USERINFO_URL!,
        redirectUri: process.env.OIDC_REDIRECT_URI!,
        scope: process.env.OIDC_SCOPE,
        logoutUrl: process.env.OIDC_LOGOUT_URL,
      }),

  // ... rest of config
});
```

### 4. Update Backend API Route

Update `pages/api/tina/[...routes].ts` to use the backend auth provider:

```typescript
import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { createOpenIDBackendAuthProviderFromEnv } from "../../../tina/OpenIDBackendAuthProvider";
import databaseClient from "../../../tina/__generated__/databaseClient";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : createOpenIDBackendAuthProviderFromEnv(),
  databaseClient,
});

export default (req, res) => {
  return handler(req, res);
};
```

### 5. Make Environment Variables Available to Client

Update `next.config.js` to expose OIDC variables to the client:

```javascript
module.exports = {
  env: {
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_AUTHORIZE_URL: process.env.OIDC_AUTHORIZE_URL,
    OIDC_TOKEN_URL: process.env.OIDC_TOKEN_URL,
    OIDC_USERINFO_URL: process.env.OIDC_USERINFO_URL,
    OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI,
    OIDC_SCOPE: process.env.OIDC_SCOPE,
    OIDC_LOGOUT_URL: process.env.OIDC_LOGOUT_URL,
  },
};
```

## Provider-Specific Examples

### Keycloak

```env
OIDC_AUTHORIZE_URL=https://keycloak.example.com/realms/myrealm/protocol/openid-connect/auth
OIDC_TOKEN_URL=https://keycloak.example.com/realms/myrealm/protocol/openid-connect/token
OIDC_USERINFO_URL=https://keycloak.example.com/realms/myrealm/protocol/openid-connect/userinfo
OIDC_LOGOUT_URL=https://keycloak.example.com/realms/myrealm/protocol/openid-connect/logout
```

### Auth0

```env
OIDC_AUTHORIZE_URL=https://your-tenant.auth0.com/authorize
OIDC_TOKEN_URL=https://your-tenant.auth0.com/oauth/token
OIDC_USERINFO_URL=https://your-tenant.auth0.com/userinfo
OIDC_LOGOUT_URL=https://your-tenant.auth0.com/v2/logout
```

### Okta

```env
OIDC_AUTHORIZE_URL=https://your-domain.okta.com/oauth2/default/v1/authorize
OIDC_TOKEN_URL=https://your-domain.okta.com/oauth2/default/v1/token
OIDC_USERINFO_URL=https://your-domain.okta.com/oauth2/default/v1/userinfo
OIDC_LOGOUT_URL=https://your-domain.okta.com/oauth2/default/v1/logout
```

### Azure AD / Entra ID

```env
OIDC_AUTHORIZE_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
OIDC_TOKEN_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
OIDC_USERINFO_URL=https://graph.microsoft.com/oidc/userinfo
OIDC_LOGOUT_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/logout
```

## How It Works

### Authentication Flow

1. **User Access**: User attempts to access TinaCMS admin
2. **Check Token**: System checks for existing valid token in localStorage
3. **Redirect to OIDC**: If no valid token, redirects to OIDC provider login
4. **User Login**: User authenticates with OIDC provider
5. **Callback**: OIDC provider redirects back with authorization code
6. **Token Exchange**: Code is exchanged for access token
7. **Fetch User Info**: Access token is used to get user details
8. **Authorization Check**: Backend validates token and checks authorization rules
9. **Access Granted**: User can now use TinaCMS

### Security Features

- **Token Validation**: Every API request validates the token server-side
- **Authorization Rules**: Optional email/domain restrictions
- **Secure Storage**: Tokens stored in localStorage, state in sessionStorage
- **Auto Cleanup**: Expired tokens are automatically cleared
- **PKCE Support**: Can be extended to support PKCE for enhanced security

## Troubleshooting

### "Authentication failed" error

- Verify all OIDC URLs are correct
- Check that redirect URI matches your OIDC provider configuration
- Ensure client ID and secret are correct

### "Token validation failed"

- Check that the OIDC_USERINFO_URL is correct
- Verify the access token hasn't expired
- Ensure network connectivity to OIDC provider

### Access denied after successful login

- Check OIDC_AUTHORIZED_EMAILS or OIDC_AUTHORIZED_DOMAINS settings
- Verify the user's email is included in authorized list
- Check server logs for authorization details

## Development vs Production

**Development** (Local auth):

```env
TINA_PUBLIC_IS_LOCAL=true
```

**Production** (OIDC auth):

```env
TINA_PUBLIC_IS_LOCAL=false
```

## Additional Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Client Secret**: Keep `OIDC_CLIENT_SECRET` secure, never expose to client
3. **Token Storage**: Consider using httpOnly cookies for enhanced security
4. **PKCE**: Implement PKCE for public clients if needed
5. **Token Expiry**: Implement token refresh logic for long sessions

## License

This code is provided as-is for use with TinaCMS.

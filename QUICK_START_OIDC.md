# Quick Start: OpenID Connect Authentication for TinaCMS

Follow these steps to enable OpenID Connect authentication in your TinaCMS setup.

## Step 1: Configure Your OIDC Provider

### Option A: Keycloak (Recommended for self-hosted)

1. Create a new client in Keycloak
2. Set **Client Protocol**: `openid-connect`
3. Set **Access Type**: `confidential`
4. Add Valid Redirect URIs: `http://localhost:3000/*`
5. Note your Client ID and Client Secret from the Credentials tab
6. Find your realm endpoints at: `https://your-keycloak.com/realms/your-realm/.well-known/openid-configuration`

### Option B: Auth0

1. Create a new application (Regular Web Application)
2. Add Allowed Callback URLs: `http://localhost:3000`
3. Add Allowed Logout URLs: `http://localhost:3000`
4. Note your Domain, Client ID, and Client Secret

### Option C: Okta

1. Create a new App Integration (OIDC - Web Application)
2. Set Sign-in redirect URIs: `http://localhost:3000`
3. Set Sign-out redirect URIs: `http://localhost:3000`
4. Note your Client ID and Client Secret

## Step 2: Create Environment File

Create a `.env.local` file in the root of your project:

```bash
# Copy from the example
cp .env.oidc.example .env.local
```

Edit `.env.local` with your provider details:

**For Keycloak:**

```env
OIDC_CLIENT_ID=tina-cms
OIDC_CLIENT_SECRET=your-secret-from-keycloak
OIDC_AUTHORIZE_URL=https://your-keycloak.com/realms/myrealm/protocol/openid-connect/auth
OIDC_TOKEN_URL=https://your-keycloak.com/realms/myrealm/protocol/openid-connect/token
OIDC_USERINFO_URL=https://your-keycloak.com/realms/myrealm/protocol/openid-connect/userinfo
OIDC_REDIRECT_URI=http://localhost:3000
OIDC_LOGOUT_URL=https://your-keycloak.com/realms/myrealm/protocol/openid-connect/logout
TINA_PUBLIC_IS_LOCAL=false
```

**For Auth0:**

```env
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUTHORIZE_URL=https://your-tenant.auth0.com/authorize
OIDC_TOKEN_URL=https://your-tenant.auth0.com/oauth/token
OIDC_USERINFO_URL=https://your-tenant.auth0.com/userinfo
OIDC_REDIRECT_URI=http://localhost:3000
OIDC_LOGOUT_URL=https://your-tenant.auth0.com/v2/logout
TINA_PUBLIC_IS_LOCAL=false
```

## Step 3: Optional - Restrict Access

Add authorization rules to `.env.local`:

```env
# Only allow specific emails
OIDC_AUTHORIZED_EMAILS=admin@example.com,editor@example.com

# OR only allow specific domains
OIDC_AUTHORIZED_DOMAINS=mycompany.com
```

## Step 4: Test the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to the TinaCMS admin: `http://localhost:3000/admin`

3. You should be redirected to your OIDC provider login page

4. After successful login, you'll be redirected back to TinaCMS

## Step 5: For Production

1. Update your redirect URI in both:

   - Your OIDC provider settings
   - Your `.env.local` (or production environment variables)

2. Set production environment variables:

   ```env
   OIDC_REDIRECT_URI=https://your-production-domain.com
   TINA_PUBLIC_IS_LOCAL=false
   ```

3. Ensure all OIDC URLs use HTTPS

## Troubleshooting

### "Missing required OIDC environment variables"

- Check that all required env vars are set in `.env.local`
- Restart your dev server after adding env vars

### Redirect loop or "Authentication failed"

- Verify redirect URI matches exactly in your OIDC provider
- Check browser console for detailed error messages
- Verify OIDC URLs are correct (check for typos)

### "Token validation failed"

- Ensure OIDC_USERINFO_URL is correct
- Check network tab to see the actual error from userinfo endpoint
- Verify your OIDC provider is accessible

### User can login but gets "Unauthorized"

- Check OIDC_AUTHORIZED_EMAILS or OIDC_AUTHORIZED_DOMAINS
- Look at server logs to see why authorization failed
- Verify the user's email in the OIDC provider

## Development Mode

To temporarily switch back to local auth for development:

```env
TINA_PUBLIC_IS_LOCAL=true
```

Restart your server, and you'll use the local auth provider instead.

## Need Help?

Check the full documentation in `OIDC_AUTH_README.md` for detailed information about:

- How the authentication flow works
- Security considerations
- Advanced configuration options
- Provider-specific setup guides

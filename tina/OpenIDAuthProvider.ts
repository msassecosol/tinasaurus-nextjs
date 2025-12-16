import { AbstractAuthProvider } from "tinacms";

export interface OpenIDAuthConfig {
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope?: string;
  redirectUri: string;
  logoutUrl?: string;
}

/**
 * Custom OpenID Connect Auth Provider for TinaCMS
 * 
 * This provider integrates TinaCMS with any OpenID Connect compliant identity provider.
 * It handles the OAuth 2.0 / OIDC authorization flow on the client side.
 * 
 * Environment variables required:
 * - OIDC_CLIENT_ID: Your OIDC application client ID
 * - OIDC_AUTHORIZE_URL: The authorization endpoint (e.g., https://your-provider.com/oauth/authorize)
 * - OIDC_TOKEN_URL: The token endpoint (e.g., https://your-provider.com/oauth/token)
 * - OIDC_USERINFO_URL: The userinfo endpoint (e.g., https://your-provider.com/oauth/userinfo)
 * - OIDC_REDIRECT_URI: The callback URL (e.g., http://localhost:3000/api/auth/callback)
 * - OIDC_SCOPE: Optional, defaults to "openid profile email"
 * - OIDC_LOGOUT_URL: Optional, the logout endpoint
 */
export class OpenIDAuthProvider extends AbstractAuthProvider {
  private config: OpenIDAuthConfig;
  private tokenKey = "tina_oidc_token";
  private userKey = "tina_oidc_user";

  constructor(config: OpenIDAuthConfig) {
    super();
    this.config = {
      scope: "openid profile email",
      ...config,
    };

    console.log("OpenIDAuthProvider initialized with config:", this.config);
  }

  async authenticate(props?: Record<string, any>): Promise<any> {
    console.log("Starting authentication process with props:", props);
    // Check if we already have a token
    const token = this.getStoredToken();
    if (token) {
      try {
        console.log("Existing token found, fetching user info.");

        const user = await this.fetchUserInfo(token);
        this.storeUser(user);
        return user;
      } catch (error) {
        console.error("Failed to fetch user info with existing token:", error);
        // Token might be expired, clear it and re-authenticate
        this.clearAuth();
      }
    }

    // Check if we're returning from OAuth callback
    if (typeof window !== "undefined") {
      console.log("Checking URL for OAuth callback parameters.");

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (code && state === this.getStoredState()) {
        try {
          console.log("Authorization code found, exchanging for token.");

          const tokenResponse = await this.exchangeCodeForToken(code);
          this.storeToken(tokenResponse.access_token);
          
          const user = await this.fetchUserInfo(tokenResponse.access_token);
          this.storeUser(user);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return user;
        } catch (error) {
          console.error("Failed to exchange code for token:", error);
          throw new Error("Authentication failed");
        }
      }
    }

    // Initiate OAuth flow
    console.log("No valid token found, redirecting to authorize URL.");
    this.redirectToAuthorize();
    
    // This won't be reached as we're redirecting, but needed for type safety
    return new Promise(() => {});
  }

  async isAuthenticated() {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      // Verify token is still valid by fetching user info
      await this.fetchUserInfo(token);
      return true;
    } catch (error) {
      this.clearAuth();
      return false;
    }
  }

  async getUser() {
    const user = this.getStoredUser();
    if (user) return user;

    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const userInfo = await this.fetchUserInfo(token);
      this.storeUser(userInfo);
      return userInfo;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }

  async logout() {
    this.clearAuth();

    // Redirect to OIDC provider logout if configured
    if (this.config.logoutUrl && typeof window !== "undefined") {
      const returnUrl = encodeURIComponent(window.location.origin);
      window.location.href = `${this.config.logoutUrl}?post_logout_redirect_uri=${returnUrl}`;
    }
  }

  async getToken() {
    const token = this.getStoredToken();
    if (!token) return null;
    
    // TinaCMS expects a TokenObject with id_token and access_token
    return {
      id_token: token,
      access_token: token,
    };
  }

  private redirectToAuthorize() {
    if (typeof window === "undefined") return;

    const state = this.generateState();
    this.storeState(state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      scope: this.config.scope!,
      redirect_uri: this.config.redirectUri,
      state,
    });

    console.log("Redirecting to authorize URL with params:", params.toString());
    console.log("Authorize URL:", `${this.config.authorizeUrl}?${params.toString()}`);
    
    window.location.href = `${this.config.authorizeUrl}?${params.toString()}`;
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchUserInfo(token: string): Promise<any> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return response.json();
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.tokenKey);
  }

  private storeToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.tokenKey, token);
  }

  private getStoredUser(): any | null {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  private storeUser(user: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private getStoredState(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("tina_oidc_state");
  }

  private storeState(state: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("tina_oidc_state", state);
  }

  private clearAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem("tina_oidc_state");
  }
}

import { BackendAuthProvider } from "@tinacms/datalayer";
import { IncomingMessage, ServerResponse } from "http";

export interface OpenIDBackendAuthConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  userInfoUrl: string;
  isInRoleApiUrl: string;
  authorizedEmails?: string[]; // Optional: restrict access to specific emails
  authorizedDomains?: string[]; // Optional: restrict access to specific email domains
}

/**
 * OpenID Connect Backend Auth Provider for TinaCMS
 * 
 * This provider validates OpenID Connect tokens on the backend and ensures
 * the user is authorized to access the TinaCMS API.
 * 
 * Environment variables required:
 * - OIDC_CLIENT_ID: Your OIDC application client ID
 * - OIDC_CLIENT_SECRET: Your OIDC application client secret
 * - OIDC_TOKEN_URL: The token endpoint
 * - OIDC_USERINFO_URL: The userinfo endpoint
 * - OIDC_AUTHORIZED_EMAILS: Optional comma-separated list of authorized emails
 * - OIDC_AUTHORIZED_DOMAINS: Optional comma-separated list of authorized domains
 */
export const OpenIDBackendAuthProvider = (
  config: OpenIDBackendAuthConfig
): BackendAuthProvider => {
  return {
    async isAuthorized(
      req: IncomingMessage,
      _res: ServerResponse
    ): Promise<
      { isAuthorized: true } | { isAuthorized: false; errorMessage: string; errorCode: number }
    > {
      try {
        const token = extractTokenFromRequest(req);
        if (!token) {
          return {
            isAuthorized: false,
            errorMessage: "No authorization token provided",
            errorCode: 401,
          };
        }

        // Validate token and get user info
        const userInfo = await validateToken(token, config);
        if (!userInfo) {
          return {
            isAuthorized: false,
            errorMessage: "Invalid or expired token",
            errorCode: 401,
          };
        }

        // Check authorization rules
        if (!(await isUserAuthorized(token, config, "ASOL-Documentation-AP-.Editor"))) {
          return {
            isAuthorized: false,
            errorMessage: "User not authorized to access TinaCMS",
            errorCode: 403,
          };
        }

        return { isAuthorized: true };
      } catch (error) {
        console.error("Authorization error:", error);
        return {
          isAuthorized: false,
          errorMessage: "Authorization check failed",
          errorCode: 500,
        };
      }
    },
  };
};

/**
 * Extract Bearer token from Authorization header
 */
function extractTokenFromRequest(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Validate the access token by calling the userinfo endpoint
 */
async function validateToken(
  token: string,
  config: OpenIDBackendAuthConfig
): Promise<any> {
  try {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Token validation failed: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error validating token:", error);
    return null;
  }
}



/**
 * Check if user is authorized based on email/domain restrictions
 */
async function isUserAuthorized(
  token: string,
  config: OpenIDBackendAuthConfig,
  roleCode: string
): Promise<boolean> {
  
  const url = new URL(config.isInRoleApiUrl);
  url.searchParams.append('roleCode', roleCode);
  
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    console.error(`isInRole API failed: ${response.statusText}`);
     return false;
  }
  
  const result = await response.json();
  return result.accessGranted ?? false;


  // const email = userInfo.email || userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
  // if (!email) {
  //   return false;
  // }

  // // If specific emails are configured, check if user's email is in the list
  // if (config.authorizedEmails && config.authorizedEmails.length > 0) {
  //   return config.authorizedEmails.includes(email.toLowerCase());
  // }

  // // If specific domains are configured, check if user's email domain is in the list
  // if (config.authorizedDomains && config.authorizedDomains.length > 0) {
  //   const domain = email.split("@")[1]?.toLowerCase();
  //   return domain ? config.authorizedDomains.includes(domain) : false;
  // }

  // // If no restrictions are configured, allow any authenticated user
  // return true;
}

/**
 * Helper function to create config from environment variables
 */
export function createOpenIDBackendAuthProviderFromEnv(): BackendAuthProvider {
  const clientId = 'plaza-frontend';
  const clientSecret = '';
  const tokenUrl = 'https://alpha.avaplace.com/api/asol/idp/connect/token';
  const userInfoUrl = 'https://alpha.avaplace.com/api/asol/idp/connect/userinfo';
  const isInRoleApiUrl = 'https://alpha.avaplace.com/api/asol/idm/api/v1/Authorization/IsInRole';

  if (!clientId || !tokenUrl || !userInfoUrl) {
    throw new Error(
      "Missing required OIDC environment variables. Please set: OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_TOKEN_URL, OIDC_USERINFO_URL"
    );
  }

  const authorizedEmails = process.env.OIDC_AUTHORIZED_EMAILS
    ? process.env.OIDC_AUTHORIZED_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : undefined;

  const authorizedDomains = process.env.OIDC_AUTHORIZED_DOMAINS
    ? process.env.OIDC_AUTHORIZED_DOMAINS.split(",").map((d) => d.trim().toLowerCase())
    : undefined;

  return OpenIDBackendAuthProvider({
    clientId,
    clientSecret,
    tokenUrl,
    userInfoUrl,
    isInRoleApiUrl,
    authorizedEmails,
    authorizedDomains,
  });
}

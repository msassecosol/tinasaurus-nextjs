import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { createOpenIDBackendAuthProviderFromEnv } from "../../../tina/OpenIDBackendAuthProvider";
import { requestContext } from "../../../tina/userContext";

import databaseClient from "../../../tina/__generated__/databaseClient";

const handler = TinaNodeBackend({
  authProvider: createOpenIDBackendAuthProviderFromEnv(),
  databaseClient,
});

export default (req, res) => {
  return requestContext.run({ useInfo: { email: '' } }, () => {
      return handler(req, res);
  });
};

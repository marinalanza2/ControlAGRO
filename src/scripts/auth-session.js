(function authSessionModule(globalScope) {
  const STORAGE_KEY = "controlagro_user";
  const TOKEN_KEY = "controlagro_auth_token";

  function getSession() {
    try {
      return JSON.parse(globalScope.localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSession(session) {
    globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function getAuthToken() {
    try {
      return JSON.parse(globalScope.localStorage.getItem(TOKEN_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setAuthToken(tokenData) {
    globalScope.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
  }

  function clearSession() {
    globalScope.localStorage.removeItem(STORAGE_KEY);
    globalScope.localStorage.removeItem(TOKEN_KEY);
  }

  function canUseOffline(session, bootstrapState) {
    return Boolean(session && bootstrapState?.seeded);
  }

  async function logout(authEngine) {
    if (globalScope.ControlAgroNetwork && globalScope.ControlAgroNetwork.isOnline() && authEngine) {
      await authEngine.signOut();
    }
    clearSession();
  }

  globalScope.ControlAgroAuthSession = {
    getSession,
    setSession,
    getAuthToken,
    setAuthToken,
    clearSession,
    canUseOffline,
    logout
  };
})(window);

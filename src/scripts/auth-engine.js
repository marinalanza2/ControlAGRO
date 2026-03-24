(function authEngineModule(globalScope) {
  function createAuthEngine({ db, toast }) {
    async function signIn(email, password) {
      if (!email || !password) {
        toast("Preencha email e senha.", true);
        return { ok: false };
      }

      try {
        const { data, error } = await db.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });

        if (error) {
          console.error("Auth error:", error.message);
          toast("Email ou senha incorretos.", true);
          return { ok: false };
        }

        const authUser = data.user;
        if (!authUser) {
          toast("Erro ao autenticar. Tente novamente.", true);
          return { ok: false };
        }

        const { data: vendedor, error: vendedorError } = await db
          .from("vendedores")
          .select("*")
          .eq("email", authUser.email)
          .eq("ativo", true)
          .single();

        if (vendedorError || !vendedor) {
          console.error("Vendedor lookup error:", vendedorError);
          toast("Usuário não encontrado na base de vendedores.", true);
          await db.auth.signOut();
          return { ok: false };
        }

        const isMaster = vendedor.role === "gestor";
        const session = data.session;

        return {
          ok: true,
          vendedor,
          isMaster,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          }
        };
      } catch (err) {
        console.error("SignIn exception:", err);
        toast("Erro de conexão. Verifique sua internet.", true);
        return { ok: false };
      }
    }

    async function signOut() {
      try {
        await db.auth.signOut();
      } catch (err) {
        console.error("SignOut error:", err);
      }
    }

    async function restoreSession() {
      try {
        const { data, error } = await db.auth.getSession();
        if (error || !data?.session) {
          return { ok: false };
        }

        const { data: refreshed, error: refreshError } = await db.auth.refreshSession();
        if (refreshError || !refreshed?.session) {
          return { ok: false };
        }

        return {
          ok: true,
          session: {
            access_token: refreshed.session.access_token,
            refresh_token: refreshed.session.refresh_token,
            expires_at: refreshed.session.expires_at
          }
        };
      } catch (err) {
        console.error("Restore session error:", err);
        return { ok: false };
      }
    }

    return { signIn, signOut, restoreSession };
  }

  globalScope.ControlAgroAuthEngine = {
    createAuthEngine
  };
})(window);

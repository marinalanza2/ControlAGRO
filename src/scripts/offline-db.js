(function bootstrapOfflineDb(globalScope) {
  const DB_VER = 6;
  const STORE_NAMES = [
    "vendedores",
    "clientes",
    "visitas",
    "plantios",
    "contatos",
    "sync_queue",
    "relatorio_vendedores",
    "plantios_criticos"
  ];

  class OfflineDB {
    constructor() {
      this.db = null;
      this.ready = this.init();
    }

    init() {
      return new Promise(resolve => {
        if (!globalScope.indexedDB) {
          console.warn("IndexedDB nao suportado");
          resolve();
          return;
        }

        // Check if database needs recreation due to keyPath changes
        const checkRequest = globalScope.indexedDB.open("ControlAgroDB");
        checkRequest.onsuccess = event => {
          const existingDb = event.target.result;
          const currentVersion = existingDb.version;

          // Check if we have old stores that need keyPath migration
          const needsRecreation = currentVersion < DB_VER && (
            existingDb.objectStoreNames.contains("relatorio_vendedores") ||
            existingDb.objectStoreNames.contains("plantios_criticos")
          );

          existingDb.close();

          if (needsRecreation) {
            console.log("⚠️ IndexedDB precisa ser atualizado (keyPath incompatível)");
            console.log("🔄 Recriando IndexedDB...");

            const deleteRequest = globalScope.indexedDB.deleteDatabase("ControlAgroDB");
            deleteRequest.onsuccess = () => {
              console.log("✅ IndexedDB antigo removido");
              this._openDatabase(resolve);
            };
            deleteRequest.onerror = () => {
              console.error("❌ Erro ao remover IndexedDB antigo, tentando continuar...");
              this._openDatabase(resolve);
            };
            deleteRequest.onblocked = () => {
              console.warn("⚠️ IndexedDB bloqueado, feche outras abas e recarregue");
              this._openDatabase(resolve);
            };
          } else {
            this._openDatabase(resolve);
          }
        };

        checkRequest.onerror = () => {
          // Database doesn't exist yet, proceed normally
          this._openDatabase(resolve);
        };
      });
    }

    _openDatabase(resolve) {
      const timeout = setTimeout(() => {
        console.warn("IndexedDB timeout");
        resolve();
      }, 5000);

      const req = globalScope.indexedDB.open("ControlAgroDB", DB_VER);
      req.onupgradeneeded = event => {
        const db = event.target.result;

        // Delete old stores if they exist (for clean migration)
        STORE_NAMES.forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }
        });

        // Create all stores with correct keyPaths
        STORE_NAMES.forEach(storeName => {
          let options;
          if (storeName === "sync_queue") {
            options = { keyPath: "id", autoIncrement: true };
          } else if (storeName === "relatorio_vendedores") {
            options = { keyPath: "vendedor_id" };
          } else if (storeName === "plantios_criticos") {
            options = { keyPath: "plantio_id" };
          } else {
            options = { keyPath: "id" };
          }
          db.createObjectStore(storeName, options);
        });
      };

      req.onsuccess = event => {
        clearTimeout(timeout);
        this.db = event.target.result;
        console.log("✅ IndexedDB pronto (versão " + DB_VER + ")");
        resolve();
      };

      req.onerror = event => {
        clearTimeout(timeout);
        console.error("IndexedDB erro:", event);
        resolve();
      };
    }

    async op(store, mode, operation) {
      await this.ready;
      if (!this.db) {
        return mode === "readonly" ? [] : undefined;
      }

      return new Promise(resolve => {
        try {
          const tx = this.db.transaction(store, mode);
          const objectStore = tx.objectStore(store);
          const req = operation(objectStore);
          req.onsuccess = event => resolve(event.target.result);
          req.onerror = event => {
            console.error("DB op erro:", event);
            resolve(mode === "readonly" ? [] : undefined);
          };
        } catch (error) {
          console.error("DB transaction erro:", error);
          resolve(mode === "readonly" ? [] : undefined);
        }
      });
    }

    getAll(store) {
      return this.op(store, "readonly", objectStore => objectStore.getAll());
    }

    put(store, data) {
      return this.op(store, "readwrite", objectStore => objectStore.put(data));
    }

    add(store, data) {
      return this.op(store, "readwrite", objectStore => objectStore.add(data));
    }

    delete(store, id) {
      return this.op(store, "readwrite", objectStore => objectStore.delete(id));
    }

    clear(store) {
      return this.op(store, "readwrite", objectStore => objectStore.clear());
    }
  }

  globalScope.ControlAgroOfflineDB = {
    DB_VER,
    STORE_NAMES,
    createOfflineDb() {
      return new OfflineDB();
    }
  };
})(window);

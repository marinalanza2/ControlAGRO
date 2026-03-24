(function geoHandlerModule(globalScope) {

  async function getCurrentPosition(options) {
    options = options || {};
    try {
      var Geolocation = globalScope.Capacitor?.Plugins?.Geolocation;
      if (Geolocation) {
        var permStatus = await Geolocation.checkPermissions();
        if (permStatus.location === "denied") {
          var reqResult = await Geolocation.requestPermissions();
          if (reqResult.location === "denied") {
            throw new Error("Permissão de localização negada");
          }
        }

        var position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      }
    } catch (e) {
      console.warn("Geolocation plugin fallback:", e.message);
    }

    return new Promise(function(resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        function(err) { reject(err); },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  globalScope.ControlAgroGeo = {
    getCurrentPosition: getCurrentPosition
  };
})(window);

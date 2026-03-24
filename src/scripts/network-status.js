(function networkStatusModule(globalScope) {
  let _isConnected = navigator.onLine;
  let _listeners = [];

  async function init() {
    try {
      var Network = globalScope.Capacitor?.Plugins?.Network;
      if (Network) {
        var status = await Network.getStatus();
        _isConnected = status.connected;

        Network.addListener("networkStatusChange", function(status) {
          _isConnected = status.connected;
          _listeners.forEach(function(fn) { fn(_isConnected); });
        });
        console.log("Network: usando plugin Capacitor");
        return;
      }
    } catch (e) {
      console.warn("Network plugin error:", e);
    }

    console.log("Network: usando navigator.onLine (browser fallback)");
    _isConnected = navigator.onLine;
    globalScope.addEventListener("online", function() {
      _isConnected = true;
      _listeners.forEach(function(fn) { fn(true); });
    });
    globalScope.addEventListener("offline", function() {
      _isConnected = false;
      _listeners.forEach(function(fn) { fn(false); });
    });
  }

  globalScope.ControlAgroNetwork = {
    init: init,
    isOnline: function() { return _isConnected; },
    onChange: function(fn) {
      _listeners.push(fn);
      return function() { _listeners = _listeners.filter(function(l) { return l !== fn; }); };
    }
  };
})(window);

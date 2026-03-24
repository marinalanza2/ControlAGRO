(function cameraHandlerModule(globalScope) {

  async function takePhoto() {
    try {
      var Camera = globalScope.Capacitor?.Plugins?.Camera;
      if (!Camera) {
        return null;
      }

      var image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: "base64",
        source: "Prompt",
        width: 1200,
        height: 1200,
        correctOrientation: true
      });

      return {
        base64: "data:image/" + image.format + ";base64," + image.base64String,
        format: image.format,
        name: Date.now() + "." + image.format
      };
    } catch (e) {
      if (e.message && (e.message.includes("cancelled") || e.message.includes("User cancelled"))) {
        return null;
      }
      console.warn("Camera plugin error, use file input fallback:", e.message);
      return null;
    }
  }

  globalScope.ControlAgroCamera = {
    takePhoto: takePhoto
  };
})(window);

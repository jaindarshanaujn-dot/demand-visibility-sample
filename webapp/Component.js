sap.ui.define([
  "sap/ui/core/UIComponent",
  "com/saputo/demandvisibility/model/models"
], function (UIComponent, models) {
  "use strict";

  return UIComponent.extend("com.saputo.demandvisibility.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.setModel(models.createDeviceModel(), "device");
    }
  });
});

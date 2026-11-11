sap.ui.define([
  "sap/ui/core/Component",
  "sap/ui/core/ComponentContainer",
  "sap/ui/core/Core",
  "com/saputo/demandvisibility/localService/mockserver"
], function (Component, ComponentContainer, Core, mockserver) {
  "use strict";

  mockserver.init();

  Core.attachInit(function () {
    Component.create({
      name: "com.saputo.demandvisibility"
    }).then(function (oComponent) {
      new ComponentContainer({
        component: oComponent,
        height: "100%"
      }).placeAt("content");
    });
  });
});

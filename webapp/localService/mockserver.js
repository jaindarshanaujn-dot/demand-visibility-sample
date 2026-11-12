sap.ui.define([
  "sap/ui/core/util/MockServer"
], function (MockServer) {
  "use strict";

  var oMockServer;

  return {
    init: function () {
      if (oMockServer) {
        return;
      }

      var sLocalServicePath = sap.ui.require.toUrl("com/saputo/demandvisibility/localService");

      oMockServer = new MockServer({
        rootUri: "/odata/mock/"
      });

      MockServer.config({
        autoRespond: true,
        autoRespondAfter: 250
      });

      oMockServer.simulate(sLocalServicePath + "/metadata.xml", {
        sMockdataBaseUrl: sLocalServicePath + "/mockdata",
        bGenerateMissingMockData: false
      });

      // SmartTable export may request the entity set root without query options.
      var aRequests = oMockServer.getRequests();
      aRequests.push({
        method: "GET",
        path: /Orders$/,
        response: function (oXhr) {
          var oDataRequest = new XMLHttpRequest();
          oDataRequest.open("GET", sLocalServicePath + "/mockdata/Orders.json", false);
          oDataRequest.send(null);

          if (oDataRequest.status >= 200 && oDataRequest.status < 300) {
            oXhr.respond(200, { "Content-Type": "application/json" }, oDataRequest.responseText);
          } else {
            oXhr.respond(500, { "Content-Type": "application/json" }, JSON.stringify({
              error: "Failed to load mock Orders data"
            }));
          }

          return true;
        }
      });
      oMockServer.setRequests(aRequests);

      oMockServer.start();
    }
  };
});

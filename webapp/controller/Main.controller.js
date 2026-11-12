sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/export/Spreadsheet",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Link"
], function (Controller, JSONModel, Filter, FilterOperator, Spreadsheet, Fragment, MessageToast, Dialog, Button, Link) {
  "use strict";

  var PAGE_SIZE = 15;
<<<<<<< HEAD
  var MATERIAL_URL_BASE = "https://octopart.com/part/analog-devices/";
=======
>>>>>>> 28ecbb98c67e6494be70e6debb75d879a4fac289
  var BASIC_SEARCH_FIELDS = ["OrderNumber", "Material", "Planner"];

  return Controller.extend("com.saputo.demandvisibility.controller.Main", {
    onInit: function () {
      var oModel = new JSONModel("model/defaultSelection.json");
      var oSmartTable = this.byId("smartTable");
      var oUiModel = new JSONModel({
        page: 1,
        pageSize: PAGE_SIZE,
        totalRecords: 0,
        totalPages: 1,
        splitVisible: false,
        masterWidth: "100%",
        detailWidth: "0%",
        hasPreviousPage: false,
        hasNextPage: false,
        pageSummary: "Page 1 of 1 (0 rows)"
      });

      var oFilterBar = this.byId("smartFilterBar");

      oSmartTable.attachInitialise(this._attachAutoResizeHandler.bind(this));
      // Load the data automatically once both the filter bar and the table are ready
      // (the table has autobinding off, so without this it stays empty until "Go" is pressed).
      oSmartTable.attachInitialise(this._tryInitialLoad.bind(this));
      oFilterBar.attachInitialise(this._tryInitialLoad.bind(this));
      oModel.attachRequestCompleted(this._onDefaultSelectionLoaded.bind(this, oModel));
      this.getView().setModel(oModel, "defaults");
      this.getView().setModel(oUiModel, "ui");
      this.getView().setModel(new JSONModel({ title: "", mode: "", sections: [] }), "detail");
      this.byId("relatedPage").setModel(new JSONModel({ title: "", busy: false, summary: [], lines: [], linesTitle: "Order lines" }), "related");
    },

    _tryInitialLoad: function () {
      var oSmartTable = this.byId("smartTable");
      var oFilterBar = this.byId("smartFilterBar");

      if (this._bInitialLoadDone || !oSmartTable.isInitialised() || !oFilterBar.isInitialised()) {
        return;
      }

      this._bInitialLoadDone = true;
      this.onFilterSearch();
    },

    onAfterRendering: function () {
      this._applyFixedRowCount();
    },

    _applyFixedRowCount: function () {
      var oInnerTable = this.byId("smartTable").getTable();

      if (!oInnerTable) {
        return;
      }

      if (typeof oInnerTable.setVisibleRowCountMode === "function") {
        oInnerTable.setVisibleRowCountMode("Fixed");
      }
      if (typeof oInnerTable.setVisibleRowCount === "function") {
        oInnerTable.setVisibleRowCount(PAGE_SIZE);
      }
    },

    _attachAutoResizeHandler: function () {
      var oInnerTable = this.byId("smartTable").getTable();

      if (!oInnerTable || typeof oInnerTable.attachRowsUpdated !== "function") {
        return;
      }

      this._applyFixedRowCount();

      if (typeof oInnerTable.setSelectionMode === "function") {
        oInnerTable.setSelectionMode("Single");
      }
      if (typeof oInnerTable.setSelectionBehavior === "function") {
        oInnerTable.setSelectionBehavior("Row");
      }
      if (typeof oInnerTable.setEnableSelectAll === "function") {
        oInnerTable.setEnableSelectAll(false);
      }

      if (typeof oInnerTable.attachRowSelectionChange === "function") {
        oInnerTable.attachRowSelectionChange(this.onRowSelectionChange.bind(this));
      }

      this._enhanceClickableColumns(oInnerTable);

      oInnerTable.attachRowsUpdated(this._autoResizeColumns.bind(this));
    },

    _enforceSingleSelect: function (oInnerTable) {
      if (!oInnerTable) {
        return;
      }
      if (typeof oInnerTable.setSelectionMode === "function" && oInnerTable.getSelectionMode() !== "Single") {
        oInnerTable.setSelectionMode("Single");
      }
      if (typeof oInnerTable.setSelectionBehavior === "function") {
        oInnerTable.setSelectionBehavior("Row");
      }
      if (typeof oInnerTable.setEnableSelectAll === "function") {
        oInnerTable.setEnableSelectAll(false);
      }
    },

    _enhanceClickableColumns: function (oInnerTable) {
      oInnerTable.getColumns().forEach(function (oColumn) {
        var sProperty = oColumn.getSortProperty();

        if ((sProperty !== "OrderNumber" && sProperty !== "Material") || oColumn.data("isLinkColumn")) {
          return;
        }

        var oLink = new Link({
          text: "{" + sProperty + "}",
          press: this.onCellLinkPress.bind(this)
        });

        oLink.data("property", sProperty);
        oColumn.setTemplate(oLink);
        oColumn.data("isLinkColumn", true);
      }.bind(this));
    },

    // ---------------------------------------------------------------------
    // Detail data (shared by the popup, the "new tab" page and the split panel)
    // ---------------------------------------------------------------------

    // Each field: [label, [properties joined with " - "], type]; type "num" formats numbers.
    _getSectionDefinitions: function (sMode) {
      var aOrder = [
        { title: "Order Information", fields: [
          ["Order Number", ["OrderNumber"]], ["Order Line", ["OrderLine"]], ["Schedule Line", ["SchedLineNbr"]],
          ["Order Type", ["OrderType"]], ["PO Number", ["PoNumber"]], ["PO Line", ["PoLine"]],
          ["Sales Org", ["SalesOrg"]], ["Distribution Channel", ["DistributionChannel"]], ["Created On", ["CreatedOn"]]
        ] },
        { title: "Customer", fields: [
          ["Sold-to", ["Soldto", "SoldtoName1"]], ["Ship-to", ["Shipto", "ShiptoName1"]],
          ["End Customer", ["EndCustomer", "EndCustomerName1"]]
        ] },
        { title: "Quantities & Value", fields: [
          ["Order Qty", ["OrderQty"], "num"], ["Confirmed Qty", ["ConfirmedQty"], "num"],
          ["Qty Invoiced", ["QtyInvoiced"], "num"], ["Open Qty", ["OpenQty"], "num"],
          ["Unit Price", ["UnitPrice"], "num"], ["Open Value", ["OpenValue"], "num"], ["Currency", ["Currency"]]
        ] },
        { title: "Dates & Status", fields: [
          ["CRD Date", ["CrdDate"]], ["Delivery Date", ["DeliveryDate"]], ["Scheduled Delivery", ["SchedDlvDate"]],
          ["Delivery Block", ["DeliveryBlock"]], ["Credit Block", ["CreditBlock"]], ["Expedite Status", ["ExpediteStatus"]]
        ] }
      ];
      var aMaterial = [
        { title: "Material Information", fields: [
          ["Material", ["Material"]], ["Material Type", ["MaterialType"]], ["Material Division", ["MaterialDivision"]],
          ["Material Group 3", ["MaterialGroup3"]], ["Customer Part Number", ["CustomerPartNumber"]]
        ] },
        { title: "Planning", fields: [
          ["Planner", ["Planner"]], ["Plant", ["Plant", "PlantName"]], ["Storage Location", ["StorageLocation"]],
          ["Lead Time (weeks)", ["MaterialLeadTimeWeeks2"], "num"], ["Plant Status", ["MaterialXPlantStatus"]],
          ["Adexa Flag", ["AdexaFlag"]]
        ] }
      ];

      if (sMode === "order") {
        return aOrder;
      }
      if (sMode === "material") {
        return aMaterial;
      }
      return aOrder.concat(aMaterial);
    },

    _formatValue: function (vValue, sType) {
      if (vValue === null || vValue === undefined || vValue === "") {
        return "-";
      }
      if (sType === "num") {
        var fNumber = Number(vValue);
        return Number.isFinite(fNumber) ? fNumber.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(vValue);
      }
      return String(vValue);
    },

    _buildSections: function (oRow, sMode) {
      var fnFormat = this._formatValue;

      return this._getSectionDefinitions(sMode).map(function (oSection) {
        return {
          title: oSection.title,
          fields: oSection.fields.map(function (aField) {
            var aParts = aField[1].map(function (sProp) {
              return fnFormat(oRow[sProp], aField[2]);
            }).filter(function (sPart) {
              return sPart !== "-";
            });

            var sProp = aField[1][0];
            var vRaw = oRow[sProp];
            var sRaw = vRaw === null || vRaw === undefined ? "" : String(vRaw);

            return {
              label: aField[0],
              value: aParts.length ? aParts.join(" - ") : "-",
              property: sProp,
              raw: sRaw,
              numeric: aField[2] === "num",
              linkable: sRaw !== ""
            };
          })
        };
      });
    },

    _getDetailTitle: function (oRow, sMode) {
      if (sMode === "order") {
        return "Order " + (oRow.OrderNumber || "");
      }
      if (sMode === "material") {
        return "Material " + (oRow.Material || "");
      }
      return "Order " + (oRow.OrderNumber || "") + " / Material " + (oRow.Material || "");
    },

    // Fills a detail model for the given row and then adds a summary section
    // (all order lines of the same order / all order lines of the same material).
    _fillDetailModel: function (oDetailModel, oRow, sMode) {
      var oODataModel = this.getView().getModel();
      var iToken = (oDetailModel._iToken || 0) + 1;
      var aSummaries = [];

      oDetailModel._iToken = iToken;
      oDetailModel.setData({
        mode: sMode,
        title: this._getDetailTitle(oRow, sMode),
        sections: this._buildSections(oRow, sMode)
      });

      if (sMode !== "material" && oRow.OrderNumber) {
        aSummaries.push({ title: "Order Summary (all lines of this order)", property: "OrderNumber", value: oRow.OrderNumber, distinct: null });
      }
      if (sMode !== "order" && oRow.Material) {
        aSummaries.push({ title: "Material Summary (all order lines of this material)", property: "Material", value: oRow.Material, distinct: "OrderNumber" });
      }

      aSummaries.forEach(function (oSummary) {
        oODataModel.read("/Orders", {
          filters: [new Filter(oSummary.property, FilterOperator.EQ, oSummary.value)],
          success: function (oData) {
            var aRows = (oData && oData.results) || [];
            var fQty = 0;
            var fValue = 0;
            var oOrders = {};

            if (oDetailModel._iToken !== iToken) {
              return; // a newer selection replaced this one
            }

            aRows.forEach(function (oItem) {
              fQty += Number(oItem.OpenQty) || 0;
              fValue += Number(oItem.OpenValue) || 0;
              oOrders[oItem.OrderNumber] = true;
            });

            var aFields = [
              { label: "Order Lines", value: this._formatValue(aRows.length, "num") },
              { label: "Total Open Qty", value: this._formatValue(fQty, "num") },
              { label: "Total Open Value", value: this._formatValue(fValue, "num") }
            ];

            if (oSummary.distinct) {
              aFields.splice(1, 0, { label: "Distinct Orders", value: this._formatValue(Object.keys(oOrders).length, "num") });
            }

            var aSections = oDetailModel.getProperty("/sections").concat({ title: oSummary.title, fields: aFields });
            oDetailModel.setProperty("/sections", aSections);
          }.bind(this),
          error: function () {
            // summary is optional; keep the base details
          }
        });
      }.bind(this));
    },

    // ---------------------------------------------------------------------
    // 1) Hyperlinks (Order Number / Material) and 2) popup
    // ---------------------------------------------------------------------

    onCellLinkPress: function (oEvent) {
      var oSource = oEvent.getSource();
      var oContext = oSource.getBindingContext();

      if (!oContext) {
        return;
      }

      var oRow = oContext.getObject();
      var sMode = oSource.data("property") === "Material" ? "material" : "order";

<<<<<<< HEAD
      // Material link: only a new browser tab (https://octopart.com/part/analog-devices/<Material>), no popup, no side panel.
      if (sMode === "material") {
        this._openMaterialInNewTab(oRow.Material);
        return;
      }

=======
>>>>>>> 28ecbb98c67e6494be70e6debb75d879a4fac289
      // Same information in the popup AND in the side panel; the clicked row becomes the selected row.
      this._selectRowOfControl(oSource);
      this._showSidePanel(oRow, sMode);
      this._openDetailDialog(oRow, sMode);
    },

<<<<<<< HEAD
    _openMaterialInNewTab: function (sMaterial) {
      if (!sMaterial) {
        return;
      }

      // The data carries an internal variant suffix (e.g. "LT1129IST-3.3#PBF-V12"); Octopart only knows the real part number.
      var sPartNumber = String(sMaterial).replace(/-V\d+$/i, "");
      var sUrl = MATERIAL_URL_BASE + encodeURIComponent(sPartNumber);

      if (!window.open(sUrl, "_blank")) {
        MessageToast.show("Pop-up blocked. Please allow pop-ups to open the material in a new tab.");
      }
    },

=======
>>>>>>> 28ecbb98c67e6494be70e6debb75d879a4fac289
    _selectRowOfControl: function (oControl) {
      var oInnerTable = this.byId("smartTable").getTable();
      var oTableRow = oControl.getParent();

      if (oInnerTable && oTableRow && typeof oTableRow.getIndex === "function" && typeof oInnerTable.setSelectedIndex === "function") {
        this._bSuppressSelectionEvent = true;
        try {
          oInnerTable.setSelectedIndex(oTableRow.getIndex());
        } finally {
          this._bSuppressSelectionEvent = false;
        }
      }
    },

    _showSidePanel: function (oRow, sMode) {
      this._closeRelatedPanel();
      this._fillDetailModel(this.getView().getModel("detail"), oRow, sMode);
      this._setSplitVisibility(true);
    },

    _openDetailDialog: function (oRow, sMode) {
      var oPopupModel = new JSONModel({ title: "", mode: sMode, sections: [] });
      var that = this;

      this._fillDetailModel(oPopupModel, oRow, sMode);

      Fragment.load({
        name: "com.saputo.demandvisibility.view.DetailContent",
        type: "XML"
      }).then(function (oContent) {
        var oDialog = new Dialog({
          title: "{detail>/title}",
          contentWidth: "36rem",
          contentHeight: "70%",
          resizable: true,
          draggable: true,
          content: [oContent],
          buttons: [
            new Button({
              text: "Open in New Tab",
              icon: "sap-icon://action",
              type: "Emphasized",
              press: function () {
                that._openInNewTab(oPopupModel.getData());
              }
            }),
            new Button({
              text: "Close",
              press: function () {
                oDialog.close();
              }
            })
          ],
          afterClose: function () {
            oDialog.destroy();
          }
        });

        oDialog.setModel(oPopupModel, "detail");
        that.getView().addDependent(oDialog);
        oDialog.open();
      });
    },

    // ---------------------------------------------------------------------
    // 3) Same data in a new browser tab
    // ---------------------------------------------------------------------

    _escapeHtml: function (vValue) {
      return String(vValue).replace(/[&<>"']/g, function (sChar) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[sChar];
      });
    },

    _buildDetailHtml: function (oData) {
      var fnEsc = this._escapeHtml;
      var sSections = (oData.sections || []).map(function (oSection) {
        var sRows = oSection.fields.map(function (oField) {
          return "<tr><th>" + fnEsc(oField.label) + "</th><td>" + fnEsc(oField.value) + "</td></tr>";
        }).join("");

        return "<h2>" + fnEsc(oSection.title) + "</h2><table>" + sRows + "</table>";
      }).join("");

      return "<!doctype html><html><head><meta charset='utf-8'><title>" + fnEsc(oData.title) + "</title>" +
        "<style>body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#1d2d3e;max-width:760px}" +
        "h1{font-size:22px}h2{font-size:15px;margin:22px 0 6px;color:#0a6ed1}" +
        "table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #e5e5e5;font-size:14px}" +
        "th{width:40%;font-weight:600;color:#556b82}</style></head><body><h1>" + fnEsc(oData.title) + "</h1>" +
        sSections + "</body></html>";
    },

    _openInNewTab: function (oData) {
      var sUrl = URL.createObjectURL(new Blob([this._buildDetailHtml(oData)], { type: "text/html" }));
      var oWin = window.open(sUrl, "_blank");

      if (!oWin) {
        MessageToast.show("Pop-up blocked. Please allow pop-ups to open in a new tab.");
        return;
      }
      setTimeout(function () {
        URL.revokeObjectURL(sUrl);
      }, 60000);
    },

    onOpenDetailInNewTab: function (oEvent) {
      this._openInNewTab(oEvent.getSource().getModel("detail").getData());
    },

    // ---------------------------------------------------------------------
    // 4) Single row selection -> split panel with the same data
    // ---------------------------------------------------------------------

    // Panes are added to / removed from the splitter. Dragging the dividers resizes them.
    _setPaneVisible: function (oPane, bVisible) {
      var oSplitter = this.byId("mainSplitter");
      var bShown = oSplitter.indexOfContentArea(oPane) > -1;

      if (bVisible && !bShown) {
        oSplitter.addContentArea(oPane);
      } else if (!bVisible && bShown) {
        oSplitter.removeContentArea(oPane);
      }
    },

    _setSplitVisibility: function (bVisible) {
      if (!bVisible) {
        this._setPaneVisible(this.byId("relatedPage"), false);
      }
      this._setPaneVisible(this.byId("detailPage"), bVisible);
    },

    onRowSelectionChange: function () {
      if (this._bSuppressSelectionEvent) {
        return;
      }

      var oInnerTable = this.byId("smartTable").getTable();
      var iIndex = oInnerTable.getSelectedIndex();
      var oContext = iIndex >= 0 ? oInnerTable.getContextByIndex(iIndex) : null;

      if (!oContext || !oContext.getObject()) {
        this._resetDetail();
        return;
      }

      // New row selected: panel 2 shows its details, panel 3 (related info) closes until an entry is clicked.
      this._showSidePanel(oContext.getObject(), "all");
    },

    _resetDetail: function () {
      var oDetailModel = this.getView().getModel("detail");

      this._closeRelatedPanel();
      oDetailModel._iToken = (oDetailModel._iToken || 0) + 1;
      oDetailModel.setData({ title: "", mode: "", sections: [] });
      this._setSplitVisibility(false);
    },

    // ---------------------------------------------------------------------
    // Panel 3: related information for the entry clicked in panel 2
    // ---------------------------------------------------------------------

    onDetailFieldPress: function (oEvent) {
      var oField = oEvent.getSource().getBindingContext("detail").getObject();

      if (!oField || !oField.linkable) {
        return;
      }

      this._openRelatedPanel(oField);
    },

    _openRelatedPanel: function (oField) {
      var oRelatedPage = this.byId("relatedPage");
      var oModel = oRelatedPage.getModel("related");
      var iToken = (oModel._iToken || 0) + 1;

      oModel._iToken = iToken;
      oModel.setData({
        title: "Related: " + oField.label + " " + oField.raw,
        busy: true,
        summary: [],
        lines: [],
        linesTitle: "Order lines"
      });
      this._setPaneVisible(oRelatedPage, true);

      this.getView().getModel().read("/Orders", {
        // numeric values are compared in the browser (decimal strings vs numbers), text values on the "server"
        filters: oField.numeric ? [] : [new Filter(oField.property, FilterOperator.EQ, oField.raw)],
        success: function (oData) {
          var aRows = (oData && oData.results) || [];

          if (oField.numeric) {
            aRows = aRows.filter(function (oItem) {
              return Number(oItem[oField.property]) === Number(oField.raw) && oItem[oField.property] !== null && oItem[oField.property] !== "";
            });
          }
          var fQty = 0;
          var fValue = 0;
          var oOrders = {};
          var oMaterials = {};
          var MAX_LINES = 100;

          if (oModel._iToken !== iToken) {
            return;
          }

          aRows.forEach(function (oItem) {
            fQty += Number(oItem.OpenQty) || 0;
            fValue += Number(oItem.OpenValue) || 0;
            oOrders[oItem.OrderNumber] = true;
            oMaterials[oItem.Material] = true;
          });

          oModel.setData({
            title: oModel.getProperty("/title"),
            busy: false,
            summary: [
              { label: "Order Lines", value: this._formatValue(aRows.length, "num") },
              { label: "Distinct Orders", value: this._formatValue(Object.keys(oOrders).length, "num") },
              { label: "Distinct Materials", value: this._formatValue(Object.keys(oMaterials).length, "num") },
              { label: "Total Open Qty", value: this._formatValue(fQty, "num") },
              { label: "Total Open Value", value: this._formatValue(fValue, "num") }
            ],
            linesTitle: aRows.length > MAX_LINES ? "Order lines (first " + MAX_LINES + " of " + aRows.length + ")" : "Order lines (" + aRows.length + ")",
            lines: aRows.slice(0, MAX_LINES).map(function (oItem) {
              return {
                orderNumber: oItem.OrderNumber || "-",
                orderLine: this._formatValue(oItem.OrderLine),
                material: oItem.Material || "-",
                openQty: this._formatValue(oItem.OpenQty, "num"),
                deliveryDate: oItem.DeliveryDate || "-",
                plant: oItem.Plant || "-"
              };
            }.bind(this))
          });
        }.bind(this),
        error: function () {
          if (oModel._iToken === iToken) {
            oModel.setProperty("/busy", false);
            MessageToast.show("Could not load related information.");
          }
        }
      });
    },

    _closeRelatedPanel: function () {
      var oRelatedPage = this.byId("relatedPage");
      var oModel = oRelatedPage.getModel("related");

      oModel._iToken = (oModel._iToken || 0) + 1;
      this._setPaneVisible(oRelatedPage, false);
    },

    onCloseRelatedPanel: function () {
      this._closeRelatedPanel();
    },

    onCloseDetailPanel: function () {
      var oInnerTable = this.byId("smartTable").getTable();

      this._resetDetail();

      if (oInnerTable && typeof oInnerTable.clearSelection === "function") {
        oInnerTable.clearSelection();
      }
    },

    onBeforeRebindTable: function (oEvent) {
      var oBindingParams = oEvent.getParameter("bindingParams");
      var oFilterBar = this.byId("smartFilterBar");
      var oUiModel = this.getView().getModel("ui");
      var iPage = oUiModel.getProperty("/page");
      var iSkip = (iPage - 1) * PAGE_SIZE;
      var aFilters = [];
      var oInnerTable = this.byId("smartTable").getTable();

      if (oInnerTable) {
        this._enforceSingleSelect(oInnerTable);
        this._enhanceClickableColumns(oInnerTable);
        if (typeof oInnerTable.clearSelection === "function") {
          oInnerTable.clearSelection();
        }
        this._resetDetail();
      }

      if (oFilterBar && typeof oFilterBar.isInitialised === "function" && !oFilterBar.isInitialised()) {
        oBindingParams.preventTableBind = true;
        return;
      }

      if (oFilterBar && typeof oFilterBar.getFilters === "function") {
        aFilters = oFilterBar.getFilters();
      }

      var oSearchFilter = this._buildBasicSearchFilter(oFilterBar);

      if (oSearchFilter) {
        aFilters = aFilters.concat(oSearchFilter);
      }

      oBindingParams.filters = aFilters;

      oBindingParams.parameters = oBindingParams.parameters || {};
      oBindingParams.parameters.$top = PAGE_SIZE;
      oBindingParams.parameters.$skip = iSkip;
      oBindingParams.parameters.$inlinecount = "allpages";

      this._refreshTotalCount(aFilters);
    },

    onFilterSearch: function () {
      this.getView().getModel("ui").setProperty("/page", 1);
      this.byId("smartTable").rebindTable(true);
    },

    // Supports leading/trailing "*" wildcards (contains/starts with/ends with); plain text defaults to contains.
    _buildBasicSearchFilter: function (oFilterBar) {
      if (!oFilterBar || typeof oFilterBar.getBasicSearchValue !== "function") {
        return null;
      }

      var sValue = (oFilterBar.getBasicSearchValue() || "").trim();

      if (!sValue) {
        return null;
      }

      var bLeadingWildcard = sValue.charAt(0) === "*";
      var bTrailingWildcard = sValue.charAt(sValue.length - 1) === "*";
      var sTerm = sValue.replace(/^\*+|\*+$/g, "");
      var sOperator = FilterOperator.Contains;

      if (bLeadingWildcard && !bTrailingWildcard) {
        sOperator = FilterOperator.EndsWith;
      } else if (!bLeadingWildcard && bTrailingWildcard) {
        sOperator = FilterOperator.StartsWith;
      }

      var aFieldFilters = BASIC_SEARCH_FIELDS.map(function (sField) {
        return new Filter({ path: sField, operator: sOperator, value1: sTerm });
      });

      return new Filter({ filters: aFieldFilters, and: false });
    },

    _refreshTotalCount: function (aFilters) {
      this.getView().getModel().read("/Orders/$count", {
        filters: aFilters || [],
        success: function (oCount) {
          var iTotal = parseInt(oCount, 10);
          this._updatePaginationState(Number.isFinite(iTotal) ? iTotal : 0);
        }.bind(this),
        error: function () {
          this._updatePaginationState(0);
        }.bind(this)
      });
    },

    _updatePaginationState: function (iTotal) {
      var oUiModel = this.getView().getModel("ui");
      var iPage = oUiModel.getProperty("/page");
      var iTotalPages = Math.max(1, Math.ceil(iTotal / PAGE_SIZE));

      if (iPage > iTotalPages) {
        iPage = iTotalPages;
        oUiModel.setProperty("/page", iPage);
      }

      oUiModel.setProperty("/totalRecords", iTotal);
      oUiModel.setProperty("/totalPages", iTotalPages);
      oUiModel.setProperty("/hasPreviousPage", iPage > 1);
      oUiModel.setProperty("/hasNextPage", iPage < iTotalPages);
      oUiModel.setProperty("/pageSummary", "Page " + iPage + " of " + iTotalPages + " (" + iTotal + " rows)");
    },

    onNextPage: function () {
      var oUiModel = this.getView().getModel("ui");
      var iPage = oUiModel.getProperty("/page");
      var iTotalPages = oUiModel.getProperty("/totalPages");

      if (iPage >= iTotalPages) {
        return;
      }

      oUiModel.setProperty("/page", iPage + 1);
      this.byId("smartTable").rebindTable(true);
    },

    onPreviousPage: function () {
      var oUiModel = this.getView().getModel("ui");
      var iPage = oUiModel.getProperty("/page");

      if (iPage <= 1) {
        return;
      }

      oUiModel.setProperty("/page", iPage - 1);
      this.byId("smartTable").rebindTable(true);
    },

    _autoResizeColumns: function () {
      var oInnerTable = this.byId("smartTable").getTable();

      if (!oInnerTable || typeof oInnerTable.autoResizeColumn !== "function") {
        return;
      }

      oInnerTable.getColumns().forEach(function (oColumn, iIndex) {
        if (oColumn.getVisible()) {
          try {
            oInnerTable.autoResizeColumn(iIndex);
          } catch (e) {
            // Some generated columns cannot be auto-resized safely in all cases.
          }
        }
      });
    },

    _onDefaultSelectionLoaded: function (oModel) {
      var aDefaults = oModel.getProperty("/filters") || [];
      var oFilterBar = this.byId("smartFilterBar");
      var fnApplyDefaults = function () {
        aDefaults.forEach(function (oItem) {
          if (oItem.property) {
            oFilterBar.addFieldToAdvancedArea(oItem.property);
          }
        });
      };

      if (typeof oFilterBar.isInitialised === "function" && oFilterBar.isInitialised()) {
        fnApplyDefaults();
        return;
      }

      oFilterBar.attachInitialise(fnApplyDefaults);
    },

    _getVisibleExportColumns: function (oInnerTable, oFirstRow) {
      return oInnerTable.getColumns().filter(function (oColumn) {
        return oColumn.getVisible();
      }).map(function (oColumn) {
        var sProperty = oColumn.getSortProperty();
        var sLabel = oColumn.getLabel() && oColumn.getLabel().getText ? oColumn.getLabel().getText() : sProperty;
        var vSample = oFirstRow ? oFirstRow[sProperty] : null;
        var oExportCol = {
          label: sLabel,
          property: sProperty,
          width: 18
        };

        if (typeof vSample === "number") {
          oExportCol.type = "number";
        } else if (typeof vSample === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vSample)) {
          oExportCol.type = "date";
          oExportCol.inputFormat = "yyyy-mm-dd";
        } else {
          oExportCol.type = "string";
        }

        return oExportCol;
      }).filter(function (oColumn) {
        return !!oColumn.property;
      });
    },

    onExportExcel: function () {
      var oSmartTable = this.byId("smartTable");
      var oInnerTable = oSmartTable.getTable();
      var oBinding = oInnerTable && oInnerTable.getBinding("rows");
      var oModel = this.getView().getModel();

      if (!oBinding) {
        MessageToast.show("Table is not ready for export yet.");
        return;
      }

      var aFilters = oBinding.aFilters || [];
      var aSorters = oBinding.aSorters || [];

      oModel.read("/Orders", {
        filters: aFilters,
        sorters: aSorters,
        success: function (oData) {
          var aRows = (oData && oData.results) || [];

          if (!aRows.length) {
            MessageToast.show("No rows available for export.");
            return;
          }

          var aColumns = this._getVisibleExportColumns(oInnerTable, aRows[0]);
          var oSheet = new Spreadsheet({
            workbook: {
              columns: aColumns,
              context: {
                title: "Demand Visibility"
              }
            },
            dataSource: aRows,
            fileName: "DemandVisibility.xlsx"
          });

          oSheet.build().finally(function () {
            oSheet.destroy();
          });
        }.bind(this),
        error: function () {
          MessageToast.show("Export failed. Please try again.");
        }
      });
    }
  });
});

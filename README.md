# Demand Visibility Sample

SAPUI5 / Fiori app (SmartFilterBar + SmartTable) backed by a mock OData V2 service
(`sap.ui.core.util.MockServer`) with 500+ sample order rows.

## Run in VS Code
1. File > Open Folder... > select the folder that directly contains `package.json` (or open `demand-visibility-sample.code-workspace`).
2. Accept the "install recommended extensions" prompt (optional).
3. Open a terminal (Ctrl+`) and run:
   ```
   npm install
   npm start
   ```
   The app opens at http://localhost:8080/index.html.

Or press F5 and pick **Run app (npm start)**.

## Requirements
- Node.js 18+ (tested on Node 22)
- Internet access: UI5 libraries load from https://ui5.sap.com

## Regenerating data from Excel (optional)
See `data/README.md`. Without the Excel files, the data already in `webapp/` is used.

## Structure
- `webapp/` - UI5 app (Component, view, controller, manifest, mock server)
- `webapp/localService/` - mock server, metadata, `mockdata/Orders.json`
- `scripts/generate-mock-data.mjs` - Excel -> mock data generator

## Features
- **Order Number** and **Material** cells are hyperlinks. Clicking one opens a popup with order- or material-specific details (plus a summary computed from all matching order lines).
- The popup has an **Open in New Tab** button that shows the same data on a standalone page.
- The table is **single select**. Selecting a row opens a second panel with the order and material details (same data as the popup).
- Clicking a link also shows the same data in the second (side) panel and selects that row. In the second panel, every entry marked with `>` opens a **third panel** with related information (summary + matching order lines).
- All panes are separated by draggable dividers, so each can be enlarged or compressed. Selecting another row closes the third panel; **Close** / the back arrow closes a panel.
- Details are defined in one place: `_getSectionDefinitions` in `webapp/controller/Main.controller.js`; the layout is `webapp/view/DetailContent.fragment.xml`.

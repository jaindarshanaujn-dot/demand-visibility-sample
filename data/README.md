# Optional Excel sources

To regenerate the mock OData from Excel, place these files here:

- `Visual_Demo.xlsx` (headers on row 4, data below)
- `Demand Visibility_Report.xlsx` (sheet "Selection Parameter")

Then run `npm run generate:data`. Or point to files elsewhere with the
`VISUAL_DEMO_XLSX` and `SELECTION_XLSX` environment variables.

Without these files, `npm start` uses the already-generated data in `webapp/`.

import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const ROOT = path.resolve(process.cwd());
// Optional Excel sources. Looked up (in order): env var, ./data/, project root.
// If they are not found, the pre-generated files committed in webapp/ are used as-is.
function findFile(envValue, fileName) {
  const candidates = [envValue, path.join(ROOT, "data", fileName), path.join(ROOT, fileName)].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || candidates[candidates.length - 1];
}
const VISUAL_DEMO_PATH = findFile(process.env.VISUAL_DEMO_XLSX, "Visual_Demo.xlsx");
const SELECTION_PATH = findFile(process.env.SELECTION_XLSX, "Demand Visibility_Report.xlsx");

const WEBAPP = path.join(ROOT, "webapp");
const MOCK_DATA_PATH = path.join(WEBAPP, "localService", "mockdata", "Orders.json");
const METADATA_PATH = path.join(WEBAPP, "localService", "metadata.xml");
const COLUMNS_PATH = path.join(WEBAPP, "model", "columns.json");
const DEFAULT_SELECTION_PATH = path.join(WEBAPP, "model", "defaultSelection.json");
const MIN_ROWS = 500;

const DECIMAL_LABELS = new Set([
  "orderqty",
  "confirmedqty",
  "totalquantityondelivery",
  "qtyondeliverynotinvoiced",
  "qtyinvoiced",
  "openqty",
  "unitprice",
  "totallinevalue",
  "openvalue",
  "materialleadtimeweeks",
  "currentscheddlvdatedifffromcrd",
  "quoteline",
  "taxes",
  "freight",
  "poweeksaheadofcrd"
]);

const INT_LABELS = new Set([
  "orderline",
  "schedlinenbr",
  "poline",
  "deliverypriority",
  "orderpriority"
]);

const DATE_HINTS = [
  "date",
  "createdon",
  "created",
  "mad",
  "fiscalquarter",
  "yearmonth"
];

function toPropertyName(header, used) {
  const fallback = "Field";
  const safe = String(header || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((token, idx) => {
      const lower = token.toLowerCase();
      return idx === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("") || fallback;

  let candidate = safe.replace(/^[0-9]/, "N$&");
  let index = 1;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${safe}${index}`;
  }
  used.add(candidate);
  return candidate;
}

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectEdmType(label) {
  const n = normalize(label);
  if (DATE_HINTS.some((hint) => n.includes(hint))) {
    return "Edm.String";
  }
  if (DECIMAL_LABELS.has(n)) {
    return "Edm.Decimal";
  }
  if (INT_LABELS.has(n)) {
    return "Edm.Int32";
  }
  return "Edm.String";
}

function isDateColumn(label) {
  const n = normalize(label);
  return DATE_HINTS.some((hint) => n.includes(hint));
}

function formatDateValue(value) {
  if (value == null || value === "") {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return raw.slice(0, 10);
  }

  const monthMap = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };
  const m = raw.match(/^(?:\w{3}\s)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2})\s(\d{4})/);
  if (m) {
    const mm = monthMap[m[1]];
    const dd = String(Number(m[2])).padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return raw;
}

function parseNumeric(value, asInt) {
  if (value == null) {
    return null;
  }

  const cleaned = typeof value === "number"
    ? value
    : Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(cleaned)) {
    return null;
  }

  return asInt ? Math.trunc(cleaned) : cleaned;
}

function parseByType(value, edmType, label) {
  if (isDateColumn(label)) {
    return formatDateValue(value);
  }

  if (edmType === "Edm.Decimal") {
    return parseNumeric(value, false);
  }
  if (edmType === "Edm.Int32") {
    return parseNumeric(value, true);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed;
  }

  return value == null ? "" : String(value).trim();
}

function readVisualDemo() {
  const wb = XLSX.readFile(VISUAL_DEMO_PATH, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const headers = (rows[3] || []).map((h) => (h == null ? "" : String(h).trim()));
  const dataRows = rows.slice(4).filter((row) => row.some((cell) => cell !== null && cell !== ""));
  return { headers, dataRows };
}

function readSelectionDefaults(mappedColumns) {
  const wb = XLSX.readFile(SELECTION_PATH, { cellDates: true });
  const ws = wb.Sheets["Selection Parameter"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const preferred = rows
    .slice(1)
    .map((r) => r[0])
    .filter(Boolean)
    .map((v) => String(v).trim());

  const byNormalizedLabel = new Map(mappedColumns.map((c) => [normalize(c.label), c.property]));

  const filters = preferred
    .map((label) => {
      const n = normalize(label);
      if (byNormalizedLabel.has(n)) {
        return { label, property: byNormalizedLabel.get(n) };
      }

      const fuzzy = mappedColumns.find((c) => normalize(c.label).includes(n) || n.includes(normalize(c.label)));
      if (fuzzy) {
        return { label, property: fuzzy.property };
      }
      return null;
    })
    .filter(Boolean);

  return { filters };
}

function buildArtifacts() {
  const { headers, dataRows } = readVisualDemo();
  const used = new Set(["ID"]);
  const mappedColumns = headers.map((label) => ({
    label,
    property: toPropertyName(label, used),
    edmType: detectEdmType(label)
  }));

  const results = dataRows.map((row, idx) => {
    const item = { ID: String(idx + 1) };
    mappedColumns.forEach((col, colIdx) => {
      const value = row[colIdx];
      item[col.property] = parseByType(value, col.edmType, col.label);
    });
    return item;
  });

  const orderNumberProperty = mappedColumns.find((col) => normalize(col.label) === "ordernumber")?.property || "OrderNumber";
  const materialProperty = mappedColumns.find((col) => normalize(col.label) === "material")?.property || "Material";

  if (results.length > 0 && results.length < MIN_ROWS) {
    const seed = results.slice();
    let seq = results.length;

    while (results.length < MIN_ROWS) {
      const src = seed[seq % seed.length];
      const clone = { ...src };
      seq += 1;
      clone.ID = String(seq);

      if (clone[orderNumberProperty] != null && clone[orderNumberProperty] !== "") {
        clone[orderNumberProperty] = `${clone[orderNumberProperty]}-${String(seq).padStart(4, "0")}`;
      }
      if (clone[materialProperty] != null && clone[materialProperty] !== "") {
        clone[materialProperty] = `${clone[materialProperty]}-V${String((seq % 20) + 1).padStart(2, "0")}`;
      }

      results.push(clone);
    }
  }

  const metadata = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">
  <edmx:DataServices m:DataServiceVersion="2.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
    <Schema Namespace="DemandVisibilityService" xmlns="http://schemas.microsoft.com/ado/2008/09/edm" xmlns:sap="http://www.sap.com/Protocols/SAPData">
      <EntityType Name="Order">
        <Key>
          <PropertyRef Name="ID" />
        </Key>
        <Property Name="ID" Type="Edm.String" Nullable="false" sap:label="ID" sap:creatable="false" sap:updatable="false" sap:sortable="true" sap:filterable="true" />
${mappedColumns
  .map(
    (c) =>
      `        <Property Name="${c.property}" Type="${c.edmType}" Nullable="true" sap:label="${String(c.label || c.property).replace(/"/g, "&quot;")}" sap:sortable="true" sap:filterable="true" />`
  )
  .join("\n")}
      </EntityType>
      <EntityContainer Name="DemandVisibilityService_Entities" m:IsDefaultEntityContainer="true">
        <EntitySet Name="Orders" EntityType="DemandVisibilityService.Order" sap:creatable="false" sap:updatable="false" sap:deletable="false" sap:pageable="true" sap:content-version="1" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
`;

  const defaults = readSelectionDefaults(mappedColumns);

  fs.mkdirSync(path.dirname(MOCK_DATA_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(METADATA_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(COLUMNS_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(DEFAULT_SELECTION_PATH), { recursive: true });

  fs.writeFileSync(MOCK_DATA_PATH, JSON.stringify({ d: { results } }, null, 2), "utf8");
  fs.writeFileSync(METADATA_PATH, metadata, "utf8");
  fs.writeFileSync(COLUMNS_PATH, JSON.stringify(mappedColumns, null, 2), "utf8");
  fs.writeFileSync(DEFAULT_SELECTION_PATH, JSON.stringify(defaults, null, 2), "utf8");

  console.log(`Generated ${results.length} records with ${mappedColumns.length} columns.`);
  console.log(`Defaults mapped: ${defaults.filters.length}`);
}

if (!fs.existsSync(VISUAL_DEMO_PATH) || !fs.existsSync(SELECTION_PATH)) {
  console.log("Excel source files not found (see data/README.md) - keeping existing generated mock data.");
} else {
  buildArtifacts();
}

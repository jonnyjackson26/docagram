const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "packages", "excalidraw", "locales");

const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const filePath = path.join(localesDir, file);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  // 1. exportDialog.excalidrawplus_description
  if (data.exportDialog) {
    delete data.exportDialog.excalidrawplus_description;
    delete data.exportDialog.excalidrawplus_button;
    delete data.exportDialog.excalidrawplus_exportError;
  }

  // 2. welcomeScreen.app.center_heading_plus
  if (data.welcomeScreen && data.welcomeScreen.app) {
    delete data.welcomeScreen.app.center_heading_plus;
  }

  // 3. overwriteConfirm.action.excalidrawPlus
  if (
    data.overwriteConfirm &&
    data.overwriteConfirm.action &&
    data.overwriteConfirm.action.excalidrawPlus
  ) {
    delete data.overwriteConfirm.action.excalidrawPlus;
  }

  const output = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(filePath, output, "utf-8");
  console.log(`Processed: ${file}`);
}

console.log(`\nDone. Processed ${files.length} files.`);

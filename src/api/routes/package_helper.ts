import * as path from "path";
import * as fs from "fs/promises";
import AdmZip from "adm-zip";

// Logger (stub for demonstration; replace with your logger)
const logger = {
  info: console.log,
  debug: console.debug,
  error: console.error,
};

// Helper: Unzip Base64 Content
async function unzipContent(content: string): Promise<string> {
  logger.info("unzipContent: Unzipping content");

  try {
    const buffer = Buffer.from(content, "base64");
    const zip = new AdmZip(buffer);

    const tempDir = path.join(__dirname, "..", "artifacts", "unzipped");
    await fs.mkdir(tempDir, { recursive: true });

    // Extract files
    zip.extractAllTo(tempDir, true);
    logger.info("unzipContent: Content unzipped to: " + tempDir);

    return tempDir;
  } catch (err) {
    logger.error("unzipContent: Error unzipping content", err);
    throw err;
  }
}

// Helper: Get package.json
async function getPackageJSON(basePath: string): Promise<any> {
  logger.info("getPackageJSON: Retrieving package.json from basePath: " + basePath);

  try {
    const packageJsonPath = path.join(basePath, "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    logger.info("getPackageJSON: Successfully read package.json");

    return JSON.parse(packageJsonContent);
  } catch (err) {
    logger.error("getPackageJSON: Error reading package.json", err);
    throw new Error("package.json not found or invalid.");
  }
}

// Helper: Delete Unzipped Folder
export async function deleteUnzippedFolder(basePath: string): Promise<void> {
  logger.info("deleteUnzippedFolder: Deleting unzipped folder: " + basePath);

  try {
    await fs.rm(basePath, { recursive: true, force: true });
    logger.info("deleteUnzippedFolder: Successfully deleted folder");
  } catch (err) {
    logger.error("deleteUnzippedFolder: Error deleting folder", err);
  }
}

// Main Function: Get URL From Content
export async function getUrlFromContent(
  content: string
): Promise<{ url: string; } | null> {
  logger.info("getUrlFromContent: Processing content");

  let basePath = await unzipContent(content);
  logger.info("getUrlFromContent: Unzipped to basePath: " + basePath);

  try {
    const package_json = await getPackageJSON(basePath);

    let url = package_json["homepage"];
    if (!url) {
      logger.debug("getUrlFromContent: No homepage field in package.json");
      await deleteUnzippedFolder(basePath);
      return null;
    }

    logger.info("getUrlFromContent: Extracted URL: " + url);
    return { url};
  } catch (error) {
    logger.debug("getUrlFromContent: Error processing content or no package.json");
    await deleteUnzippedFolder(basePath);
    return null;
  }
}

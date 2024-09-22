import { readFileSync, writeFileSync } from "fs";

// Step 1: Read the raw test-results file
const rawData = readFileSync("testResults.json", "utf-8");

// Step 2: Filter out non-JSON lines and keep only the relevant ones
const cleanedData = rawData.split("\n").filter(line => {
    // Keep lines that start with '{' or end with '}', which are parts of the JSON data
    return line.trim().startsWith("{") || line.trim().endsWith("}");
}).join("\n");

// Step 3: Write the cleaned data into a new file without parsing
writeFileSync("cleanTestResults.json", cleanedData);

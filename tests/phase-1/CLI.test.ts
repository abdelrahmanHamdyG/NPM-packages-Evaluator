import { describe, test, expect, vi } from "vitest";
import { CLI } from "../../src/phase-1/CLI";
import fs from "fs/promises";
import { Logger } from "../../src/phase-1/logger";

// Mock fs and logger
vi.mock("fs/promises");

describe("CLI", () => {
  let cli: CLI;

  beforeEach(() => {
    // Inject the mock logger into the CLI instance
    cli = new CLI();
  });

  

  test("should log and read from file successfully", async () => {
    // Mock the fs.readFile method to return a fake file content
    vi.spyOn(fs, "readFile").mockResolvedValueOnce("https://github.com/user/repo\nhttps://www.npmjs.com/package/pkg");

    // Call the readFromFile method
    const logSpy = vi.spyOn(Logger.prototype, "log");
    const urls = await cli['readFromFile']('test-file.txt');
    
    // Assert the expected URLs are returned
    expect(urls).toEqual([
      "https://github.com/user/repo",
      "https://www.npmjs.com/package/pkg"
    ]);
    
    // Check if logger was called during the process
    expect(logSpy).toHaveBeenCalledWith(2, "Attempting to read from file: test-file.txt");
    expect(logSpy).toHaveBeenCalledWith(2, "Successfully read 2 URLs from file.");
  });

  test("should handle file read error gracefully", async () => {
    // Mock fs.readFile to throw an error
    vi.spyOn(fs, "readFile").mockRejectedValueOnce(new Error("File not found"));
    
    // Call the readFromFile method with a missing file
    const logSpy = vi.spyOn(Logger.prototype, "log");
    const urls = await cli["readFromFile"]("missing-file.txt");
    
    // Assert that an empty array is returned
    expect(urls).toEqual([]);
    
    // Check if logger was called with the error message
    expect(logSpy).toHaveBeenCalledWith(1, "Error reading from file missing-file.txt: Error: File not found");
  });

  test("should log messages when ranking modules", async () => {
    // Mock the rankModulesTogether method to return mock data
    vi.spyOn(cli, "rankModulesTogether").mockResolvedValueOnce([
      { npmData: { latency: 200 }, githubData: { latency: 150 } }
    ]);

    // Mock the readFromFile method
    vi.spyOn(cli, "readFromFile").mockResolvedValueOnce([
      "https://github.com/user/repo",
    ]);

    // Call the rankModules method
    const logSpy = vi.spyOn(Logger.prototype, "log");
    await cli.rankModules("test-file.txt");

    // Verify logger calls
    expect(logSpy).toHaveBeenCalledWith(1, "Starting to rank modules from path: test-file.txt");
    expect(logSpy).toHaveBeenCalledWith(1, "The data fetched for each URL:");
  });
});
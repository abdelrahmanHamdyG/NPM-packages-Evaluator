import { describe, test, expect, beforeEach, vi } from "vitest";
import {NpmAPI} from "../src/NpmAPI";
import { NPMData } from "../src/NPMData";
import { Logger } from "../src/logger";
describe("NpmAPI Tests", () => {
    let npmAPI: NpmAPI;
    beforeEach(() => {
      npmAPI = new NpmAPI("test");
    });
    test("fetches data successfully from NPM", async () => {
        //mock the fetch function globally
        global.fetch = vi.fn().mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            "dist-tags": { latest: "1.0.0" },
            versions: {
              "1.0.0": {
                license: "MIT",
                repository: { url: "git+https://github.com/user/repo.git" },
              },
            },
          }),
     });
    
          const data = await npmAPI.fetchData();
          //check if the returned data is an instance of NPMData
          expect(data).toBeInstanceOf(NPMData);
    
          //check if the extracted license and URL are correct
          expect(data.license).toBe("MIT");
          expect(data.githubUrl).toBe("https://github.com/user/repo");
     });
    test("fetches data unsuccessfully from NPM", async () => {
        //mock the fetch function globally
        global.fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                "dist-tags": { late: "1.0.0" },
                        versions: {
                  "1.0.0": {
                    license: "MIT",
                    repository: { url: "git+https://github.com/user/repo.git" },
                  },
                },
              }),
            });
        
            const data = await npmAPI.fetchData();
              //check if the returned data is an instance of NPMData
              expect(data).toBeInstanceOf(NPMData);
        
              //check if the extracted license and URL are correct
              expect(data.license).toBe("empty");
              expect(data.githubUrl).toBe("empty");
    });
    test("prints the correct data", () => {
        //spy on the Logger's log method
        const logSpy = vi.spyOn(Logger.prototype, "log");
    
        //create an instance of GitHubData with specific values
        const data = new NPMData(
            "MIT"
            ,"https://github.com/test/repo");
        data.printMyData();
        
        expect(logSpy).toHaveBeenNthCalledWith(1, 2, "NPM Data:");
        expect(logSpy).toHaveBeenNthCalledWith(2, 2, "License: MIT");
        expect(logSpy).toHaveBeenNthCalledWith(3, 2, "GitHub URL: https://github.com/test/repo");
        //restoring the spy
        logSpy.mockRestore();
      });
      test("prints the incorrect data", () => {
        //spy on the Logger's log method
        const logSpy = vi.spyOn(Logger.prototype, "log");
    
        //create an instance of GitHubData with specific values
        const data = new NPMData();
        data.printMyData();
        //check if Logger.log was called with the correct arguments
        
        expect(logSpy).toHaveBeenNthCalledWith(1, 2, "NPM Data:");
        expect(logSpy).toHaveBeenNthCalledWith(2, 2, "License: empty");
        expect(logSpy).toHaveBeenNthCalledWith(3, 2, "GitHub URL: empty");
        //restoring the spy
        logSpy.mockRestore();
      });

});

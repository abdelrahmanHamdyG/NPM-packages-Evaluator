import { describe, test, expect, beforeEach, vi } from "vitest";
import { Octokit } from "octokit";
import { GitHubAPI } from "../src/GitHubAPI";
import { GitHubData } from "../src/GitHubData";
import { Logger } from "../src/logger"; 

//do mocking for octokit to not make a real reqeust to fetch data 
vi.mock("octokit", () => {
  return {
    Octokit: vi.fn().mockImplementation(() => ({
      request: vi.fn(),
    })),
  };
});

describe("GitHubAPI Tests", () => {
  let githubAPI: GitHubAPI;
  let octokitInstance: any;
  beforeEach(() => {
    //create a new GitHubAPI instance before each test
    githubAPI = new GitHubAPI("owner", "repo");
    //get the Octokit mock constructor
    const OctokitMock = Octokit as unknown as vi.Mock; 
    
    OctokitMock.mockClear(); // reset both mock contructor and instances
    //mock the octokit instance methods
    octokitInstance = {
      request: vi.fn(),
    };
    //make the Octokit constructor return our mocked instance
    OctokitMock.mockImplementation(() => octokitInstance);
  });
  //testing for the successfully fetching data
  test("fetching data successfully", async () => {
    // General mock implementation for all requests
    octokitInstance.request.mockImplementation((url, params) => {
      if (url === "GET /repos/{owner}/{repo}") {
        return Promise.resolve({
          data: {
            name: "test-repo",
            description: "A test repo",
            license: { name: "MIT" },
            forks_count: 10,
            stargazers_count: 20,
            collaborators_url: "http://example.com/collaborators",
          },
        });
      } else if (url === "GET /repos/{owner}/{repo}/issues") {
        const page = params.page || 1;
        if (page <= 1) {
          return Promise.resolve({ data: [{}, {}, {}] }); // first page with 3 issues
        } else {
          return Promise.resolve({ data: [] }); // no more issues
        }
      } else if (url === "GET /repos/{owner}/{repo}/commits") {
        return Promise.resolve({ data: [{}, {}, {}, {}] }); //4 commits
      } else if (url === "GET /repos/{owner}/{repo}/contributors") {
        const page = params.page || 1;
        if (page <= 1) {
          return Promise.resolve({
            data: [
              { login: "user1", contributions: 50 },
              { login: "user2", contributions: 30 },
            ],
          });
        } else {
          return Promise.resolve({ data: [] }); // no more contributors
        }
      } else if (url === "GET /repos/{owner}/{repo}/readme") {
        return Promise.resolve({ data: { content: "README content" } });
      } else {
        return Promise.reject(new Error("Unknown API endpoint: ${url}"));
      }
    });
    //waiting fot the async. function fetchData
    const data = await githubAPI.fetchData();

    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe("test-repo");
    expect(data.numberOfclosedIssues).toBe(3);
    expect(data.numberOfCommits).toBe(4);
    expect(data.numberOfForks).toBe(10);
    expect(data.numberOfStars).toBe(20);
    expect(data.readme).toBe(true);
    expect(data.description).toBe(true);
    expect(data.license).toBe("MIT");
    expect(data.contributions).toEqual([
      { contributor: "user1", commits: 50 },
      { contributor: "user2", commits: 30 },
    ]);
  });
  //testing for the function fetching data and simulating an error to check the output
  test("handles errors when fetching data", async () => {
    //simulating an error while fetching repo data
    octokitInstance.request.mockImplementation(() => {
      return Promise.reject(new Error("fetcing Error"));
    });
    //waiting fot the async. function fetchData
    const data = await githubAPI.fetchData();
    //testing the fetched data with the expected 
    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe("empty");
    expect(data.numberOfclosedIssues).toBe(0);
    expect(data.numberOfCommits).toBe(0);
    expect(data.numberOfForks).toBe(0);
    expect(data.numberOfStars).toBe(0);
    expect(data.readme).toBe(false);
    expect(data.description).toBe(false);
    expect(data.license).toBe("empty");
    expect(data.contributions).toEqual([]);
  });
  /*test using spying not moking to monitor how the Logger.log method is called. 
  A spy allows us to track the method calls without replacing the 
  actual implementation*/
  test("prints the correct data", () => {
    //spy on the Logger's log method
    const logSpy = vi.spyOn(Logger.prototype, "log");

    //create an instance of GitHubData with specific values
    const data = new GitHubData(
      "https://github.com/test/repo",
      "test-repo",
      5,     
      10,    
      3,     
      15,    
      2,     
      true,  
      true,  
      [{ contributor: "user1", commits: 50 }],
      "MIT"  
    );

    data.printMyData();

    //check if Logger.log was called with the correct arguments
    expect(logSpy).toHaveBeenNthCalledWith(1, 1, "GitHub Data:");
    expect(logSpy).toHaveBeenNthCalledWith(2, 1, "Name: test-repo");
    expect(logSpy).toHaveBeenNthCalledWith(3, 1, "Number of Issues: 5");
    expect(logSpy).toHaveBeenNthCalledWith(4, 1, "Number of Commits: 10");
    expect(logSpy).toHaveBeenNthCalledWith(5, 1, "Contributions Array: user1");
    expect(logSpy).toHaveBeenNthCalledWith(6, 2, "Readme Present: Yes");
    expect(logSpy).toHaveBeenNthCalledWith(7, 2, "Description Present: Yes");

    //restoring the spy
    logSpy.mockRestore();
  });
  test("prints the incorrect data", () => {
    //spy on the Logger's log method
    const logSpy = vi.spyOn(Logger.prototype, "log");

    //create an instance of GitHubData with specific values
    const data = new GitHubData();
    data.printMyData();
    //check if Logger.log was called with the correct arguments
    expect(logSpy).toHaveBeenNthCalledWith(1, 1, "GitHub Data:");
    expect(logSpy).toHaveBeenNthCalledWith(2, 1, "Name: empty");
    expect(logSpy).toHaveBeenNthCalledWith(3, 1, "Number of Issues: N/A");
    expect(logSpy).toHaveBeenNthCalledWith(4, 1, "Number of Commits: N/A");
    expect(logSpy).toHaveBeenNthCalledWith(5, 1, "Contributions Array: N/A");
    expect(logSpy).toHaveBeenNthCalledWith(6, 2, "Readme Present: No");
    expect(logSpy).toHaveBeenNthCalledWith(7, 2, "Description Present: No");
    //restoring the spy
    logSpy.mockRestore();
  });

});

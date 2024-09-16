import { Octokit } from "octokit";
import { GitHubAPI } from "../src/GitHubAPI";
import { GitHubData } from "../src/GitHubData";

// Mocking Octokit
jest.mock("octokit", () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      request: jest.fn().mockImplementation((url) => {
        // Default mock responses, will be overridden by individual test cases
        if (url === "GET /repos/{owner}/{repo}") {
          return Promise.resolve({ data: { name: "Default Repo" } });
        }
        if (url === "GET /repos/{owner}/{repo}/issues") {
          return Promise.resolve({ data: Array(5).fill({}) });
        }
        if (url === "GET /repos/{owner}/{repo}/commits") {
          return Promise.resolve({ data: Array(10).fill({}) });
        }
        return Promise.reject(new Error("Unknown API endpoint"));
      })
    }))
  };
});

describe('GitHubAPI fetchData', () => {
  let githubAPI: GitHubAPI;

  beforeEach(() => {
    githubAPI = new GitHubAPI("owner", "repo");
  });

  test('fetches data successfully for repo test1', async () => {
    // Override the global mock for this test case
    (Octokit as jest.Mock).mockImplementationOnce(() => ({
      request: jest.fn().mockImplementation((url) => {
        if (url === "GET /repos/{owner}/{repo}") {
          return Promise.resolve({ data: { name: "test1" } });
        }
        if (url === "GET /repos/{owner}/{repo}/issues") {
          return Promise.resolve({ data: Array(3).fill({}) });
        }
        if (url === "GET /repos/{owner}/{repo}/commits") {
          return Promise.resolve({ data: Array(8).fill({}) });
        }
        return Promise.reject(new Error("Unknown API endpoint"));
      })
    }));

    const data = await githubAPI.fetchData();
    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe("test1"); // Ensure this matches the mock response
    expect(data.numberOfIssues).toBe(3); // Ensure this matches the mock response
    expect(data.numberOfCommits).toBe(8); // Ensure this matches the mock response
  });

  test('fetches data successfully for repo test2', async () => {
    // Override the global mock for this test case
    (Octokit as jest.Mock).mockImplementationOnce(() => ({
      request: jest.fn().mockImplementation((url) => {
        if (url === "GET /repos/{owner}/{repo}") {
          return Promise.resolve({ data: { name: "test2" } });
        }
        if (url === "GET /repos/{owner}/{repo}/issues") {
          return Promise.resolve({ data: Array(10).fill({}) });
        }
        if (url === "GET /repos/{owner}/{repo}/commits") {
          return Promise.resolve({ data: Array(15).fill({}) });
        }
        return Promise.reject(new Error("Unknown API endpoint"));
      })
    }));

    const data = await githubAPI.fetchData();
    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe("test2"); // Ensure this matches the mock response
    expect(data.numberOfIssues).toBe(10); // Ensure this matches the mock response
    expect(data.numberOfCommits).toBe(15); // Ensure this matches the mock response
  });

  test('handles errors for unknown repo', async () => {
    // Override the global mock to simulate an error
    (Octokit as jest.Mock).mockImplementationOnce(() => ({
      request: jest.fn().mockRejectedValueOnce(new Error("Failed to fetch"))
    }));

    const data = await githubAPI.fetchData();
    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe("empty"); // Default value
    expect(data.numberOfIssues).toBe(-1); // Default value
    expect(data.numberOfCommits).toBe(-1); // Default value
  });
});

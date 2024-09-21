import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Octokit } from 'octokit';
import { GitHubAPI } from '../src/GitHubAPI';
import { GitHubData } from '../src/GitHubData';
import { Logger } from '../src/logger'; // Adjust the import path as needed

// Mocking Octokit
vi.mock('octokit', () => {
  return {
    Octokit: vi.fn().mockImplementation(() => ({
      request: vi.fn(),
    })),
  };
});

// Mocking Logger
vi.mock('../src/logger', () => {
  return {
    Logger: vi.fn().mockImplementation(() => ({
      log: vi.fn(),
    })),
  };
});

describe('GitHubAPI Tests', () => {
  let githubAPI: GitHubAPI;
  let octokitInstance: any;
  let loggerInstance: any;

  beforeEach(() => {
    // Create a new GitHubAPI instance before each test
    githubAPI = new GitHubAPI('owner', 'repo');

    // Get the Octokit mock constructor
    const OctokitMock = Octokit as unknown as vi.Mock;
    OctokitMock.mockClear(); // Reset the mock constructor and its instances

    // Mock the Octokit instance methods
    octokitInstance = {
      request: vi.fn(),
    };

    // Make the Octokit constructor return our mocked instance
    OctokitMock.mockImplementation(() => octokitInstance);

    // Mock Logger instance
    const LoggerMock = Logger as unknown as vi.Mock;
    LoggerMock.mockClear();
    loggerInstance = {
      log: vi.fn(),
    };
    LoggerMock.mockImplementation(() => loggerInstance);
  });

  test('fetches data successfully', async () => {
    // General mock implementation for all requests
    octokitInstance.request.mockImplementation((url, params) => {
      if (url === 'GET /repos/{owner}/{repo}') {
        return Promise.resolve({
          data: {
            name: 'test-repo',
            description: 'A test repo',
            license: { name: 'MIT' },
            forks_count: 10,
            stargazers_count: 20,
            collaborators_url: 'http://example.com/collaborators',
          },
        });
      } else if (url === 'GET /repos/{owner}/{repo}/issues') {
        const page = params.page || 1;
        if (page <= 1) {
          return Promise.resolve({ data: [{}, {}, {}] }); // First page with 3 issues
        } else {
          return Promise.resolve({ data: [] }); // No more issues
        }
      } else if (url === 'GET /repos/{owner}/{repo}/commits') {
        return Promise.resolve({ data: [{}, {}, {}, {}] });
      } else if (url === 'GET /repos/{owner}/{repo}/contributors') {
        const page = params.page || 1;
        if (page <= 1) {
          return Promise.resolve({
            data: [
              { login: 'user1', contributions: 50 },
              { login: 'user2', contributions: 30 },
            ],
          });
        } else {
          return Promise.resolve({ data: [] }); // No more contributors
        }
      } else if (url === 'GET /repos/{owner}/{repo}/readme') {
        return Promise.resolve({ data: { content: 'README content' } });
      } else {
        return Promise.reject(new Error(`Unknown API endpoint: ${url}`));
      }
    });

    const data = await githubAPI.fetchData();

    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe('test-repo');
    expect(data.numberOfIssues).toBe(3);
    expect(data.numberOfCommits).toBe(4);
    expect(data.numberOfForks).toBe(10);
    expect(data.numberOfStars).toBe(20);
    expect(data.readme).toBe(true);
    expect(data.description).toBe(true);
    expect(data.license).toBe('MIT');
    expect(data.contributions).toEqual([
      { contributor: 'user1', commits: 50 },
      { contributor: 'user2', commits: 30 },
    ]);
  });

  test('handles errors when fetching data', async () => {
    // Simulate an error when fetching repository data
    octokitInstance.request.mockImplementation(() => {
      return Promise.reject(new Error('Network Error'));
    });

    const data = await githubAPI.fetchData();

    expect(data).toBeInstanceOf(GitHubData);
    expect(data.name).toBe('empty');
    expect(data.numberOfIssues).toBe(-1);
    expect(data.numberOfCommits).toBe(-1);
    expect(data.numberOfForks).toBe(-1);
    expect(data.numberOfStars).toBe(-1);
    expect(data.readme).toBe(false);
    expect(data.description).toBe(false);
    expect(data.license).toBe('empty');
    expect(data.contributions).toEqual([]);
  });

 
});

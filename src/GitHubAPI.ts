import { Octokit } from "octokit";
import { GitHubData } from "./GitHubData.js";
import { API } from "./API.js";
import { Issue } from "./IssueInterface.js";
import { Contributor } from "./ContributorInterface.js";

// Fetching and managing GitHub repository data
export class GitHubAPI extends API {
    private owner: string; // Storing GitHub repository owner
    private repoName: string; // Storing GitHub repository name

    // Setting up owner and repo name
    constructor(owner: string, repoName: string) {
        super();
        this.owner = owner;
        this.repoName = repoName;
        this.logger.log(2, "GitHubAPI initialized for owner: " + this.owner + ", repo: " + this.repoName);
    }

    // Fetching data from GitHub API
    public async fetchData(): Promise<GitHubData> {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN // Authenticating using token
        });

        const start = performance.now(); // Measuring how long the request takes

        try {
            this.logger.log(2, "Fetching data for owner: " + this.owner + ", repo: " + this.repoName);

            // Making multiple API requests in parallel
            // Fetching repository info
            const reposRequest = octokit.request("GET /repos/{owner}/{repo}", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28" // Using specific API version
                }
            });
            // Fetching commits
            const commitsRequest = octokit.request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            // Fetching issues and contributors
            const issuesRequest = this.fetchIssues(octokit);
            const contributorsRequest = this.fetchContributors(octokit);
            // Fetching readme
            const readmeRequest = octokit.request("GET /repos/{owner}/{repo}/readme", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            this.logger.log(2, "Awaiting responses from GitHub API requests.");

            // Waiting for all API requests to finish
            const [reposResponse, issuesResponse, commitsResponse, contributors, readmeResponse] = await Promise.all([
                reposRequest,
                issuesRequest,
                commitsRequest,
                contributorsRequest,
                readmeRequest.catch(() => null) // Handling case where readme doesn't exist
            ]);

            const closed_issues = issuesResponse.closedIssues;
            const openIssues = issuesResponse.openIssues;
            this.logger.log(2, "Fetched " + closed_issues.length + " closed issues and " + openIssues.length + " open issues.");

            // Processing contributors
            const totalContributions = (contributors as Contributor[]).map((contributor: Contributor) => ({
                contributor: contributor.login,
                commits: contributor.contributions
            }));
            this.logger.log(2, "Processed contributions from " + contributors.length + " contributors.");

            const readmeFound = !!readmeResponse; // Checking if readme exists
            const descriptionFound = !!reposResponse.data.description; // Checking if description exists
            this.logger.log(2, "Readme found: " + readmeFound + ", Description found: " + descriptionFound);

            const license = reposResponse.data.license ? reposResponse.data.license.name : "empty"; // Getting license info
            this.logger.log(2, "License: " + license);

            const end = performance.now(); // Ending the latency timer
            const latency = end - start;
            this.logger.log(2, "Data fetch latency: " + latency + " ms.");
            this.logger.log(2, "Successfully fetched data from GitHub API");

            // Returning the fetched data
            return new GitHubData(
                this.generateRepoUrl(this.owner, this.repoName),
                reposResponse.data.name,
                closed_issues.length,
                commitsResponse.data.length,
                reposResponse.data.forks_count,
                reposResponse.data.stargazers_count,
                reposResponse.data.collaborators_url.length,
                readmeFound,
                descriptionFound,
                totalContributions,
                license,
                closed_issues,
                reposResponse.data.size,
                openIssues,
                latency,
            );
        } catch (error) {
            this.logger.log(2, "Error fetching data: " + error + " for the repo " + this.repoName);
            return new GitHubData(); // Returning empty data if there is an error
        }
    }

    // Fetching issues from GitHub (both closed and open) using pagination
    private async fetchIssues(octokit: Octokit): Promise<{ closedIssues: Issue[], openIssues: Issue[] }> {
        const closedIssues: Issue[] = [];
        const openIssues: Issue[] = [];
        let page = 1;
        const perPage = 100; // Setting number of issues to fetch per page
        let moreIssues = true;

        const currentDate = new Date();
        const threeMonthsAgo = new Date(); // Limiting fetch to issues from the last three months
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

        this.logger.log(2, "Fetching closed issues since " + threeMonthsAgo.toISOString());

        // Fetching closed issues in multiple pages
        while (moreIssues) {
            const issuesResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage,
                state: "closed", // Getting closed issues
                since: threeMonthsAgo.toISOString() // From three months ago
            });

            const fetchedIssues = issuesResponse.data as Issue[]; // Storing fetched issues
            this.logger.log(2, "Fetched " + fetchedIssues.length + " closed issues on page " + page);
            if (fetchedIssues.length === 0) {
                moreIssues = false; // No more issues to fetch
            } else {
                closedIssues.push(...fetchedIssues); // Adding the issues to the list
                page++;
            }
        }

        this.logger.log(2, "Finished fetching closed issues. Total closed issues: " + closedIssues.length);

        // Now fetching open issues, similar to how closed issues are fetched
        page = 1;
        moreIssues = true;
        this.logger.log(2, "Fetching open issues since " + threeMonthsAgo.toISOString());
        while (moreIssues) {
            const issuesResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage,
                state: "open", // Getting open issues
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            this.logger.log(2, "Fetched " + fetchedIssues.length + " open issues on page " + page);
            if (fetchedIssues.length === 0) {
                moreIssues = false; // No more open issues
            } else {
                openIssues.push(...fetchedIssues); // Adding open issues to the list
                page++;
            }
        }

        this.logger.log(2, "Finished fetching open issues. Total open issues: " + openIssues.length);

        return { closedIssues, openIssues }; // Returning both closed and open issues
    }

    // Fetching contributors from GitHub using pagination
    private async fetchContributors(octokit: Octokit): Promise<Contributor[]> {
        const contributors: Contributor[] = [];
        let page = 1;
        const perPage = 50; // Setting number of contributors to fetch per page
        let moreContributors = true;

        this.logger.log(2, "Fetching contributors for repository: " + this.owner + "/" + this.repoName);
        
        // Fetching contributors in multiple pages
        while (moreContributors) {
            const contributorsResponse = await octokit.request("GET /repos/{owner}/{repo}/contributors", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage
            });

            const fetchedContributors = contributorsResponse.data as Contributor[]; // Storing fetched contributors
            this.logger.log(2, "Fetched " + fetchedContributors.length + " contributors on page " + page);
            if (fetchedContributors.length === 0) {
                moreContributors = false; // No more contributors to fetch
            } else {
                contributors.push(...fetchedContributors); // Adding contributors to the list
                page++;
            }
        }

        this.logger.log(2, "Finished fetching contributors. Total contributors: " + contributors.length);
        return contributors; // Returning all contributors
    }

    // Generating the repository URL
    public generateRepoUrl(username: string, repoName: string): string {
        this.logger.log(2, "Generating repository URL for username: " + username + ", repoName: " + repoName);
        if (!username || !repoName) return ""; // Returning empty string if either username or repoName is missing
        return "https://github.com/" + username + "/" + repoName; // Formatting GitHub URL
    }
}

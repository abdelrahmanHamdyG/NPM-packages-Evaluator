/* eslint-disable max-len */
import { Octokit } from "octokit";
import { GitHubData } from "./GitHubData.js";
import { API } from "./API.js";
import { Issue } from "./IssueInterface.js";
import { Contributor } from "./ContributorInterface.js";

export class GitHubAPI extends API {
    private owner: string;
    private repoName: string;

    constructor(owner: string, repoName: string) {
        super();
        this.owner = owner;
        this.repoName = repoName;
        this.logger.log(2, "GitHubAPI initialized for owner: " + this.owner + ", repo: " + this.repoName);
    }

    public async fetchData(): Promise<GitHubData> {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const start = performance.now();
        try {
            this.logger.log(2, "Fetching data for owner: " + this.owner + ", repo: " + this.repoName);

            // Initialize API requests
            this.logger.log(2, "Initializing API requests.");
            const reposRequest = octokit.request("GET /repos/{owner}/{repo}", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const commitsRequest = octokit.request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            // Fetch issues and contributors with pagination
            const issuesRequest = this.fetchIssues(octokit);
            const contributorsRequest = this.fetchContributors(octokit);

            const readmeRequest = octokit.request("GET /repos/{owner}/{repo}/readme", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            this.logger.log(2, "Awaiting responses from GitHub API requests.");
            // Wait for all data fetches to complete in parallel
            const [reposResponse, issuesResponse, commitsResponse, contributors, readmeResponse] = await Promise.all([
                reposRequest,
                issuesRequest,
                commitsRequest,
                contributorsRequest,
                readmeRequest.catch(() => null)
            ]);

            const closed_issues = issuesResponse.closedIssues;
            const openIssues = issuesResponse.openIssues;
            this.logger.log(2, "Fetched " + closed_issues.length + " closed issues and " + openIssues.length + " open issues.");

            // Process contributors data
            const totalContributions = (contributors as Contributor[]).map((contributor: Contributor) => ({
                contributor: contributor.login,
                // totalLinesAdded: contributor.total,
                commits: contributor.contributions
            }));
            this.logger.log(2, "Processed contributions from " + contributors.length + " contributors.");

            const readmeFound = !!readmeResponse;
            const descriptionFound = !!reposResponse.data.description;
            this.logger.log(2, "Readme found: " + readmeFound + ", Description found: " + descriptionFound);

            const license = reposResponse.data.license ? reposResponse.data.license.name : "empty";
            this.logger.log(2, "License: " + license);

            const end = performance.now();
            const latency = end - start;
            this.logger.log(2, "Data fetch latency: " + latency + " ms.");
            this.logger.log(2, "Successfully fetched data from GitHub API");

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
            return new GitHubData(); // Return empty data on error
        }
    }

    // Fetch issues with pagination
    private async fetchIssues(octokit: Octokit): Promise<{ closedIssues: Issue[], openIssues: Issue[] }> {
        const closedIssues: Issue[] = [];
        const openIssues: Issue[] = [];
        let page = 1;
        const perPage = 100;
        let moreIssues = true;

        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

        this.logger.log(2, "Fetching closed issues since " + threeMonthsAgo.toISOString());
        // Fetch closed issues
        while (moreIssues) {
            const issuesResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage,
                state: "closed",
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            this.logger.log(2, "Fetched " + fetchedIssues.length + " closed issues on page " + page);
            if (fetchedIssues.length === 0) {
                moreIssues = false;
            } else {
                closedIssues.push(...fetchedIssues);
                page++;
            }
        }
        this.logger.log(2, "Finished fetching closed issues. Total closed issues: " + closedIssues.length);

        // Reset page counter and fetch open issues
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
                state: "open", // Fetch open issues
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            this.logger.log(2, "Fetched " + fetchedIssues.length + " open issues on page " + page);
            if (fetchedIssues.length === 0) {
                moreIssues = false;
            } else {
                openIssues.push(...fetchedIssues);
                page++;
            }
        }
        this.logger.log(2, "Finished fetching open issues. Total open issues: " + openIssues.length);

        // Return both closed and open issues
        this.logger.log(2, "Returning fetched issues.");
        return { closedIssues, openIssues };
    }

    // Fetch contributors with pagination
    private async fetchContributors(octokit: Octokit): Promise<Contributor[]> {
        const contributors: Contributor[] = [];
        let page = 1;
        const perPage = 50;
        let moreContributors = true;

        this.logger.log(2, "Fetching contributors for repository: " + this.owner + "/" + this.repoName);
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

            const fetchedContributors = contributorsResponse.data as Contributor[];
            this.logger.log(2, "Fetched " + fetchedContributors.length + " contributors on page " + page);
            if (fetchedContributors.length === 0) {
                moreContributors = false;
            } else {
                contributors.push(...fetchedContributors);
                page++;
            }
        }
        this.logger.log(2, "Finished fetching contributors. Total contributors: " + contributors.length);
        this.logger.log(2, "Returning fetched contributors.");
        return contributors;
    }

    public generateRepoUrl(username: string, repoName: string): string {
        this.logger.log(2, "Generating repository URL for username: " + username + ", repoName: " + repoName);
        // Ensure the username and repoName are trimmed and not empty
        if (!username.trim() || !repoName.trim()) {
            this.logger.log(1, "Username and repository name cannot be empty.");
            throw new Error("Username and repository name cannot be empty.");
        }
        // Construct the GitHub repository URL
        const repoUrl = `https://github.com/${username}/${repoName}`;
        this.logger.log(2, "Generated repository URL: " + repoUrl);
        return repoUrl;
    }
}

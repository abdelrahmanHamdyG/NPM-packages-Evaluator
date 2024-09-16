export interface Contributor {
    login: string;        // Contributor's GitHub username
    id: number;          // Contributor's GitHub user ID
    avatar_url: string; // URL to the contributor's avatar image
    contributions: number; // Total number of contributions (commits) by the contributor
}

// Define an interface for 'Issue'
export interface Issue {
    id: number;           // Unique identifier for the issue
    created_at: string;   // Date when the issue was created
    closed_at: string;    // Date when the issue was closed
    title: string;        // Title of the issue
    body: string;         // Detailed description of the issue
}

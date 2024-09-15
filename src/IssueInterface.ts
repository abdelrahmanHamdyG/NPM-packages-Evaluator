export interface Issue {
    id: number;
    created_at: string; 
    closed_at?: string | null; 
    title: string;
    body: string;
}
// defining the contributor interface to represent contributors to a repository
export interface Contributor {
    login: string;       // username of the contributor
    id: number;          // unique id of the contributor
    avatar_url: string;  // url to the contributor's avatar image
    contributions: number; // number of contributions the contributor has made
}

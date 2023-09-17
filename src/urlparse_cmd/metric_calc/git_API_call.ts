import { Octokit } from "octokit";

// import { OctokitError } from '@octokit/types';

export class GithubAPIService {
    octokit: Octokit;
    owner: string;
    repo: string;


    constructor(owner: string, repo: string) {
        const gitkey = process.env.GITHUB_TOKEN;
        this.owner = owner;
        this.repo = repo;

        this.octokit = new Octokit({
            auth: gitkey
        });
    }
    async fetchAPIdata(feature: string) {
        try {
            const response = await this.octokit.request(`GET /repos/{owner}/{repo}/${feature}`, {
                owner: this.owner,
                repo: this.repo,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch contributors: ${error}`);
        }
    }


    // async getCodeOwnerShip() {

    // }
    // async fetchFrequencyOfContributors() {

    // }
    // async fetchNumStars() {

    // }
    // async fetchNumForks() {

    // }
    // async fetchBugReports() {

    // }
    // async fetchLicense() {

    // }
    // async fetchDocumentationData() {

    // }
    // async fetchSourceCodeData() {

    // }


}
import { Octokit } from "octokit";
// import { OctokitError } from '@octokit/types';
export class GithubAPIService {
    private octokit: Octokit;

    constructor() {
        const gitkey = process.env.GITHUB_TOKEN;

        this.octokit = new Octokit({
            auth: gitkey
        });
    }
    async fetchNumOfContributors(owner: string, repo: string) {
        try {
            const response = await this.octokit.rest.repos.listContributors({
                owner,
                repo,
            });
            return response.data.length;
        } catch (error) {
            throw new Error(`Failed to fetch contributors: ${error}`);
        }
    }

    async getCodeOwnerShip(owner: string, repo: string) {

    }
    async fetchFrequencyOfContributors(owner: string, repo: string) {

    }
    async fetchNumStars(owner: string, repo: string) {

    }
    async fetchNumForks(owner: string, repo: string) {

    }
    async fetchBugReports(owner: string, repo: string) {

    }
    async fetchLicense(owner: string, repo: string) {

    }
    async fetchDocumentationData(owner: string, repo: string) {

    }
    async fetcSourceCodeData(owner: string, repo: string) {

    }


}
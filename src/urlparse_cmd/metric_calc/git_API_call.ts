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

    async fetchNumOfContributors() {
        try {

            const response = await this.octokit.rest.repos.listContributors({
                owner: this.owner,
                repo: this.repo,
            });
            return response.data.length;

        } catch (error) {
            console.log(this.repo)
            throw new Error(`Failed to fetch contributors: ${error}`);

        }
    }

    async getCodeOwnerShip() {

    }
    async fetchFrequencyOfContributors() {

    }
    async fetchNumStars() {

    }
    async fetchNumForks() {

    }
    async fetchBugReports() {

    }
    async fetchLicense() {

    }
    async fetchDocumentationData() {

    }
    async fetchSourceCodeData() {

    }


}
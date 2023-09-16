import { GithubAPIService } from './git_API_Call';

export class Ramp_upCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    fetchRampUpScore(owner: string, repo: string): number {
        const documentation = this.githubAPI.fetchDocumentationData(owner, repo);
        const sourceCode = this.githubAPI.fetcSourceCodeData(owner, repo);
        const ratioDS = this.processDS(documentation, sourceCode);
    }

    processDS(documentation, sourceCode): number {
        return 0;

    }
}

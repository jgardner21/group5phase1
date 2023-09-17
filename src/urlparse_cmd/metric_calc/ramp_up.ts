import { GithubAPIService } from './git_API_call';

export class RampUpCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    // fetchRampUpScore(owner: string, repo: string): number {
    //     const documentation = this.githubAPI.fetchDocumentationData();
    //     const sourceCode = this.githubAPI.fetchSourceCodeData();
    //     const ratioDS = this.processDS(documentation, sourceCode);
    //     return 0;
    // }

    // processDS(documentation, sourceCode): number {
    //     return 0;
    // }
}

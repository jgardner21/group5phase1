import { GithubAPIService } from './git_API_Call';

export class Responsive_MaintainerCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    fetchRMScore(owner: string, repo: string): number {
        return 0;
    }
}

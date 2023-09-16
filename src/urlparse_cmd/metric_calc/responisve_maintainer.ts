import { GithubAPIService } from './git_API_call';

export class Responsive_MaintainerCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }


    calcPullResponseTime(): number {
        //We intended for this to share a class with the bus factor calculations
        //Because both required iterating through a history of pull requests
        //Not sure how you want to set that up, its up to you

        return -1;
    }

    calcIssueResponseTime(): number {
        //Same as above

        return -1;
    }   
}

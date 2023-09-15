import { GithubAPIService } from './git_API_Call';

export class BusFactorCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    fetchBusFactorScore(owner: string, repo: string): number {
        const contributors = this.processContributorNum(this.githubAPI.fetchNumOfContributors(owner, repo));
        const code_ownerShip = this.processOwnership(this.githubAPI.getCodeOwnerShip(owner, repo));
        const contributorFreq = this.processContributorList(this.githubAPI.fetchFrequencyOfContributors(owner, repo));
        //formula to calculate the BusFactor
        calculatedScore = processBusScore(contributors, code_ownerShip, contributorFreq);
        const calculatedScore;
    }

    //function to return a score from 1-5 depending on the contributors
    processContributorNum(contributorNum): number {
        return 0;

    }
    //function which would take the contributorList
    //and find frequencies of the contributors 
    //and return a number form 0 - 5.
    processContributorList(contributorData): number {
        return 0;

    }

    processOwnership(code_ownerShip_data): number {
        return 0;

    }

    processBusScore(contributors, code_ownerShip, contributorFreq): number {
        return 0;
    }
}

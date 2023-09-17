import { GithubAPIService } from './git_API_call';

export class BusFactorCalculator {
    
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    //Taylor: I think instead of having 1 function where we fetch all the values we need, we make each of these calls in individual functions

    // fetchBusFactorScore(): number {
    //     const contributors = this.processContributorNum(this.githubAPI.fetchNumOfContributors());
    //     const code_ownerShip = this.processOwnership(this.githubAPI.getCodeOwnerShip());
    //     const contributorFreq = this.processContributorList(this.githubAPI.fetchFrequencyOfContributors());
    //     //formula to calculate the BusFactor
    //     return this.processBusScore(contributors, code_ownerShip, contributorFreq);

    // }

    //function to return a score from 1-5 depending on the contributors
    calcContributorNum(): number {
        const contributors = this.githubAPI.fetchNumOfContributors();
        //fetch

        //process

        return -1; //Placeholders

    }
    //function which would take the contributorList
    //and find frequencies of the contributors 
    //and return a number form 0 - 5.
    calcContributorList(): number {
        const contributorFreq = this.githubAPI.fetchFrequencyOfContributors();
        //fetch

        //process

        return -1;

    }

    calcOwnership(): number {
        const code_ownership = this.githubAPI.getCodeOwnerShip();
        //fetch

        //process

        return -1;
    }

    //Need a function to calc frequency of 1 person's involvement with pull requests
    calcPullContributions(): number {
        //const pull_frequency = something API related

        //fetch

        //process

        return -1;
    }


    //Do the score calculation this in superclass instead

    // processBusScore(contributors, code_ownerShip, contributorFreq): number {
    //     return 0;
    // }
}

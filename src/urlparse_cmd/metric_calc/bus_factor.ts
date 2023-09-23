import { compileFunction } from 'vm';
import { GithubAPIService } from './git_API_call';

export class BusFactorCalculator {

    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }



    //function to return a score from 1-5 depending on the contributors
    async fetchContributors() {
        const contributors = this.githubAPI.fetchAPIdata('contributors');
        return contributors; //Placeholders

    }
    //function which would take the contributorList
    //and find frequencies of the contributors
    //and return a number form 0 - 1.
    async numContributors() {
        const contributors = await this.fetchContributors();
        return contributors.length / 30;
    }

    async calcContributorList() {
        const contributors = await this.fetchContributors();
        let contributorFreq: any = [];
        for (let i = 0; i < contributors.length; i++) {
            const contributionCount = contributors[i].contributions;
            contributorFreq.push(contributionCount);
        }
        const sum: any = contributorFreq.reduce((sum: number, num: number) => sum + num, 0);
        for (let j = 0; j < contributorFreq.length; j++) {
            contributorFreq[j] = (contributorFreq[j] / sum) * 100;
        }
        return contributorFreq;
    }

    // async calcGiniCoefficient(): Promise<number> {

    //     const contributorFreq = await this.calcContributorList();
    //     console.log(contributorFreq);
    //     const n = contributorFreq.length;
    //     let numerator = 0;
    //     let denominator = 0;
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             numerator += Math.abs(contributorFreq[i] - contributorFreq[j]);
    //             denominator += contributorFreq[i];
    //         }
    //     }
    //     console.log(numerator / (2 * denominator * n));
    //     return numerator / (2 * denominator * n);
    // }
    async calcConcentrationScore(): Promise<number> {
        const contributors = await this.fetchContributors();
        const totalContributions = contributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const topContributors = contributors.slice(0, 1); // consider the top 3 contributors
        const topContributions = topContributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const concentrationRatio = topContributions / totalContributions;
        if (concentrationRatio >= 0.5) {
            return 0; // few contributors have majority
        } else if (concentrationRatio >= 0.4) {
            return 0.2; // moderately distributed
        } else if (concentrationRatio >= 0.3) {
            return 0.4; // moderately distributed
        } else if (concentrationRatio >= 0.2) {
            return 0.7; // moderately distributed
        } else if (concentrationRatio >= 0.1) {
            return 0.9; // moderately distributed
        }
        else {
            return 1; // well distributed
        }
    }

    async fetchCodeOwners(): Promise<number> {
        const files = await this.githubAPI.fetchAPIdata('contents');
        // console.log(files);
        const codeOwnersFile = files.find((file: any) => file.filename === 'CODEOWNERS');
        if (codeOwnersFile) {
            // const codeOwnersContent = await this.githubAPI.fetchAPIdata(`contents/${codeOwnersFile.path}`);
            // const codeOwners = codeOwnersContent.split('\n').filter((line: string) => line.startsWith('*')).map((line: string) => line.substring(1).trim());
            return 1;
        } else {
            return 0;
        }
    }
    //Need a function to calc frequency of 1 person's involvement with pull requests

    async getPullNumbers(): Promise<number[]> {
        const pullRequests = await this.githubAPI.fetchAPIdata("pulls");
        const pullNumbers = pullRequests.map((pullRequest: any) => pullRequest.number);
        return pullNumbers;
    }

    async getPullRequestApprovers(pullNumber: number): Promise<string[]> {
        const reviews = await this.githubAPI.fetchAPIdata(`pulls/${pullNumber}/reviews`);
        const approvers = reviews.filter((review: any) => review.state === 'APPROVED').map((review: any) => review.user.login);
        return approvers;
    }

    async getPullRequestApproversForRepo(): Promise<Map<number, string[]>> {
        const pullNumbers = await this.getPullNumbers();
        const approversMap = new Map<number, string[]>();
        for (const pullNumber of pullNumbers) {
            const approvers = await this.getPullRequestApprovers(pullNumber);
            approversMap.set(pullNumber, approvers);
        }
        return approversMap;
    }


    //Do the score calculation this in superclass instead

    totalBusScore(contributors: number, contributor_freq: number, codeOwners: number): number {

        return 0.2 * contributors + 0.8 * contributor_freq + 0.2 * codeOwners; 

    }
}

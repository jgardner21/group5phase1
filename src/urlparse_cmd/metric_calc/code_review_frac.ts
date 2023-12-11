import { GithubAPIService } from './git_API_call';
import logger from '../../logger';

export class CodeReviewFractionCalculator {

    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    /**
     * Fetches pull requests data from the GitHub API.
     * @returns {Promise<any>} A promise that resolves with the pull requests data.
     */
    async fetchPullRequests() {
        try {
            const pullRequests = await this.githubAPI.fetchAPIdata('pulls');
            return pullRequests;
        } catch (error) {
            logger.error(`Error fetching pull requests: ${error}`);
            return [];
        }
    }

    /**
     * Calculates the fraction of project code introduced through pull requests with code reviews.
     * @returns {Promise<number>} The fraction of project code.
     */
    async calcCodeReviewFraction(): Promise<number> {
        try {
            const pullRequests = await this.fetchPullRequests();

            // Filter pull requests with code reviews
            const reviewedPullRequests = pullRequests.filter((pr: any) => pr.review_comments > 0);

            // Calculate the total lines of code introduced through reviewed pull requests
            const totalReviewedCode = reviewedPullRequests.reduce((sum: number, pr: any) => sum + pr.additions + pr.deletions, 0);

            // Calculate the total lines of code introduced in all pull requests
            const totalCode = pullRequests.reduce((sum: number, pr: any) => sum + pr.additions + pr.deletions, 0);

            // Calculate the fraction of project code introduced through pull requests with code reviews
            const codeReviewFraction = totalReviewedCode / totalCode;

            return codeReviewFraction;
        } catch (error) {
            logger.error(`Error calculating code review fraction: ${error}`);
            return -1;
        }
    }

    /**
     * Calculates the total code review score based on the fraction of project code introduced through pull requests with code reviews.
     * @param codeReviewFraction The fraction of project code introduced through pull requests with code reviews.
     * @returns {number} The total code review score.
     */
    totalCodeReviewScore(codeReviewFraction: number): number {
        logger.info("Successfully calculated code review score");
        // You can customize the weights based on your specific criteria
        return codeReviewFraction;
    }
}

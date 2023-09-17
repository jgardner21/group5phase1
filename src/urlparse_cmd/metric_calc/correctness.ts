import { GithubAPIService } from './git_API_call';

export class CorrectnessCalculator {
    private githubAPI: GithubAPIService;


    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    //Taylor: I think instead of having 1 function where we fetch all the values we need, we make each of these calls in individual functions

    // fetchCorrectnessScore(owner: string, repo: string): number {
    //     const num_stars = this.processNumStars(this.githubAPI.fetchNumStars());
    //     const num_forks = this.processNumForks(this.githubAPI.fetchNumForks());
    //     const bug_reports = this.processBugReports(this.githubAPI.fetchBugReports());
    //     const calculateOverallScore = this.calculateOverallScore(num_stars, num_forks, bug_reports);
    //     return 0;
    // }

    calcNumStars(): number {
        const num_stars = this.githubAPI.fetchNumStars();
        //fetch

        //process

        return -1;

    }

    calcNumForks(): number {
        const num_forks = this.githubAPI.fetchNumForks();
        //fetch

        //processs

        return -1;
    }

    calcBugReports(): number {
        const bug_reports = this.githubAPI.fetchBugReports();
        //fetch

        //process

        return -1;
    }


}

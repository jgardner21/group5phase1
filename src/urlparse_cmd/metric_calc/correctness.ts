import { GithubAPIService } from './git_API_call';

export class CorrectnessCalculator {
    private githubAPI: GithubAPIService;
    private num_stars: number;
    private num_forks: number;

    constructor(githubAPI: GithubAPIService, repo_obj: any) {
        this.githubAPI = githubAPI;
        this.num_stars = repo_obj.stargazers_count;
        this.num_forks = repo_obj.forks;
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
        //const data = this.githubAPI.fetchAPIdata('stars');
        //fetch
        //const num_stars = data.length;
        //process

        return -1;

    }

    calcNumForks(): number {
        //const data = this.githubAPI.fetchAPIdata('forks');
        //fetch
        //const num_forks = data.length;
        //processs

        return -1;
    }

    calcBugReports(): number {
        //const data = this.githubAPI.fetchAPIdata('issues');
        //fetch
        //const bug_report = data.length;
        //process

        return -1;
    }

    totalCorrectnessScore(num_stars: number, num_forks: number, bug_reports: number): number {

        return num_stars + num_forks + bug_reports;  //Not our actual calculation method just using it as a placeholder
    }
}

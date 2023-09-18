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
        //Idea: If a repo has barely any users (no stars or forks) it has held to basically no standard of correctness because nobody is using it
        //Past a certain point (~800 stars) enough eyes are on the project that it is probably guaranteed to be held to a good standard of correctness
        
        //Ideally, we would like to scale forks and stars relative to the number of users of the repo. Even better would be to implement the number of users directly into our formula
        //However, we don't have a good way of getting that information quite yet, so this implementation will be our solution for now

        //Proposed star benchmarks:

        //0.
        //0.1: 10 stars
        //0.2: 20 stars
        //0.3: 35
        //0.4: 50
        //0.5: 75
        //0.6: 100
        //0.7: 200
        //0.8: 300
        //0.9: 500
        //1.0: 750

        //Proposed stars formula: ln(num stars/6) * 2/10 (derived experimentally by observing a curve for what fit best)
        //Proposed forks formula: logbase2(num forks/10) * 2/10
        //May just not use number of forks


        if (this.num_stars < 5) {
            return 0;
        }
        else if (this.num_stars > 800 || this.num_forks > 250) {
            return 1;
        }
        else {
            return Math.max((Math.log(this.num_stars / 6) * (1/5)), Math.log2(this.num_forks / 10) * (1/5)) //Returns the best indicator between these 2
        }

        //return num_stars + num_forks + bug_reports;  //Not our actual calculation method just using it as a placeholder
    }
}

import { GithubAPIService } from './git_API_call';

export class CorrectnessCalculator {
    private githubAPI: GithubAPIService;
    private num_stars: number;
    private num_forks: number;

    constructor(githubAPI: GithubAPIService, repo_obj: any) {
        this.githubAPI = githubAPI;
        this.num_stars = repo_obj.stargazers_count; //This is the same as the number of stars
        this.num_forks = repo_obj.forks;
    }


    totalCorrectnessScore(): number {
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

        //Proposed stars formula: ln(num stars/6) * 2/10
        //Proposed forks formula: logbase2(num forks/10) * 2/10
        //Derived by experimenting with graphs until I found one that fit relatively well

        console.log("Successfully calculated correctness score")
        if (this.num_stars < 5) {
            return 0;
        }
        else if (this.num_stars > 800 || this.num_forks > 250) {
            return 1;
        }
        else {
            return Math.max((Math.log(this.num_stars / 6) * (1/5)), Math.log2(this.num_forks / 10) * (1/5)) //Returns the best indicator between these 2
        }

    }
}

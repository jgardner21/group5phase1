import { Octokit } from "octokit";

export class GithubAPIService {
    octokit: Octokit;
    owner: string;
    repo: string;


    constructor(owner: string, repo: string) {
        const gitkey = process.env.GITHUB_TOKEN; //Gets the GitHub token from the environment variable file
        this.owner = owner;
        this.repo = repo;

        this.octokit = new Octokit({ //Initializes our API caller 
            auth: gitkey
        });
    }
    async fetchAPIdata(feature: string) {
        if(feature == '') { //To get the big repo object, we just do get /repos/owner/repo
            try {
                const response = await this.octokit.request(`GET /repos/{owner}/{repo}`, { //Need this seperate because it doesn't have the slash at the end
                    owner: this.owner,
                    repo: this.repo,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                return response.data;
            }
            catch (error) {
                console.error(`Attempted to call general repo endpoint`)
                throw new Error(`Failed to get repo from GitHub API: ${error}`);
            }
        }
        else {

            try {
                const response = await this.octokit.request(`GET /repos/{owner}/{repo}/${feature}`, {
                    owner: this.owner,
                    repo: this.repo,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                return response.data;

            }
            catch (error) {
                console.error(`Attempted to call ${feature} endpoint`)
                throw new Error(`Failed to fetch contributors: ${error}`);
            }

        }


    }
}
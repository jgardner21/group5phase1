import { Octokit } from "octokit";

// import { OctokitError } from '@octokit/types';

export class GithubAPIService {
    octokit: Octokit;
    owner: string;
    repo: string;


    constructor(owner: string, repo: string) {
        const gitkey = process.env.GITHUB_TOKEN;
        this.owner = owner;
        this.repo = repo;

        this.octokit = new Octokit({
            auth: gitkey
        });
    }
    async fetchAPIdata(feature: string) {
        if(feature == '') { //To get the big repo object, we just do get /repos/owner/repo
            try {
                const response = await this.octokit.request(`GET /repos/{owner}/{repo}`, {
                    owner: this.owner,
                    repo: this.repo,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                return response.data;
            }
            catch (error) {
                console.log(this.owner + "/" + this.repo)
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
                console.log(`Attempted to call ${feature} endpoint`)
                console.log(this.owner + "/" + this.repo)
                throw new Error(`Failed to fetch contributors: ${error}`);
            }

        }


    }



}
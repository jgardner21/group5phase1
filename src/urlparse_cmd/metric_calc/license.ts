import { GithubAPIService } from './git_API_call';
import { cloneRepoLocally } from './local_clone';

export class LicenseCalculator {
    private githubAPI: GithubAPIService;
    private url: string
    private pkg_name: string

    constructor(githubAPI: GithubAPIService, url: string, pkg_name: string) {
        this.githubAPI = githubAPI;
        this.url = url
        this.pkg_name = pkg_name
    }

    // fetchLicenseScore(): number {
    //     const licenseScore = this.processLicenseScore(this.githubAPI.fetchLicense());
    //     const overallLicenseScore = this.calculateOverallScore(licenseScore);
    //     return overallLicenseScore;
    // }

    async getPkgLicense() { //Don't know what type this would return

        //Plan:
        //Check the repo object
        //If its not in there, clone it and check the package.json
        //If that doesn't work either MAYBE try to find a license file in the repo
        //Or just give up
    
        const acme_license = 'LGPL-2.1-only'
        await cloneRepoLocally(this.url, this.pkg_name)
        // pkg_license = pkg_license.license.spdx_id;

        return -1;
    }

    checkCompatability(): number { //Don't think we need a API call for this, there's probably a library that does this
        //Checks compability between our license and the pkg license

        //This should have 2 parameters (the two licenses)

        return 1;
    }
}

import { GithubAPIService } from './git_API_call';
import { cloneRepoLocally } from './local_clone';

export class LicenseCalculator {
    private githubAPI: GithubAPIService;
    private url: string

    constructor(githubAPI: GithubAPIService, url: string) {
        this.githubAPI = githubAPI;
        this.url = url
    }

    // fetchLicenseScore(): number {
    //     const licenseScore = this.processLicenseScore(this.githubAPI.fetchLicense());
    //     const overallLicenseScore = this.calculateOverallScore(licenseScore);
    //     return overallLicenseScore;
    // }

    getPkgLicense() { //Don't know what type this would return
        const acme_license = 'LGPL-2.1-only'
        const clone_path = cloneRepoLocally(this.url)
        // pkg_license = pkg_license.license.spdx_id;
        console.log(clone_path)
        return -1;
    }

    checkCompatability(): number { //Don't think we need a API call for this, there's probably a library that does this
        //Checks compability between our license and the pkg license

        //This should have 2 parameters (the two licenses)

        return 1;
    }
}

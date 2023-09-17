import { GithubAPIService } from './git_API_call';

export class LicenseCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    // fetchLicenseScore(): number {
    //     const licenseScore = this.processLicenseScore(this.githubAPI.fetchLicense());
    //     const overallLicenseScore = this.calculateOverallScore(licenseScore);
    //     return overallLicenseScore;
    // }

    getPkgLicense() { //Don't know what type this would return
        const acme_license = 'LGPL-2.1-only'

        // pkg_license = pkg_license.license.spdx_id;

        return -1;
    }

    checkCompatability(): number { //Don't think we need a API call for this, there's probably a library that does this
        //Checks compability between our license and the pkg license

        //This should have 2 parameters (the two licenses)

        return 1;
    }
}

import { LicenseCalculator } from '../urlparse_cmd/metric_calc/license';
import logger from '../logger';

describe('LicenseCalculator', () => {
    let licenseCalculator: LicenseCalculator;

    beforeEach(() => {
        const repo_obj = {
            license: {
                spdx_id: 'MIT',
            },
        };
        licenseCalculator = new LicenseCalculator(repo_obj);
    });

    describe('getPkgLicense', () => {
        it('should return the license from packageJSON if it exists', () => {
            const packageJSON = {
                license: 'MIT',
            };
            const result = licenseCalculator.getPkgLicense(packageJSON);
            expect(result).toEqual('MIT');
            expect(logger.debug).toHaveBeenCalledWith('Successfully retrieved license from the package.json file');
        });

        it('should return the license from the repo_obj if it exists and spdx_id is not NOASSERTION', () => {
            const packageJSON = {};
            const result = licenseCalculator.getPkgLicense(packageJSON);
            expect(result).toEqual('MIT');
            expect(logger.debug).toHaveBeenCalledWith('Successfully retrieved license from the GitHub API');
        });

        it('should return an empty string if a valid license cannot be found', () => {
            const packageJSON = {};
            const repo_obj = {
                license: {
                    spdx_id: 'NOASSERTION',
                },
            };
            licenseCalculator = new LicenseCalculator(repo_obj);
            const result = licenseCalculator.getPkgLicense(packageJSON);
            expect(result).toEqual('');
            expect(logger.error).toHaveBeenCalledWith('Failed to find valid license for package');
        });
    });

    describe('checkCompatability', () => {
        it('should return 1 if the pkg_license is compatible with our license', () => {
            const pkg_license = 'MIT';
            const result = licenseCalculator.checkCompatability(pkg_license);
            expect(result).toEqual(1);
            expect(logger.info).toHaveBeenCalledWith('Successfully calculated license score');
        });

        it('should return 0 if the pkg_license is not compatible with our license', () => {
            const pkg_license = 'GPL-3.0';
            const result = licenseCalculator.checkCompatability(pkg_license);
            expect(result).toEqual(0);
            expect(logger.info).toHaveBeenCalledWith('Successfully calculated license score');
        });
    });
});

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

        it('should return the license if a valid license can be found', () => {
            const packageJSON = { license: 'MIT' };
          
            // Mock the logger.debug method
            const debugSpy = jest.spyOn(logger, 'debug');
          
            const result = licenseCalculator.getPkgLicense(packageJSON);
          
            expect(result).toEqual('MIT');
          
            // Verify that logger.debug was called with the expected message
            expect(debugSpy).toHaveBeenCalledWith('Successfully retrieved license from the package.json file');
          
            // Restore the original logger.debug method after the test
            debugSpy.mockRestore();
          });

    });
});

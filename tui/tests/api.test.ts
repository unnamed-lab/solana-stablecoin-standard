import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

describe('TUI API', () => {
    let sandbox: sinon.SinonSandbox;
    let mockAxios: any;
    let api: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockAxios = {
            get: sandbox.stub(),
        };
        api = proxyquire('./api', {
            'axios': mockAxios
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('fetchTokenData', () => {
        it('should fetch data for a specific mint', async () => {
            const mockData = { name: 'Test Token', symbol: 'TST' };
            mockAxios.get.resolves({ data: mockData });

            const data = await api.fetchTokenData('mint123');

            expect(data).to.deep.equal(mockData);
            expect(mockAxios.get.calledWith(sinon.match('/tokens/mint123'))).to.be.true;
        });

        it('should handle API errors', async () => {
            mockAxios.get.rejects(new Error('API Error'));

            try {
                await api.fetchTokenData('mint123');
                expect.fail('Should have thrown an error');
            } catch (err: any) {
                expect(err.message).to.equal('API Error');
            }
        });
    });

    describe('fetchAllTokens', () => {
        it('should fetch list of all tokens', async () => {
            const mockTokens = [{ mint: '1' }, { mint: '2' }];
            mockAxios.get.resolves({ data: mockTokens });

            const tokens = await api.fetchAllTokens();

            expect(tokens).to.deep.equal(mockTokens);
            expect(mockAxios.get.calledWith(sinon.match('/tokens'))).to.be.true;
        });
    });
});


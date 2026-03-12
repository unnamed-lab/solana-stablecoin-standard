import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import * as path from 'path';

describe('config', () => {
    let sandbox: sinon.SinonSandbox;
    let configModule: any;
    let mockFs: any;
    let mockOs: any;

    const mockHome = '/home/user';
    const mockConfigDir = path.join(mockHome, '.sss');
    const mockConfigFile = path.join(mockConfigDir, 'config.json');

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockFs = {
            existsSync: sandbox.stub(),
            mkdirSync: sandbox.stub(),
            writeFileSync: sandbox.stub(),
            readFileSync: sandbox.stub(),
        };
        mockOs = {
            homedir: sandbox.stub().returns(mockHome),
        };

        configModule = proxyquire('./config', {
            fs: mockFs,
            os: mockOs,
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('loadConfig', () => {
        it('should create config folder and file if they dont exist', () => {
            mockFs.existsSync.returns(false);
            mockFs.readFileSync.returns(JSON.stringify({ activeToken: '', tokens: {} }));

            configModule.loadConfig();

            expect(mockFs.mkdirSync.calledWith(mockConfigDir, { recursive: true })).to.be.true;
            expect(mockFs.writeFileSync.calledWith(mockConfigFile, sinon.match.string)).to.be.true;
        });

        it('should return parsed config if it exists', () => {
            mockFs.existsSync.returns(true);
            const mockConfig = { activeToken: 'mint123', tokens: {} };
            mockFs.readFileSync.returns(JSON.stringify(mockConfig));

            const config = configModule.loadConfig();

            expect(config).to.deep.equal(mockConfig);
            expect(mockFs.readFileSync.calledWith(mockConfigFile, 'utf-8')).to.be.true;
        });
    });

    describe('saveToken', () => {
        it('should add a token to the config', () => {
            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns(JSON.stringify({ activeToken: '', tokens: {} }));

            const mockToken: any = {
                name: 'Test',
                symbol: 'TST',
                mintAddress: 'mint123',
            };

            configModule.saveToken('mint123', mockToken);

            expect(mockFs.writeFileSync.calledWith(
                mockConfigFile,
                sinon.match(/"mint123"/)
            )).to.be.true;
        });
    });

    describe('getActiveToken', () => {
        it('should throw if no active token is set', () => {
            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns(JSON.stringify({ activeToken: '', tokens: {} }));

            expect(() => configModule.getActiveToken()).to.throw('No active token set...');
        });

        it('should return the active token', () => {
            mockFs.existsSync.returns(true);
            const mockToken = { mintAddress: 'mint123' };
            mockFs.readFileSync.returns(JSON.stringify({
                activeToken: 'mint123',
                tokens: { 'mint123': mockToken }
            }));

            const token = configModule.getActiveToken();
            expect(token).to.deep.equal(mockToken);
        });
    });

    describe('resolveMint', () => {
        it('should return the provided mint if present', () => {
            expect(configModule.resolveMint('explicitMint')).to.equal('explicitMint');
        });

        it('should fall back to active token if no mint is provided', () => {
            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns(JSON.stringify({
                activeToken: 'activeMint',
                tokens: { 'activeMint': { mintAddress: 'activeMint' } }
            }));

            expect(configModule.resolveMint()).to.equal('activeMint');
        });
    });
});

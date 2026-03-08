import { expect } from 'chai';
import sinon from 'sinon';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, saveToken, getActiveToken, setActiveToken, resolveMint } from './config';

describe('config', () => {
    let sandbox: sinon.SinonSandbox;
    const mockHome = '/home/user';
    const mockConfigDir = path.join(mockHome, '.sss');
    const mockConfigFile = path.join(mockConfigDir, 'config.json');

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(os, 'homedir').returns(mockHome);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('loadConfig', () => {
        it('should create config folder and file if they dont exist', () => {
            sandbox.stub(fs, 'existsSync').returns(false);
            sandbox.stub(fs, 'mkdirSync');
            sandbox.stub(fs, 'writeFileSync');
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({ activeToken: '', tokens: {} }));

            loadConfig();

            expect((fs.mkdirSync as sinon.SinonStub).calledWith(mockConfigDir, { recursive: true })).to.be.true;
            expect((fs.writeFileSync as sinon.SinonStub).calledWith(mockConfigFile, sinon.match.string)).to.be.true;
        });

        it('should return parsed config if it exists', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockConfig = { activeToken: 'mint123', tokens: {} };
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(mockConfig));

            const config = loadConfig();

            expect(config).to.deep.equal(mockConfig);
            expect((fs.readFileSync as sinon.SinonStub).calledWith(mockConfigFile, 'utf-8')).to.be.true;
        });
    });

    describe('saveToken', () => {
        it('should add a token to the config', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({ activeToken: '', tokens: {} }));
            sandbox.stub(fs, 'writeFileSync');

            const mockToken: any = {
                name: 'Test',
                symbol: 'TST',
                mintAddress: 'mint123',
            };

            saveToken('mint123', mockToken);

            expect((fs.writeFileSync as sinon.SinonStub).calledWith(
                mockConfigFile,
                sinon.match(/"mint123"/)
            )).to.be.true;
        });
    });

    describe('getActiveToken', () => {
        it('should throw if no active token is set', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({ activeToken: '', tokens: {} }));

            expect(() => getActiveToken()).to.throw('No active token set...');
        });

        it('should return the active token', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockToken = { mintAddress: 'mint123' };
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
                activeToken: 'mint123',
                tokens: { 'mint123': mockToken }
            }));

            const token = getActiveToken();
            expect(token).to.deep.equal(mockToken);
        });
    });

    describe('resolveMint', () => {
        it('should return the provided mint if present', () => {
            expect(resolveMint('explicitMint')).to.equal('explicitMint');
        });

        it('should fall back to active token if no mint is provided', () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify({
                activeToken: 'activeMint',
                tokens: { 'activeMint': { mintAddress: 'activeMint' } }
            }));

            expect(resolveMint()).to.equal('activeMint');
        });
    });
});

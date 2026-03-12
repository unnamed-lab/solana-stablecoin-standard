import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { Keypair } from '@solana/web3.js';
import chalk from 'chalk';
import * as path from 'path';

describe('utils', () => {
    let sandbox: sinon.SinonSandbox;
    let utilsApi: any;
    let mockFs: any;
    let mockOs: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockFs = {
            existsSync: sandbox.stub(),
            readFileSync: sandbox.stub(),
        };
        mockOs = {
            homedir: sandbox.stub(),
        };
        utilsApi = proxyquire('./utils', {
            fs: mockFs,
            os: mockOs,
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getDefaultKeypairPath', () => {
        it('should return the correct home-relative path', () => {
            mockOs.homedir.returns('/home/user');
            expect(utilsApi.getDefaultKeypairPath()).to.contain(path.join('.config', 'solana', 'id.json'));
        });
    });

    describe('formatTxSig', () => {
        it('should shorten the signature', () => {
            const sig = '5G87v2X7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v8';
            const formatted = utilsApi.formatTxSig(sig);
            expect(formatted).to.contain('5G87v2X7');
            expect(formatted).to.contain('7vX7v8');
        });
    });

    describe('formatPubkey', () => {
        it('should shorten long pubkeys', () => {
            const pubkey = 'SSS1234567890123456789012345678901234567890';
            const formatted = utilsApi.formatPubkey(pubkey);
            expect(formatted).to.contain('SSS123');
            expect(formatted).to.contain('7890');
        });

        it('should not shorten short strings', () => {
            const short = 'short';
            const formatted = utilsApi.formatPubkey(short);
            expect(formatted).to.contain(short);
        });
    });

    describe('loadKeypair', () => {
        it('should load a keypair from a valid file', () => {
            const mockPath = '/path/to/key.json';
            const mockKeyData = [1, 2, 3];
            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns(JSON.stringify(mockKeyData));
            const fromSecretKeyStub = sandbox.stub(Keypair, 'fromSecretKey');

            utilsApi.loadKeypair(mockPath);

            expect(mockFs.readFileSync.calledWith(sinon.match(/key.json/), 'utf-8')).to.be.true;
        });

        it('should handle tilde expansion', () => {
            mockOs.homedir.returns('/home/user');
            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns('[1,2,3]');
            sandbox.stub(Keypair, 'fromSecretKey');

            utilsApi.loadKeypair('~/key.json');

            expect(mockFs.readFileSync.calledWith(sinon.match(/\/home\/user\/key.json/), 'utf-8')).to.be.true;
        });
    });
});

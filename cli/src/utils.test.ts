import { expect } from 'chai';
import sinon from 'sinon';
import * as fs from 'fs';
import * as os from 'os';
import { loadKeypair, getDefaultKeypairPath, formatTxSig, formatPubkey } from './utils';
import { Keypair } from '@solana/web3.js';
import chalk from 'chalk';

describe('utils', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getDefaultKeypairPath', () => {
        it('should return the correct home-relative path', () => {
            sandbox.stub(os, 'homedir').returns('/home/user');
            expect(getDefaultKeypairPath()).to.contain('.config/solana/id.json');
        });
    });

    describe('formatTxSig', () => {
        it('should shorten the signature', () => {
            const sig = '5G87v2X7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v87vX7v8';
            const formatted = formatTxSig(sig);
            expect(formatted).to.contain('5G87v2X7');
            expect(formatted).to.contain('v87vX7');
        });
    });

    describe('formatPubkey', () => {
        it('should shorten long pubkeys', () => {
            const pubkey = 'SSS1234567890123456789012345678901234567890';
            const formatted = formatPubkey(pubkey);
            expect(formatted).to.contain('SSS123');
            expect(formatted).to.contain('7890');
        });

        it('should not shorten short strings', () => {
            const short = 'short';
            const formatted = formatPubkey(short);
            expect(formatted).to.contain(short);
        });
    });

    describe('loadKeypair', () => {
        it('should load a keypair from a valid file', () => {
            const mockPath = '/path/to/key.json';
            const mockKeyData = [1, 2, 3];
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(mockKeyData));
            const fromSecretKeyStub = sandbox.stub(Keypair, 'fromSecretKey');

            loadKeypair(mockPath);

            expect((fs.readFileSync as sinon.SinonStub).calledWith(sinon.match(/key.json/), 'utf-8')).to.be.true;
        });

        it('should handle tilde expansion', () => {
            sandbox.stub(os, 'homedir').returns('/home/user');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns('[1,2,3]');
            sandbox.stub(Keypair, 'fromSecretKey');

            loadKeypair('~/key.json');

            expect((fs.readFileSync as sinon.SinonStub).calledWith(sinon.match(/\/home\/user\/key.json/), 'utf-8')).to.be.true;
        });
    });
});

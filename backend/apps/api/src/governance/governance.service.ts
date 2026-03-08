import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { BlockchainService, SdkService } from '@app/blockchain';
import { ProposeActionDto, ApproveProposalDto } from './dto/governance.dto';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

@Injectable()
export class GovernanceService {
    private readonly logger = new Logger(GovernanceService.name);

    constructor(
        private readonly blockchainService: BlockchainService,
        private readonly sdkService: SdkService,
    ) { }

    async proposeAction(dto: ProposeActionDto): Promise<{ success: boolean; txSignature: string }> {
        try {
            const sdk = await this.sdkService.getSdk();
            const proposer = this.sdkService.decodeKeypair(dto.proposerKeypair);

            let actionPayload;
            switch (dto.actionType) {
                case 'MintTo':
                    if (!dto.params.amount || !dto.params.to) throw new Error('Missing amount or to address');
                    actionPayload = { mintTo: { amount: new BN(dto.params.amount), to: new PublicKey(dto.params.to) } };
                    break;
                case 'Seize':
                    if (!dto.params.amount || !dto.params.from || !dto.params.to) throw new Error('Missing params');
                    actionPayload = { seize: { amount: new BN(dto.params.amount), from: new PublicKey(dto.params.from), to: new PublicKey(dto.params.to) } };
                    break;
                case 'UpdateRoles':
                    actionPayload = {
                        updateRoles: {
                            newMasterAuthority: dto.params.newMasterAuthority ? new PublicKey(dto.params.newMasterAuthority) : null,
                            newPauser: dto.params.newPauser ? new PublicKey(dto.params.newPauser) : null,
                            newMinterAuthority: dto.params.newMinterAuthority ? new PublicKey(dto.params.newMinterAuthority) : null,
                            newBurner: dto.params.newBurner ? new PublicKey(dto.params.newBurner) : null,
                            newBlacklister: dto.params.newBlacklister ? new PublicKey(dto.params.newBlacklister) : null,
                            newSeizer: dto.params.newSeizer ? new PublicKey(dto.params.newSeizer) : null,
                            newHookAuthority: dto.params.newHookAuthority ? new PublicKey(dto.params.newHookAuthority) : null,
                        }
                    };
                    break;
                case 'DelegateToDao':
                    if (!dto.params.programId) throw new Error('Missing programId');
                    actionPayload = { delegateToDao: { programId: new PublicKey(dto.params.programId) } };
                    break;
                default:
                    throw new HttpException('Invalid actionType', HttpStatus.BAD_REQUEST);
            }

            const txSignature = await sdk.createProposal({
                proposer,
                action: actionPayload,
            });

            return { success: true, txSignature };
        } catch (e: any) {
            this.logger.error(e.message);
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async approveProposal(proposalId: string, dto: ApproveProposalDto): Promise<{ success: boolean; txSignature: string }> {
        try {
            const sdk = await this.sdkService.getSdk();
            const approver = this.sdkService.decodeKeypair(dto.signerKeypair);

            const proposalAccountAddress = new PublicKey(proposalId);

            const txSignature = await sdk.approveProposal({
                approver,
                proposalParams: {
                    proposalAddress: proposalAccountAddress
                }
            });

            return { success: true, txSignature };
        } catch (e: any) {
            this.logger.error(e.message);
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProposals(): Promise<any[]> {
        try {
            const sdk = await this.sdkService.getSdk();
            const proposals = await sdk.getProposals();
            return proposals.map(p => ({
                id: p.publicKey.toBase58(),
                status: p.account.status,
                proposedAt: p.account.proposedAt.toNumber(),
                approvals: p.account.approvals.map((a: PublicKey) => a.toBase58()),
            }));
        } catch (e: any) {
            this.logger.error(e.message);
            return [];
        }
    }
}

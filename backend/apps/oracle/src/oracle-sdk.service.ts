import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OracleModule as SdkOracleModule, SolanaNetwork } from '@stbr/sss-token';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class OracleSdkService implements OnModuleInit {
  private readonly logger = new Logger(OracleSdkService.name);
  private _oracle: SdkOracleModule;
  private readonly _oracleProgramId: PublicKey;

  constructor(private configService: ConfigService) {
    const programIdStr = this.configService.get<string>(
      'ORACLE_PROGRAM_ID',
      '2xURAwT76NVPygL33qSAWjN2sEadLuuxiWABsGzUHsqo', // default devnet key
    );
    this._oracleProgramId = new PublicKey(programIdStr);
  }

  onModuleInit() {
    const networkName = this.configService.get<string>('SOLANA_NETWORK', 'devnet');
    
    let network: SolanaNetwork;
    switch (networkName.toLowerCase()) {
      case 'mainnet':
      case 'mainnet-beta':
        network = SolanaNetwork.MAINNET;
        break;
      case 'testnet':
        network = SolanaNetwork.TESTNET;
        break;
      case 'localnet':
      case 'localhost':
        network = SolanaNetwork.LOCALNET;
        break;
      case 'devnet':
      default:
        network = SolanaNetwork.DEVNET;
        break;
    }

    this.logger.log(`Initializing SSS Oracle SDK on ${network}...`);
    this._oracle = new SdkOracleModule(network);
  }

  get oracle(): SdkOracleModule {
    if (!this._oracle) {
      throw new Error('Oracle SDK not initialized');
    }
    return this._oracle;
  }

  get programId(): PublicKey {
    return this._oracleProgramId;
  }
}

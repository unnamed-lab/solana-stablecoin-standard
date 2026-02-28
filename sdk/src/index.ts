export * from './types';
export * from './errors';
export * from './SolanaStablecoin';
export * from './modules/compliance';
export * from './modules/transfer-hook';
export * from './modules/oracle';

// Export IDLs for consumption by clients
import * as CoreIdl from './idl/sss_core.json';
import * as TransferHookIdl from './idl/sss_transfer_hook.json';
import * as OracleIdl from './idl/sss_oracle.json';

export { CoreIdl, TransferHookIdl, OracleIdl };

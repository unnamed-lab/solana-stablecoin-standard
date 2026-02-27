export * from './types';
export * from './errors';
export * from './SolanaStablecoin';
export * from './modules/compliance';
export * from './modules/transfer-hook';

// Export IDLs for consumption by clients
import * as CoreIdl from './idl/sss_core.json';
import * as TransferHookIdl from './idl/sss_transfer_hook.json';

export { CoreIdl, TransferHookIdl };

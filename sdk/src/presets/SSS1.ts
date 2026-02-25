import { CreateStablecoinConfig, StablecoinPreset } from '../types';

export const defineSss1Config = (config: Omit<CreateStablecoinConfig, 'preset'>): CreateStablecoinConfig => {
    return {
        ...config,
        preset: StablecoinPreset.SSS_1,
        extensions: {
            permanentDelegate: false,
            transferHook: false,
            defaultAccountFrozen: false,
        }
    };
};

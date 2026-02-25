import { CreateStablecoinConfig, StablecoinPreset } from '../types';

export const defineSss2Config = (config: Omit<CreateStablecoinConfig, 'preset'>): CreateStablecoinConfig => {
    return {
        ...config,
        preset: StablecoinPreset.SSS_2,
        extensions: {
            permanentDelegate: true,
            transferHook: true,
            defaultAccountFrozen: true,
        }
    };
};

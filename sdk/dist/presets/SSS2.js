"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineSss2Config = void 0;
const types_1 = require("../types");
const defineSss2Config = (config) => {
    return {
        ...config,
        preset: types_1.StablecoinPreset.SSS_2,
        extensions: {
            permanentDelegate: true,
            transferHook: true,
            defaultAccountFrozen: true,
        }
    };
};
exports.defineSss2Config = defineSss2Config;
//# sourceMappingURL=SSS2.js.map
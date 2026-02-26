"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineSss1Config = void 0;
const types_1 = require("../types");
const defineSss1Config = (config) => {
    return {
        ...config,
        preset: types_1.StablecoinPreset.SSS_1,
        extensions: {
            permanentDelegate: false,
            transferHook: false,
            defaultAccountFrozen: false,
        }
    };
};
exports.defineSss1Config = defineSss1Config;
//# sourceMappingURL=SSS1.js.map
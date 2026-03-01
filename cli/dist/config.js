"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveToken = saveToken;
exports.getActiveToken = getActiveToken;
exports.setActiveToken = setActiveToken;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), ".sss");
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, "config.json");
function loadConfig() {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify({
            activeToken: "",
            tokens: {}
        }, null, 2));
    }
    return JSON.parse(fs_1.default.readFileSync(CONFIG_FILE, "utf-8"));
}
function saveToken(mintAddress, metadata) {
    const config = loadConfig();
    config.tokens[mintAddress] = metadata;
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function getActiveToken() {
    const config = loadConfig();
    if (!config.activeToken) {
        throw new Error("No active token set...");
    }
    const token = config.tokens[config.activeToken];
    if (!token) {
        throw new Error(`Active token ${config.activeToken} not found in config`);
    }
    return token;
}
function setActiveToken(mintAddress) {
    const config = loadConfig();
    config.activeToken = mintAddress;
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
//# sourceMappingURL=config.js.map
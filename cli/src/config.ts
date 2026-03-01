import path from "path";
import os from "os";
import fs from "fs";

const CONFIG_DIR = path.join(os.homedir(), ".sss");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface TokenEntry{
    name: string;
    symbol: string;
    preset: string;
    network: string;
    createdAt: string;
    keypairPath: string;
    mintAddress: string;
    decimals: number;
    
}

interface SSSConfig{
    activeToken: string;
    tokens: Record<string, TokenEntry>;
}
export function loadConfig(): SSSConfig{
    if(!fs.existsSync(CONFIG_DIR)){
        fs.mkdirSync(CONFIG_DIR, {recursive: true});
    }
    if(!fs.existsSync(CONFIG_FILE)){
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            activeToken: "",
            tokens: {}
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

export function saveToken(mintAddress:string, metadata: TokenEntry){
    const config = loadConfig();
    config.tokens[mintAddress] = metadata;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getActiveToken(): TokenEntry {
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

export function setActiveToken(mintAddress: string){
    const config = loadConfig();
    config.activeToken = mintAddress;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
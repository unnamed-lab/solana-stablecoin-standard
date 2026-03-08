"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { encryptData, decryptData } from "../lib/crypto";

export type KeyStore = {
    minterKeypair?: string;
    burnerKeypair?: string;
    blacklisterKeypair?: string;
    seizerKeypair?: string;
    governanceKeypair?: string; // SSS-3 Multisig signer
};

type EncryptedStore = {
    encrypted: string;
    salt: string;
    iv: string;
};

interface KeyStoreContextType {
    keys: KeyStore | null;
    hasVault: boolean;
    unlock: (password: string) => Promise<void>;
    saveKeys: (password: string, newKeys: KeyStore) => Promise<void>;
    lock: () => void;
    clearVault: () => void;
}

const KeyStoreContext = createContext<KeyStoreContextType | null>(null);

export function KeyStoreProvider({ children }: { children: React.ReactNode }) {
    const [keys, setKeys] = useState<KeyStore | null>(null);
    const [hasVault, setHasVault] = useState(false);

    useEffect(() => {
        // Check if store exists on mount
        const saved = localStorage.getItem("sss_keystore");
        if (saved) {
            setHasVault(true);
        }
    }, []);

    const unlock = async (password: string) => {
        const saved = localStorage.getItem("sss_keystore");
        if (!saved) throw new Error("No keys exist");
        const { encrypted, salt, iv } = JSON.parse(saved) as EncryptedStore;
        const decrypted = await decryptData<KeyStore>(encrypted, password, salt, iv);
        setKeys(decrypted);
    };

    const saveKeys = async (password: string, newKeys: KeyStore) => {
        const encryptedStore = await encryptData(newKeys, password);
        localStorage.setItem("sss_keystore", JSON.stringify(encryptedStore));
        setKeys(newKeys);
        setHasVault(true);
    };

    const lock = () => {
        setKeys(null);
    };

    const clearVault = () => {
        localStorage.removeItem("sss_keystore");
        setKeys(null);
        setHasVault(false);
    };

    return (
        <KeyStoreContext.Provider value={{ keys, hasVault, unlock, saveKeys, lock, clearVault }}>
            {children}
        </KeyStoreContext.Provider>
    );
}

export function useKeyStore() {
    const context = useContext(KeyStoreContext);
    if (!context) {
        throw new Error("useKeyStore must be used within a KeyStoreProvider");
    }
    return context;
}

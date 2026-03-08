"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, KeyRound, ShieldCheck, Settings, AlertCircle } from "lucide-react";
import { useKeyStore, KeyStore } from "./KeyStoreProvider";
import { Btn, Spinner, DepthCard, FADE_UP } from "./Primitives";

export default function KeyManagerModal({ onClose }: { onClose: () => void }) {
    const { keys, hasVault, unlock, saveKeys, lock, clearVault } = useKeyStore();

    // States
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSettingUp, setIsSettingUp] = useState(!hasVault);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Key states (only populated when unlocked)
    const [minterKey, setMinterKey] = useState(keys?.minterKeypair || "");
    const [burnerKey, setBurnerKey] = useState(keys?.burnerKeypair || "");
    const [blacklisterKey, setBlacklisterKey] = useState(keys?.blacklisterKeypair || "");
    const [seizerKey, setSeizerKey] = useState(keys?.seizerKeypair || "");
    const [governanceKey, setGovernanceKey] = useState(keys?.governanceKeypair || "");

    const handleUnlock = async () => {
        setError("");
        setLoading(true);
        try {
            await unlock(password);
            onClose();
        } catch (e: any) {
            setError(e.message || "Failed to unlock");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError("");
        if (isSettingUp && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const newStore: KeyStore = {
                minterKeypair: minterKey.trim() || undefined,
                burnerKeypair: burnerKey.trim() || undefined,
                blacklisterKeypair: blacklisterKey.trim() || undefined,
                seizerKeypair: seizerKey.trim() || undefined,
                governanceKeypair: governanceKey.trim() || undefined,
            };
            await saveKeys(password, newStore);
            onClose();
        } catch (e: any) {
            setError("Failed to save keys");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        if (confirm("Are you sure you want to delete all saved keys from this browser? This cannot be undone.")) {
            clearVault();
            setIsSettingUp(true);
            setPassword("");
            setConfirmPassword("");
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

            {/* Modal */}
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", zIndex: 101, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>

                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {keys ? <ShieldCheck style={{ color: "var(--accent)" }} size={20} /> : <Lock style={{ color: "var(--sub)" }} size={20} />}
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{keys ? "Manage Secure Keys" : hasVault ? "Unlock Key Store" : "Setup Secure Storage"}</span>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--sub)", cursor: "pointer", fontSize: 20 }}>×</button>
                </div>

                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                    {error && (
                        <div style={{ background: "rgba(255, 64, 96, 0.1)", color: "var(--danger)", padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* View: Unlocked & Managing Keys OR Setting up new vault */}
                    {(keys || isSettingUp) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <p style={{ color: "var(--sub)", fontSize: 13 }}>
                                {isSettingUp
                                    ? "Keys are encrypted using your master password and stored locally in this browser."
                                    : "Update your stored Base58 keypairs."}
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div><label className="label">Minter Keypair</label><input type="password" placeholder="Base58 keypair…" className="input" value={minterKey} onChange={(e) => setMinterKey(e.target.value)} /></div>
                                <div><label className="label">Burner Keypair</label><input type="password" placeholder="Base58 keypair…" className="input" value={burnerKey} onChange={(e) => setBurnerKey(e.target.value)} /></div>
                                <div><label className="label">Blacklister Keypair</label><input type="password" placeholder="Base58 keypair…" className="input" value={blacklisterKey} onChange={(e) => setBlacklisterKey(e.target.value)} /></div>
                                <div><label className="label">Seizer Keypair</label><input type="password" placeholder="Base58 keypair…" className="input" value={seizerKey} onChange={(e) => setSeizerKey(e.target.value)} /></div>
                                <div><label className="label">Multisig Signer Keypair</label><input type="password" placeholder="Base58 keypair…" className="input" value={governanceKey} onChange={(e) => setGovernanceKey(e.target.value)} /></div>
                            </div>

                            <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, paddingTop: 16 }}>
                                <div>
                                    <label className="label">{isSettingUp ? "Set Master Password" : "Confirm Master Password to Save"}</label>
                                    <input type="password" placeholder="••••••••" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                {isSettingUp && (
                                    <div>
                                        <label className="label">Confirm Password</label>
                                        <input type="password" placeholder="••••••••" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                {keys && <Btn variant="ghost" onClick={handleClear} style={{ flex: 1, justifyContent: "center" }}>Delete Vault</Btn>}
                                <Btn variant="accent" onClick={handleSave} disabled={loading || !password} style={{ flex: keys ? 2 : 1, justifyContent: "center" }}>
                                    {loading ? <Spinner /> : <><ShieldCheck size={16} /> {isSettingUp ? "Encrypt & Save" : "Update Keys"}</>}
                                </Btn>
                            </div>
                        </div>
                    ) : (
                        // View: Locked vault, needs unlock
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <p style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", marginBottom: 10 }}>
                                Enter your master password to unlock your saved keypairs for this session.
                            </p>

                            <div>
                                <label className="label">Master Password</label>
                                <input type="password" placeholder="••••••••" className="input" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlock()} autoFocus />
                            </div>

                            <Btn variant="accent" onClick={handleUnlock} disabled={loading || !password} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                                {loading ? <Spinner /> : <><Unlock size={16} /> Unlock Vault</>}
                            </Btn>

                            <div style={{ textAlign: "center", marginTop: 16 }}>
                                <button onClick={handleClear} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Reset Vault (Deletes keys)</button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

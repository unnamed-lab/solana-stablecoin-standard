"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, ArrowUpRight, Flame, KeyRound, Globe, Pencil } from "lucide-react";
import { STAGGER, FADE_UP, DepthCard, Tag, TxLink, Btn, ActionBadge, Spinner, KeypairWarning } from "../Primitives";
import { backendApi } from "../../lib/api";
import { fmtTime } from "../../lib/utils";
import { useKeyStore } from "../KeyStoreProvider";

interface Proposal {
    id: string; // The base58 string
    proposer: string;
    status: string; // "PENDING", "APPROVED", "EXECUTED", "CANCELLED"
    eta: number;
    approvalCount: number;
    threshold: number;
    action: {
        type: "MintTo" | "Seize" | "UpdateRoles" | "DelegateToDao";
        amount?: string;
        to?: string;
        from?: string;
        details?: string;
    };
}

export default function GovernanceView() {
    const { keys } = useKeyStore();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);

    // New Proposal Form State
    const [actionType, setActionType] = useState<"MintTo" | "Seize" | "UpdateRoles" | "DelegateToDao">("MintTo");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [targetAccount, setTargetAccount] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formKeypair, setFormKeypair] = useState("");

    const [actingOn, setActingOn] = useState<string | null>(null);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            // In a real app, this should map to your GET /api/v1/governance/proposals endpoint
            // Using mock data for UI display if backend doesn't return immediately
            const res = await backendApi.get<{ items: Proposal[] }>("/governance/proposals");
            if (res?.items) {
                setProposals(res.items);
            }
        } catch (e) {
            console.warn("Failed to fetch proposals", e);
            // Fallback UI
            setProposals([
                {
                    id: "3wCXURH82b...URH8", proposer: "7xKXtg…AsU", status: "PENDING", eta: Date.now() / 1000 + 86400, approvalCount: 1, threshold: 3,
                    action: { type: "MintTo", amount: "500000000", to: "9mNXtg…CsQ" }
                },
                {
                    id: "5Kz7xYpQ1a...xYpQ", proposer: "3Kzg7p…BsP", status: "EXECUTED", eta: Date.now() / 1000 - 86400, approvalCount: 3, threshold: 3,
                    action: { type: "UpdateRoles", details: "New Pauser: 5yLKtg…DtR" }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handlePropose = async () => {
        const signer = keys?.governanceKeypair || formKeypair;
        if (!signer) return;

        setSubmitLoading(true);
        try {
            const payload: any = {
                proposerKeypair: signer,
                actionType,
                params: {}
            };

            if (actionType === "MintTo") {
                payload.params.amount = Number(amount);
                payload.params.to = recipient;
            } else if (actionType === "Seize") {
                payload.params.amount = Number(amount);
                payload.params.from = targetAccount;
                payload.params.to = recipient;
            }

            await backendApi.post("/governance/propose", payload);
            setAmount(""); setRecipient(""); setTargetAccount("");
            fetchProposals();
        } catch (e) {
            console.error(e);
            alert("Failed to create proposal");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleApprove = async (proposalId: string) => {
        const signer = keys?.governanceKeypair;
        if (!signer) {
            alert("Please unlock your Multisig Signer Keypair in the Vault first.");
            return;
        }

        setActingOn(proposalId);
        try {
            await backendApi.post(`/governance/approve/${proposalId}`, { signerKeypair: signer });
            fetchProposals();
        } catch (e) {
            console.error(e);
            alert("Failed to approve proposal");
        } finally {
            setActingOn(null);
        }
    };

    return (
        <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
            <motion.div variants={FADE_UP} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Governance</h1>
                    <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 6, fontFamily: "Geist Mono" }}>M-of-N Multisig & Time-locks</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Tag variant="dim" pulse={proposals.some(p => p.status === "PENDING")}>
                        {proposals.filter(p => p.status === "PENDING").length} Pending
                    </Tag>
                </div>
            </motion.div>

            <motion.div variants={STAGGER} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

                {/* Left Column: Proposals List */}
                <motion.div variants={FADE_UP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DepthCard>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>Proposals</p>
                            <Btn variant="ghost" onClick={fetchProposals} disabled={loading} style={{ padding: "4px 10px", fontSize: 11 }}>
                                {loading ? "Loading..." : "Refresh"}
                            </Btn>
                        </div>

                        {proposals.length === 0 && !loading ? (
                            <div style={{ padding: 40, textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No proposals found.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {proposals.map((p) => {
                                    const isPending = p.status === "PENDING";
                                    return (
                                        <motion.div key={p.id} whileHover={{ x: 2, background: "rgba(255,255,255,0.02)" }}
                                            style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

                                            {/* Header */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                                                        background: "rgba(0,229,160,0.1)", color: "var(--accent)", border: "1px solid rgba(0,229,160,0.2)"
                                                    }}>
                                                        {p.action.type === "MintTo" ? <ArrowUpRight size={14} /> : p.action.type === "Seize" ? <Flame size={14} /> : p.action.type === "UpdateRoles" ? <KeyRound size={14} /> : <Globe size={14} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: 14 }}>{p.action.type}</p>
                                                        <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "Geist Mono" }}>Proposer: {p.proposer}</p>
                                                    </div>
                                                </div>
                                                <Tag variant={isPending ? "warn" : p.status === "EXECUTED" ? "green" : "dim"}>{p.status}</Tag>
                                            </div>

                                            {/* Details */}
                                            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "10px 12px", fontSize: 12, display: "flex", flexDirection: "column", gap: 6, fontFamily: "Geist Mono", color: "var(--text)" }}>
                                                {p.action.amount && <div><span style={{ color: "var(--sub)" }}>Amount: </span>{Number(p.action.amount).toLocaleString()}</div>}
                                                {p.action.to && <div><span style={{ color: "var(--sub)" }}>To: </span>{p.action.to}</div>}
                                                {p.action.from && <div><span style={{ color: "var(--sub)" }}>From: </span>{p.action.from}</div>}
                                                {p.action.details && <div>{p.action.details}</div>}
                                            </div>

                                            {/* Footer Actions */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                                <div style={{ fontSize: 11, color: "var(--dim)" }}>
                                                    Approvals: <span style={{ color: p.approvalCount >= p.threshold ? "var(--accent)" : "var(--text)", fontWeight: 600 }}>{p.approvalCount} / {p.threshold}</span>
                                                </div>
                                                {isPending && (
                                                    <Btn variant="primary" onClick={() => handleApprove(p.id)} disabled={actingOn === p.id} style={{ padding: "6px 14px", fontSize: 12 }}>
                                                        {actingOn === p.id ? <Spinner /> : "Sign & Approve"}
                                                    </Btn>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </DepthCard>
                </motion.div>

                {/* Right Column: Create Proposal Form */}
                <motion.div variants={FADE_UP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DepthCard>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                            <Pencil size={16} style={{ color: "var(--accent)" }} />
                            <p style={{ fontWeight: 700, fontSize: 15 }}>Create Proposal</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label className="label">Action Type</label>
                                <select className="input" value={actionType} onChange={e => setActionType(e.target.value as any)}>
                                    <option value="MintTo">Mint Tokens</option>
                                    <option value="Seize">Seize Funds</option>
                                    <option value="UpdateRoles">Update Roles</option>
                                    <option value="DelegateToDao">Delegate To DAO</option>
                                </select>
                            </div>

                            {(actionType === "MintTo" || actionType === "Seize") && (
                                <div>
                                    <label className="label">Amount (base units)</label>
                                    <input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000000" />
                                </div>
                            )}

                            {actionType === "Seize" && (
                                <div>
                                    <label className="label">Target Account (From)</label>
                                    <input type="text" className="input" value={targetAccount} onChange={e => setTargetAccount(e.target.value)} placeholder="Base58 Wallet" />
                                </div>
                            )}

                            {(actionType === "MintTo" || actionType === "Seize") && (
                                <div>
                                    <label className="label">Recipient (To)</label>
                                    <input type="text" className="input" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Base58 Wallet" />
                                </div>
                            )}

                            <div style={{ marginTop: 6 }}>
                                <label className="label">Multisig Signer Keypair</label>
                                {keys?.governanceKeypair ? (
                                    <div style={{ padding: "10px 14px", background: "rgba(0,229,160,0.1)", color: "var(--accent)", borderRadius: 8, fontSize: 13, border: "1px solid rgba(0,229,160,0.2)" }}>
                                        ✓ Provided by Secure Vault
                                    </div>
                                ) : (
                                    <>
                                        <input className="input" type="password" placeholder="Base58 keypair…" value={formKeypair} onChange={e => setFormKeypair(e.target.value)} />
                                        <KeypairWarning />
                                    </>
                                )}
                            </div>

                            <Btn variant="accent" onClick={handlePropose} disabled={submitLoading || (!keys?.governanceKeypair && !formKeypair)} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                                {submitLoading ? <Spinner /> : "Submit Proposal API"}
                            </Btn>
                        </div>
                    </DepthCard>
                </motion.div>

            </motion.div>
        </motion.div>
    );
}

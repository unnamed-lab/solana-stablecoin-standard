/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_core.json`.
 */
export type SssCore = {
    "address": "7H7fqqjASpTDCgYwDpp8EatKM4sSMwxaYvbhf6s3ThqM";
    "metadata": {
        "name": "sssCore";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "initialize";
            "discriminator": [
                175,
                175,
                109,
                31,
                13,
                152,
                155,
                237
            ];
            "accounts": [
                {
                    "name": "payer";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "masterAuthority";
                    "signer": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
                    "writable": true;
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const";
                                "value": [
                                    115,
                                    115,
                                    115,
                                    45,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            }
                        ];
                    };
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "rent";
                    "address": "SysvarRent111111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "params";
                    "type": {
                        "defined": {
                            "name": "initializeParams";
                        };
                    };
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "stablecoinConfig";
            "discriminator": [
                127,
                25,
                244,
                213,
                1,
                192,
                101,
                6
            ];
        }
    ];
    "events": [
        {
            "name": "accountFrozenEvent";
            "discriminator": [
                83,
                200,
                223,
                28,
                165,
                34,
                41,
                80
            ];
        },
        {
            "name": "accountThawedEvent";
            "discriminator": [
                172,
                202,
                68,
                155,
                173,
                98,
                79,
                74
            ];
        },
        {
            "name": "blacklisted";
            "discriminator": [
                107,
                52,
                170,
                85,
                201,
                168,
                222,
                152
            ];
        },
        {
            "name": "burned";
            "discriminator": [
                207,
                37,
                251,
                154,
                239,
                229,
                14,
                67
            ];
        },
        {
            "name": "initialized";
            "discriminator": [
                208,
                213,
                115,
                98,
                115,
                82,
                201,
                209
            ];
        },
        {
            "name": "minted";
            "discriminator": [
                174,
                131,
                21,
                57,
                88,
                117,
                114,
                121
            ];
        },
        {
            "name": "pausedEvent";
            "discriminator": [
                43,
                14,
                250,
                236,
                116,
                42,
                177,
                89
            ];
        },
        {
            "name": "removedFromBlacklist";
            "discriminator": [
                55,
                136,
                25,
                65,
                199,
                36,
                146,
                33
            ];
        },
        {
            "name": "roleUpdated";
            "discriminator": [
                155,
                222,
                44,
                187,
                5,
                65,
                10,
                212
            ];
        },
        {
            "name": "seized";
            "discriminator": [
                197,
                48,
                203,
                203,
                174,
                37,
                100,
                65
            ];
        },
        {
            "name": "unpausedEvent";
            "discriminator": [
                150,
                198,
                191,
                67,
                103,
                86,
                160,
                55
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "notMasterAuthority";
            "msg": "Signer is not the master authority";
        },
        {
            "code": 6001;
            "name": "notMinter";
            "msg": "Signer is not authorized to mint";
        },
        {
            "code": 6002;
            "name": "notBurner";
            "msg": "Signer is not authorized to burn";
        },
        {
            "code": 6003;
            "name": "notBlacklister";
            "msg": "Signer is not the blacklister";
        },
        {
            "code": 6004;
            "name": "notSeizer";
            "msg": "Signer is not the seizer";
        },
        {
            "code": 6005;
            "name": "notPauser";
            "msg": "Signer is not the pauser";
        },
        {
            "code": 6006;
            "name": "complianceNotEnabled";
            "msg": "Compliance module not enabled. Initialize with enable_transfer_hook: true for SSS-2";
        },
        {
            "code": 6007;
            "name": "permanentDelegateNotEnabled";
            "msg": "Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2";
        },
        {
            "code": 6008;
            "name": "hookNotRegistered";
            "msg": "Transfer hook not registered on this stablecoin";
        },
        {
            "code": 6009;
            "name": "paused";
            "msg": "Stablecoin is paused";
        },
        {
            "code": 6010;
            "name": "notPaused";
            "msg": "Stablecoin is not paused";
        },
        {
            "code": 6011;
            "name": "alreadyBlacklisted";
            "msg": "Address is already blacklisted";
        },
        {
            "code": 6012;
            "name": "notBlacklisted";
            "msg": "Address is not blacklisted";
        },
        {
            "code": 6013;
            "name": "invalidBlacklistTarget";
            "msg": "Cannot blacklist the zero address";
        },
        {
            "code": 6014;
            "name": "accountNotFrozen";
            "msg": "Cannot seize from a non-frozen account";
        },
        {
            "code": 6015;
            "name": "quotaExceeded";
            "msg": "Mint amount exceeds per-period quota";
        },
        {
            "code": 6016;
            "name": "minterInactive";
            "msg": "Minter is inactive";
        },
        {
            "code": 6017;
            "name": "minterAlreadyExists";
            "msg": "Minter config already exists";
        },
        {
            "code": 6018;
            "name": "noPendingTransfer";
            "msg": "No pending authority transfer";
        },
        {
            "code": 6019;
            "name": "notPendingAuthority";
            "msg": "Signer is not the pending authority";
        },
        {
            "code": 6020;
            "name": "nameTooLong";
            "msg": "Name exceeds 32 characters";
        },
        {
            "code": 6021;
            "name": "symbolTooLong";
            "msg": "Symbol exceeds 10 characters";
        },
        {
            "code": 6022;
            "name": "zeroAmount";
            "msg": "Amount must be greater than zero";
        },
        {
            "code": 6023;
            "name": "supplyOverflow";
            "msg": "Overflow in supply calculation";
        }
    ];
    "types": [
        {
            "name": "accountFrozenEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "account";
                        "type": "pubkey";
                    },
                    {
                        "name": "by";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "accountThawedEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "account";
                        "type": "pubkey";
                    },
                    {
                        "name": "by";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "blacklisted";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "address";
                        "type": "pubkey";
                    },
                    {
                        "name": "reason";
                        "type": "string";
                    },
                    {
                        "name": "blacklistedBy";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "burned";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "from";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "burner";
                        "type": "pubkey";
                    },
                    {
                        "name": "newTotalSupply";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "initializeParams";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "name";
                        "type": "string";
                    },
                    {
                        "name": "symbol";
                        "type": "string";
                    },
                    {
                        "name": "uri";
                        "type": "string";
                    },
                    {
                        "name": "decimals";
                        "type": "u8";
                    },
                    {
                        "name": "preset";
                        "type": {
                            "defined": {
                                "name": "stablecoinPreset";
                            };
                        };
                    },
                    {
                        "name": "pauser";
                        "type": "pubkey";
                    },
                    {
                        "name": "minterAuthority";
                        "type": "pubkey";
                    },
                    {
                        "name": "burner";
                        "type": "pubkey";
                    },
                    {
                        "name": "enablePermanentDelegate";
                        "type": "bool";
                    },
                    {
                        "name": "enableTransferHook";
                        "type": "bool";
                    },
                    {
                        "name": "defaultAccountFrozen";
                        "type": "bool";
                    },
                    {
                        "name": "blacklister";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "seizer";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "hookProgramId";
                        "type": {
                            "option": "pubkey";
                        };
                    }
                ];
            };
        },
        {
            "name": "initialized";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "preset";
                        "type": "string";
                    },
                    {
                        "name": "name";
                        "type": "string";
                    },
                    {
                        "name": "symbol";
                        "type": "string";
                    },
                    {
                        "name": "decimals";
                        "type": "u8";
                    },
                    {
                        "name": "masterAuthority";
                        "type": "pubkey";
                    },
                    {
                        "name": "complianceEnabled";
                        "type": "bool";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "minted";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "recipient";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "minter";
                        "type": "pubkey";
                    },
                    {
                        "name": "newTotalSupply";
                        "type": "u64";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "pausedEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "by";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "removedFromBlacklist";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "address";
                        "type": "pubkey";
                    },
                    {
                        "name": "removedBy";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "roleUpdated";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "role";
                        "type": "string";
                    },
                    {
                        "name": "oldAddress";
                        "type": "pubkey";
                    },
                    {
                        "name": "newAddress";
                        "type": "pubkey";
                    },
                    {
                        "name": "updatedBy";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "seized";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "seizedFrom";
                        "type": "pubkey";
                    },
                    {
                        "name": "seizedTo";
                        "type": "pubkey";
                    },
                    {
                        "name": "amount";
                        "type": "u64";
                    },
                    {
                        "name": "reason";
                        "type": "string";
                    },
                    {
                        "name": "seizer";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        },
        {
            "name": "stablecoinConfig";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "version";
                        "type": "u8";
                    },
                    {
                        "name": "preset";
                        "type": {
                            "defined": {
                                "name": "stablecoinPreset";
                            };
                        };
                    },
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "name";
                        "type": "string";
                    },
                    {
                        "name": "symbol";
                        "type": "string";
                    },
                    {
                        "name": "uri";
                        "type": "string";
                    },
                    {
                        "name": "decimals";
                        "type": "u8";
                    },
                    {
                        "name": "enablePermanentDelegate";
                        "type": "bool";
                    },
                    {
                        "name": "enableTransferHook";
                        "type": "bool";
                    },
                    {
                        "name": "defaultAccountFrozen";
                        "type": "bool";
                    },
                    {
                        "name": "masterAuthority";
                        "type": "pubkey";
                    },
                    {
                        "name": "pendingMasterAuthority";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "pauser";
                        "type": "pubkey";
                    },
                    {
                        "name": "minterAuthority";
                        "type": "pubkey";
                    },
                    {
                        "name": "burner";
                        "type": "pubkey";
                    },
                    {
                        "name": "blacklister";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "seizer";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "hookAuthority";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "paused";
                        "type": "bool";
                    },
                    {
                        "name": "totalSupply";
                        "type": "u64";
                    },
                    {
                        "name": "totalMintedAllTime";
                        "type": "u64";
                    },
                    {
                        "name": "totalBurnedAllTime";
                        "type": "u64";
                    },
                    {
                        "name": "blacklistCount";
                        "type": "u32";
                    },
                    {
                        "name": "hookProgramId";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "createdAt";
                        "type": "i64";
                    },
                    {
                        "name": "lastUpdatedAt";
                        "type": "i64";
                    },
                    {
                        "name": "bump";
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "stablecoinPreset";
            "repr": {
                "kind": "rust";
            };
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "sss1";
                    },
                    {
                        "name": "sss2";
                    },
                    {
                        "name": "custom";
                    }
                ];
            };
        },
        {
            "name": "unpausedEvent";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "by";
                        "type": "pubkey";
                    },
                    {
                        "name": "timestamp";
                        "type": "i64";
                    }
                ];
            };
        }
    ];
};

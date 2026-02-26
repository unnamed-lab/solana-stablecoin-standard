/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_core.json`.
 */
export type SssCore = {
    "address": "2Vh56aB6CX2SsHyLVwGQpt8Z9jWqYKNzjf5BXjgM2F5y";
    "metadata": {
        "name": "sssCore";
        "version": "0.1.0";
        "spec": "0.1.0";
        "description": "Created with Anchor";
    };
    "instructions": [
        {
            "name": "acceptAuthorityTransfer";
            "discriminator": [
                239,
                248,
                177,
                2,
                206,
                97,
                46,
                255
            ];
            "accounts": [
                {
                    "name": "pendingAuthority";
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
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "addMinter";
            "discriminator": [
                75,
                86,
                218,
                40,
                219,
                6,
                141,
                29
            ];
            "accounts": [
                {
                    "name": "minterAuthority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
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
                    "name": "minterConfig";
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
                                    109,
                                    105,
                                    110,
                                    116,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "arg";
                                "path": "minter";
                            }
                        ];
                    };
                },
                {
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                }
            ];
            "args": [
                {
                    "name": "minter";
                    "type": "pubkey";
                },
                {
                    "name": "quotaPerPeriod";
                    "type": "u64";
                },
                {
                    "name": "periodSeconds";
                    "type": "i64";
                }
            ];
        },
        {
            "name": "addToBlacklist";
            "discriminator": [
                90,
                115,
                98,
                231,
                173,
                119,
                117,
                176
            ];
            "accounts": [
                {
                    "name": "blacklister";
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
                    "name": "blacklistEntry";
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
                                    98,
                                    108,
                                    97,
                                    99,
                                    107,
                                    108,
                                    105,
                                    115,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "arg";
                                "path": "target";
                            }
                        ];
                    };
                },
                {
                    "name": "targetAccount";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [
                {
                    "name": "target";
                    "type": "pubkey";
                },
                {
                    "name": "reason";
                    "type": "string";
                }
            ];
        },
        {
            "name": "burn";
            "discriminator": [
                116,
                110,
                29,
                56,
                107,
                219,
                42,
                93
            ];
            "accounts": [
                {
                    "name": "burner";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
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
                    "name": "source";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "freezeAccount";
            "discriminator": [
                253,
                75,
                82,
                133,
                167,
                238,
                43,
                130
            ];
            "accounts": [
                {
                    "name": "authority";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
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
                    "name": "account";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [];
        },
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
        },
        {
            "name": "mint";
            "discriminator": [
                51,
                57,
                225,
                47,
                182,
                146,
                137,
                166
            ];
            "accounts": [
                {
                    "name": "minter";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "minterConfig"
                    ];
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
                    "name": "minterConfig";
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
                                    109,
                                    105,
                                    110,
                                    116,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "account";
                                "path": "minter";
                            }
                        ];
                    };
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config",
                        "minterConfig"
                    ];
                },
                {
                    "name": "destination";
                    "writable": true;
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "pause";
            "discriminator": [
                211,
                22,
                221,
                251,
                74,
                121,
                193,
                47
            ];
            "accounts": [
                {
                    "name": "pauser";
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
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "proposeAuthorityTransfer";
            "discriminator": [
                57,
                206,
                225,
                129,
                35,
                111,
                174,
                145
            ];
            "accounts": [
                {
                    "name": "masterAuthority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
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
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [
                {
                    "name": "newAuthority";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "removeFromBlacklist";
            "discriminator": [
                47,
                105,
                20,
                10,
                165,
                168,
                203,
                219
            ];
            "accounts": [
                {
                    "name": "blacklister";
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
                    "name": "blacklistEntry";
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
                                    98,
                                    108,
                                    97,
                                    99,
                                    107,
                                    108,
                                    105,
                                    115,
                                    116
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "arg";
                                "path": "target";
                            }
                        ];
                    };
                },
                {
                    "name": "targetAccount";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [
                {
                    "name": "target";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "removeMinter";
            "discriminator": [
                241,
                69,
                84,
                16,
                164,
                232,
                131,
                79
            ];
            "accounts": [
                {
                    "name": "minterAuthority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "config";
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
                    "name": "minterConfig";
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
                                    109,
                                    105,
                                    110,
                                    116,
                                    101,
                                    114
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "arg";
                                "path": "minter";
                            }
                        ];
                    };
                },
                {
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [
                {
                    "name": "minter";
                    "type": "pubkey";
                }
            ];
        },
        {
            "name": "seize";
            "discriminator": [
                129,
                159,
                143,
                31,
                161,
                224,
                241,
                84
            ];
            "accounts": [
                {
                    "name": "seizer";
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
                    "name": "seizureRecord";
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
                                    115,
                                    101,
                                    105,
                                    122,
                                    117,
                                    114,
                                    101
                                ];
                            },
                            {
                                "kind": "account";
                                "path": "mint";
                            },
                            {
                                "kind": "account";
                                "path": "sourceAccount";
                            }
                        ];
                    };
                },
                {
                    "name": "sourceAccount";
                    "writable": true;
                },
                {
                    "name": "destinationAccount";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "systemProgram";
                    "address": "11111111111111111111111111111111";
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                },
                {
                    "name": "reason";
                    "type": "string";
                }
            ];
        },
        {
            "name": "thawAccount";
            "discriminator": [
                115,
                152,
                79,
                213,
                213,
                169,
                184,
                35
            ];
            "accounts": [
                {
                    "name": "authority";
                    "writable": true;
                    "signer": true;
                },
                {
                    "name": "config";
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
                    "name": "account";
                    "writable": true;
                },
                {
                    "name": "mint";
                    "writable": true;
                    "relations": [
                        "config"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
                }
            ];
            "args": [];
        },
        {
            "name": "unpause";
            "discriminator": [
                169,
                144,
                4,
                38,
                10,
                141,
                188,
                255
            ];
            "accounts": [
                {
                    "name": "masterAuthority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
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
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "updateRoles";
            "discriminator": [
                220,
                152,
                205,
                233,
                177,
                123,
                219,
                125
            ];
            "accounts": [
                {
                    "name": "masterAuthority";
                    "writable": true;
                    "signer": true;
                    "relations": [
                        "config"
                    ];
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
                    "name": "mint";
                    "relations": [
                        "config"
                    ];
                }
            ];
            "args": [
                {
                    "name": "update";
                    "type": {
                        "defined": {
                            "name": "roleUpdate";
                        };
                    };
                }
            ];
        }
    ];
    "accounts": [
        {
            "name": "blacklistEntry";
            "discriminator": [
                218,
                179,
                231,
                40,
                141,
                25,
                168,
                189
            ];
        },
        {
            "name": "minterConfig";
            "discriminator": [
                78,
                211,
                23,
                6,
                233,
                19,
                19,
                236
            ];
        },
        {
            "name": "seizureRecord";
            "discriminator": [
                223,
                239,
                19,
                37,
                166,
                60,
                246,
                226
            ];
        },
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
            "name": "blacklistEntry";
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
                        "name": "addedBy";
                        "type": "pubkey";
                    },
                    {
                        "name": "addedAt";
                        "type": "i64";
                    },
                    {
                        "name": "removed";
                        "type": "bool";
                    },
                    {
                        "name": "removedBy";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "removedAt";
                        "type": {
                            "option": "i64";
                        };
                    },
                    {
                        "name": "bump";
                        "type": "u8";
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
            "name": "minterConfig";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "mint";
                        "type": "pubkey";
                    },
                    {
                        "name": "minter";
                        "type": "pubkey";
                    },
                    {
                        "name": "isActive";
                        "type": "bool";
                    },
                    {
                        "name": "quotaPerPeriod";
                        "type": "u64";
                    },
                    {
                        "name": "periodSeconds";
                        "type": "i64";
                    },
                    {
                        "name": "mintedThisPeriod";
                        "type": "u64";
                    },
                    {
                        "name": "periodStart";
                        "type": "i64";
                    },
                    {
                        "name": "totalMinted";
                        "type": "u64";
                    },
                    {
                        "name": "mintCount";
                        "type": "u64";
                    },
                    {
                        "name": "createdAt";
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
            "name": "roleUpdate";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "newPauser";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "newMinterAuthority";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "newBurner";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "newBlacklister";
                        "type": {
                            "option": "pubkey";
                        };
                    },
                    {
                        "name": "newSeizer";
                        "type": {
                            "option": "pubkey";
                        };
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
            "name": "seizureRecord";
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
                        "name": "executedBy";
                        "type": "pubkey";
                    },
                    {
                        "name": "executedAt";
                        "type": "i64";
                    },
                    {
                        "name": "transactionSignature";
                        "type": {
                            "array": [
                                "u8",
                                64
                            ];
                        };
                    },
                    {
                        "name": "bump";
                        "type": "u8";
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

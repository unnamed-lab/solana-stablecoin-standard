/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_transfer_hook.json`.
 */
export type SssTransferHook = {
  "address": "DZojximE3yABxkNAuyRGpuTGPpAdxrUtdocg3Kam3r6A",
  "metadata": {
    "name": "sssTransferHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "disableHook",
      "discriminator": [
        135,
        250,
        78,
        138,
        213,
        16,
        28,
        219
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "hook_config.mint",
                "account": "hookConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "enableHook",
      "discriminator": [
        242,
        81,
        117,
        14,
        86,
        35,
        185,
        143
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "hook_config.mint",
                "account": "hookConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "execute",
      "discriminator": [
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "source"
        },
        {
          "name": "mint"
        },
        {
          "name": "destination"
        },
        {
          "name": "sourceAuthority"
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "sssCoreProgram"
        },
        {
          "name": "senderBlacklistEntry"
        },
        {
          "name": "recipientBlacklistEntry"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "discriminator": [
        92,
        197,
        174,
        197,
        41,
        124,
        19,
        3
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeHook",
      "discriminator": [
        37,
        101,
        119,
        255,
        156,
        39,
        252,
        232
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "sssConfig"
          ]
        },
        {
          "name": "sssConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
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
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                93,
                70,
                244,
                184,
                238,
                138,
                30,
                232,
                245,
                87,
                58,
                141,
                2,
                242,
                158,
                195,
                163,
                145,
                92,
                208,
                158,
                81,
                50,
                230,
                101,
                215,
                99,
                32,
                229,
                88,
                122,
                68
              ]
            }
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "defaultEnabled",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "hookConfig",
      "discriminator": [
        137,
        155,
        101,
        95,
        138,
        72,
        8,
        182
      ]
    },
    {
      "name": "stablecoinConfig",
      "discriminator": [
        127,
        25,
        244,
        213,
        1,
        192,
        101,
        6
      ]
    }
  ],
  "events": [
    {
      "name": "transferBlocked",
      "discriminator": [
        209,
        54,
        14,
        64,
        139,
        238,
        231,
        236
      ]
    },
    {
      "name": "transferValidated",
      "discriminator": [
        171,
        133,
        176,
        35,
        131,
        74,
        31,
        221
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "senderBlacklisted",
      "msg": "Sender is blacklisted and cannot transfer tokens"
    },
    {
      "code": 6001,
      "name": "recipientBlacklisted",
      "msg": "Recipient is blacklisted and cannot receive tokens"
    },
    {
      "code": 6002,
      "name": "hookDisabled",
      "msg": "Transfer hook is disabled"
    },
    {
      "code": 6003,
      "name": "invalidMint",
      "msg": "Invalid mint for this hook instance"
    },
    {
      "code": 6004,
      "name": "invalidAuthority",
      "msg": "Invalid authority"
    }
  ],
  "types": [
    {
      "name": "hookConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "sssCoreProgram",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "transferCount",
            "type": "u64"
          },
          {
            "name": "blockedCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stablecoinConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "preset",
            "type": {
              "defined": {
                "name": "stablecoinPreset"
              }
            }
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "enablePermanentDelegate",
            "type": "bool"
          },
          {
            "name": "enableTransferHook",
            "type": "bool"
          },
          {
            "name": "defaultAccountFrozen",
            "type": "bool"
          },
          {
            "name": "masterAuthority",
            "type": "pubkey"
          },
          {
            "name": "pendingMasterAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "pauser",
            "type": "pubkey"
          },
          {
            "name": "minterAuthority",
            "type": "pubkey"
          },
          {
            "name": "burner",
            "type": "pubkey"
          },
          {
            "name": "blacklister",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "seizer",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "hookAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "totalMintedAllTime",
            "type": "u64"
          },
          {
            "name": "totalBurnedAllTime",
            "type": "u64"
          },
          {
            "name": "blacklistCount",
            "type": "u32"
          },
          {
            "name": "hookProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lastUpdatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stablecoinPreset",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sss1"
          },
          {
            "name": "sss2"
          },
          {
            "name": "custom"
          }
        ]
      }
    },
    {
      "name": "transferBlocked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "blockedAddress",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "transferValidated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "source",
            "type": "pubkey"
          },
          {
            "name": "destination",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};

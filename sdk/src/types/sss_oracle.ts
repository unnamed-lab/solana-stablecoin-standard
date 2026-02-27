/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_oracle.json`.
 */
export type SssOracle = {
  "address": "Brj7RU6jcmWXqCSfBa6o3v5bHS48Z6uDyKZUfG8ZbQoD",
  "metadata": {
    "name": "sssOracle",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Oracle Integration Module for Solana Stablecoin Standard"
  },
  "instructions": [
    {
      "name": "acceptAuthorityTransfer",
      "docs": [
        "Accept a pending authority transfer (must be signed by new authority)"
      ],
      "discriminator": [
        239,
        248,
        177,
        2,
        206,
        97,
        46,
        255
      ],
      "accounts": [
        {
          "name": "newAuthority",
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "getMintQuote",
      "docs": [
        "Get a mint quote — USD in → tokens out"
      ],
      "discriminator": [
        161,
        124,
        87,
        175,
        98,
        25,
        175,
        169
      ],
      "accounts": [
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracleConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        },
        {
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  102,
                  101,
                  101,
                  100,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "switchboardFeed"
        },
        {
          "name": "quote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  113,
                  117,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              },
              {
                "kind": "account",
                "path": "requester"
              },
              {
                "kind": "arg",
                "path": "params.nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "getQuoteParams"
            }
          }
        }
      ],
      "returns": {
        "defined": {
          "name": "quoteResult"
        }
      }
    },
    {
      "name": "getRedeemQuote",
      "docs": [
        "Get a redeem quote — tokens in → USD out"
      ],
      "discriminator": [
        104,
        228,
        76,
        87,
        172,
        49,
        183,
        137
      ],
      "accounts": [
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracleConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        },
        {
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  102,
                  101,
                  101,
                  100,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "switchboardFeed"
        },
        {
          "name": "quote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  113,
                  117,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              },
              {
                "kind": "account",
                "path": "requester"
              },
              {
                "kind": "arg",
                "path": "params.nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "getQuoteParams"
            }
          }
        }
      ],
      "returns": {
        "defined": {
          "name": "quoteResult"
        }
      }
    },
    {
      "name": "initializeOracle",
      "docs": [
        "Initialize an oracle config for a specific SSS token mint"
      ],
      "discriminator": [
        144,
        223,
        131,
        120,
        196,
        253,
        181,
        99
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
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
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  102,
                  101,
                  101,
                  100,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeOracleParams"
            }
          }
        }
      ]
    },
    {
      "name": "initializeRegistry",
      "docs": [
        "Initialize the global feed registry (one-time, admin only)"
      ],
      "discriminator": [
        189,
        181,
        20,
        17,
        174,
        57,
        249,
        59
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  102,
                  101,
                  101,
                  100,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintWithOracle",
      "docs": [
        "Execute a stored mint quote — validates + emits event atomically"
      ],
      "discriminator": [
        59,
        36,
        162,
        197,
        12,
        79,
        194,
        72
      ],
      "accounts": [
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        },
        {
          "name": "quote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  113,
                  117,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              },
              {
                "kind": "account",
                "path": "requester"
              },
              {
                "kind": "account",
                "path": "quote.nonce",
                "account": "pendingQuote"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "pauseOracle",
      "docs": [
        "Pause oracle mint/redeem operations (emergencies)"
      ],
      "discriminator": [
        170,
        116,
        3,
        121,
        247,
        109,
        147,
        191
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "proposeAuthorityTransfer",
      "docs": [
        "Propose a two-step authority transfer"
      ],
      "discriminator": [
        57,
        206,
        225,
        129,
        35,
        111,
        174,
        145
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerFeed",
      "docs": [
        "Register a new price feed (e.g. BRLUSD, EURUSD, JPYUSD)"
      ],
      "discriminator": [
        138,
        181,
        114,
        65,
        71,
        145,
        61,
        111
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  102,
                  101,
                  101,
                  100,
                  45,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "switchboardFeed"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "registerFeedParams"
            }
          }
        }
      ]
    },
    {
      "name": "unpauseOracle",
      "docs": [
        "Unpause oracle operations"
      ],
      "discriminator": [
        187,
        113,
        244,
        174,
        46,
        2,
        129,
        215
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateCpiMultiplier",
      "docs": [
        "Update CPI multiplier (monthly admin operation for CpiIndexed tokens)"
      ],
      "discriminator": [
        173,
        77,
        84,
        2,
        36,
        149,
        224,
        110
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "oracle_config.mint",
                "account": "oracleConfig"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateCpiParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "feedRegistry",
      "discriminator": [
        165,
        19,
        142,
        137,
        18,
        194,
        61,
        247
      ]
    },
    {
      "name": "oracleConfig",
      "discriminator": [
        133,
        196,
        152,
        50,
        27,
        21,
        145,
        254
      ]
    },
    {
      "name": "pendingQuote",
      "discriminator": [
        205,
        143,
        177,
        236,
        152,
        2,
        209,
        153
      ]
    }
  ],
  "events": [
    {
      "name": "authorityTransferProposed",
      "discriminator": [
        103,
        244,
        27,
        116,
        177,
        4,
        100,
        119
      ]
    },
    {
      "name": "authorityTransferred",
      "discriminator": [
        245,
        109,
        179,
        54,
        135,
        92,
        22,
        64
      ]
    },
    {
      "name": "cpiMultiplierUpdated",
      "discriminator": [
        188,
        2,
        169,
        182,
        6,
        143,
        242,
        65
      ]
    },
    {
      "name": "feedRegistered",
      "discriminator": [
        96,
        127,
        205,
        247,
        125,
        203,
        93,
        60
      ]
    },
    {
      "name": "oracleInitialized",
      "discriminator": [
        42,
        87,
        109,
        208,
        1,
        105,
        101,
        142
      ]
    },
    {
      "name": "oracleMint",
      "discriminator": [
        143,
        237,
        105,
        171,
        54,
        159,
        225,
        132
      ]
    },
    {
      "name": "oraclePaused",
      "discriminator": [
        58,
        194,
        226,
        171,
        90,
        95,
        183,
        83
      ]
    },
    {
      "name": "oracleRedeem",
      "discriminator": [
        245,
        239,
        154,
        129,
        214,
        88,
        130,
        236
      ]
    },
    {
      "name": "quoteGenerated",
      "discriminator": [
        48,
        44,
        96,
        174,
        113,
        177,
        104,
        197
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "priceTooStale",
      "msg": "Price feed is stale — last update exceeds max_staleness threshold"
    },
    {
      "code": 6001,
      "name": "invalidPrice",
      "msg": "Price feed returned a negative or zero value"
    },
    {
      "code": 6002,
      "name": "confidenceTooWide",
      "msg": "Price confidence interval is too wide — market is too volatile to price safely"
    },
    {
      "code": 6003,
      "name": "feedNotReady",
      "msg": "Switchboard aggregator account data is invalid or unreadable"
    },
    {
      "code": 6004,
      "name": "quoteExpired",
      "msg": "Quote has expired — please request a new quote"
    },
    {
      "code": 6005,
      "name": "quoteAlreadyUsed",
      "msg": "Quote has already been used"
    },
    {
      "code": 6006,
      "name": "slippageExceeded",
      "msg": "Token amount is below slippage threshold (min_output)"
    },
    {
      "code": 6007,
      "name": "zeroAmount",
      "msg": "Input amount must be greater than zero"
    },
    {
      "code": 6008,
      "name": "zeroOutput",
      "msg": "Calculated output amount is zero after fee deduction"
    },
    {
      "code": 6009,
      "name": "feedAlreadyRegistered",
      "msg": "Feed with this symbol already exists in the registry"
    },
    {
      "code": 6010,
      "name": "feedNotFound",
      "msg": "Feed symbol not found in registry"
    },
    {
      "code": 6011,
      "name": "symbolTooLong",
      "msg": "Feed symbol exceeds maximum length of 12 characters"
    },
    {
      "code": 6012,
      "name": "registryFull",
      "msg": "Registry is at maximum capacity (64 feeds)"
    },
    {
      "code": 6013,
      "name": "oraclePaused",
      "msg": "Oracle is paused — mint and redeem operations are suspended"
    },
    {
      "code": 6014,
      "name": "unauthorized",
      "msg": "Signer is not the oracle authority"
    },
    {
      "code": 6015,
      "name": "noPendingTransfer",
      "msg": "No pending authority transfer exists"
    },
    {
      "code": 6016,
      "name": "invalidCpiMultiplier",
      "msg": "CPI multiplier cannot be zero"
    },
    {
      "code": 6017,
      "name": "cpiUpdateTooSoon",
      "msg": "CPI multiplier update too soon — minimum interval not reached"
    },
    {
      "code": 6018,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow in calculation"
    },
    {
      "code": 6019,
      "name": "divisionByZero",
      "msg": "Division by zero in price calculation"
    },
    {
      "code": 6020,
      "name": "feedMismatch",
      "msg": "Switchboard feed account mismatch — wrong feed passed"
    }
  ],
  "types": [
    {
      "name": "authorityTransferProposed",
      "docs": [
        "Emitted when oracle authority transfer is proposed"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "current",
            "type": "pubkey"
          },
          {
            "name": "proposed",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "authorityTransferred",
      "docs": [
        "Emitted when oracle authority transfer is accepted"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "cpiMultiplierUpdated",
      "docs": [
        "Emitted when CPI multiplier is updated"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "oldMultiplier",
            "type": "u64"
          },
          {
            "name": "newMultiplier",
            "type": "u64"
          },
          {
            "name": "referenceMonth",
            "type": "string"
          },
          {
            "name": "dataSource",
            "type": "string"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "feedEntry",
      "docs": [
        "A single registered price feed entry"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "docs": [
              "Feed symbol, max 12 chars: \"BRLUSD\", \"EURUSD\""
            ],
            "type": "string"
          },
          {
            "name": "switchboardFeed",
            "docs": [
              "Switchboard aggregator account address"
            ],
            "type": "pubkey"
          },
          {
            "name": "feedType",
            "docs": [
              "How to interpret the price value"
            ],
            "type": {
              "defined": {
                "name": "feedType"
              }
            }
          },
          {
            "name": "baseCurrency",
            "docs": [
              "Base currency code, max 8 chars: \"BRL\", \"EUR\""
            ],
            "type": "string"
          },
          {
            "name": "quoteCurrency",
            "docs": [
              "Quote currency code, max 8 chars: \"USD\""
            ],
            "type": "string"
          },
          {
            "name": "decimals",
            "docs": [
              "Price decimals from the feed"
            ],
            "type": "u8"
          },
          {
            "name": "active",
            "docs": [
              "Whether this feed is currently active"
            ],
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "docs": [
              "When was this feed registered"
            ],
            "type": "i64"
          },
          {
            "name": "registeredBy",
            "docs": [
              "Who registered it"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "feedRegistered",
      "docs": [
        "Emitted when a new price feed is registered globally"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "switchboardFeed",
            "type": "pubkey"
          },
          {
            "name": "feedType",
            "type": "string"
          },
          {
            "name": "baseCurrency",
            "type": "string"
          },
          {
            "name": "quoteCurrency",
            "type": "string"
          },
          {
            "name": "registeredBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "feedRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority who can register new feeds"
            ],
            "type": "pubkey"
          },
          {
            "name": "feedCount",
            "docs": [
              "Current number of registered feeds"
            ],
            "type": "u8"
          },
          {
            "name": "feeds",
            "docs": [
              "All registered feeds"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "feedEntry"
                }
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feedType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "direct"
          },
          {
            "name": "inverse"
          },
          {
            "name": "cpiIndexed"
          },
          {
            "name": "custom",
            "fields": [
              {
                "name": "numerator",
                "type": "u64"
              },
              {
                "name": "denominator",
                "type": "u64"
              },
              {
                "name": "baseType",
                "docs": [
                  "0 = Direct after scaling, 1 = Inverse after scaling"
                ],
                "type": "u8"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "getQuoteParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inputAmount",
            "docs": [
              "Input amount: USD cents for mint, token base units for redeem"
            ],
            "type": "u64"
          },
          {
            "name": "minOutput",
            "docs": [
              "Minimum acceptable output (slippage floor)"
            ],
            "type": "u64"
          },
          {
            "name": "nonce",
            "docs": [
              "Caller-provided nonce to avoid PDA collision between quotes"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "initializeOracleParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feedSymbol",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "maxStalenessSecs",
            "type": "i64"
          },
          {
            "name": "mintFeeBps",
            "type": "u16"
          },
          {
            "name": "redeemFeeBps",
            "type": "u16"
          },
          {
            "name": "maxConfidenceBps",
            "type": "u16"
          },
          {
            "name": "quoteValiditySecs",
            "type": "i64"
          },
          {
            "name": "cpiMultiplier",
            "type": "u64"
          },
          {
            "name": "cpiMinUpdateInterval",
            "type": "i64"
          },
          {
            "name": "cpiDataSource",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "oracleConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "Schema version for future migrations"
            ],
            "type": "u8"
          },
          {
            "name": "mint",
            "docs": [
              "The SSS token mint this oracle prices"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority that can update config, update CPI, pause/unpause"
            ],
            "type": "pubkey"
          },
          {
            "name": "pendingAuthority",
            "docs": [
              "Two-step authority transfer target"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "feedSymbol",
            "docs": [
              "Symbol of the registered feed to use (must exist in FeedRegistry)"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "Human-readable description"
            ],
            "type": "string"
          },
          {
            "name": "maxStalenessSecs",
            "docs": [
              "Maximum seconds since last feed update before price is rejected"
            ],
            "type": "i64"
          },
          {
            "name": "mintFeeBps",
            "docs": [
              "Mint fee in basis points (100 bps = 1%)"
            ],
            "type": "u16"
          },
          {
            "name": "redeemFeeBps",
            "docs": [
              "Redeem fee in basis points"
            ],
            "type": "u16"
          },
          {
            "name": "maxConfidenceBps",
            "docs": [
              "Max allowed confidence interval as % of price (in bps)"
            ],
            "type": "u16"
          },
          {
            "name": "quoteValiditySecs",
            "docs": [
              "Quote validity window in seconds"
            ],
            "type": "i64"
          },
          {
            "name": "cpiMultiplier",
            "docs": [
              "CPI multiplier (fixed-point * 1_000_000). 1.083 = 1_083_000"
            ],
            "type": "u64"
          },
          {
            "name": "cpiLastUpdated",
            "docs": [
              "Timestamp of last CPI update"
            ],
            "type": "i64"
          },
          {
            "name": "cpiMinUpdateInterval",
            "docs": [
              "Minimum seconds between CPI updates"
            ],
            "type": "i64"
          },
          {
            "name": "cpiDataSource",
            "docs": [
              "Source description for CPI data audit trail"
            ],
            "type": "string"
          },
          {
            "name": "paused",
            "docs": [
              "Whether minting/redeeming is suspended"
            ],
            "type": "bool"
          },
          {
            "name": "pauseReason",
            "docs": [
              "Reason for current pause"
            ],
            "type": "string"
          },
          {
            "name": "totalMintedUsd",
            "docs": [
              "Lifetime stats: total USD value minted through oracle"
            ],
            "type": "u64"
          },
          {
            "name": "totalRedeemedUsd",
            "docs": [
              "Lifetime stats: total USD value redeemed through oracle"
            ],
            "type": "u64"
          },
          {
            "name": "totalFeesCollected",
            "docs": [
              "Lifetime stats: total fees collected in token base units"
            ],
            "type": "u64"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "lastUpdatedAt",
            "docs": [
              "Last modification timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "oracleInitialized",
      "docs": [
        "Emitted when a new oracle config is initialized for a mint"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "feedSymbol",
            "type": "string"
          },
          {
            "name": "mintFeeBps",
            "type": "u16"
          },
          {
            "name": "redeemFeeBps",
            "type": "u16"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oracleMint",
      "docs": [
        "Emitted on a successful oracle-priced mint execution"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "usdAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "priceUsed",
            "type": "u64"
          },
          {
            "name": "feedSymbol",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oraclePaused",
      "docs": [
        "Emitted when oracle is paused/unpaused"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oracleRedeem",
      "docs": [
        "Emitted on a successful oracle-priced redemption"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "redeemer",
            "type": "pubkey"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "usdAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "priceUsed",
            "type": "u64"
          },
          {
            "name": "feedSymbol",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pendingQuote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "The SSS token mint"
            ],
            "type": "pubkey"
          },
          {
            "name": "requester",
            "docs": [
              "Who requested the quote"
            ],
            "type": "pubkey"
          },
          {
            "name": "direction",
            "docs": [
              "Mint or Redeem"
            ],
            "type": {
              "defined": {
                "name": "quoteDirection"
              }
            }
          },
          {
            "name": "feedSymbol",
            "docs": [
              "Feed symbol used"
            ],
            "type": "string"
          },
          {
            "name": "inputAmount",
            "docs": [
              "Input amount (USD cents for mint, token units for redeem)"
            ],
            "type": "u64"
          },
          {
            "name": "outputAmount",
            "docs": [
              "Output amount (token units for mint, USD cents for redeem)"
            ],
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "docs": [
              "Fee amount in output units"
            ],
            "type": "u64"
          },
          {
            "name": "priceSnapshot",
            "docs": [
              "Exact price snapshot (fixed-point * 1_000_000)"
            ],
            "type": "u64"
          },
          {
            "name": "validUntil",
            "docs": [
              "Unix timestamp after which this quote is invalid"
            ],
            "type": "i64"
          },
          {
            "name": "minOutput",
            "docs": [
              "Minimum acceptable output (slippage protection)"
            ],
            "type": "u64"
          },
          {
            "name": "used",
            "docs": [
              "Whether consumed"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "nonce",
            "docs": [
              "Caller nonce to prevent PDA collision"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "quoteDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mint"
          },
          {
            "name": "redeem"
          }
        ]
      }
    },
    {
      "name": "quoteGenerated",
      "docs": [
        "Emitted every time a quote is requested"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "quoteId",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "feedSymbol",
            "type": "string"
          },
          {
            "name": "direction",
            "type": "string"
          },
          {
            "name": "inputAmount",
            "type": "u64"
          },
          {
            "name": "outputAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "priceUsed",
            "type": "u64"
          },
          {
            "name": "validUntil",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "quoteResult",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "outputAmount",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "priceUsed",
            "type": "u64"
          },
          {
            "name": "validUntil",
            "type": "i64"
          },
          {
            "name": "quoteAccount",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "registerFeedParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "feedType",
            "type": {
              "defined": {
                "name": "feedType"
              }
            }
          },
          {
            "name": "baseCurrency",
            "type": "string"
          },
          {
            "name": "quoteCurrency",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "updateCpiParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newMultiplier",
            "docs": [
              "New CPI multiplier (fixed-point * 1_000_000). 1.083 = 1_083_000"
            ],
            "type": "u64"
          },
          {
            "name": "referenceMonth",
            "docs": [
              "Reference month string, e.g. \"2026-01\""
            ],
            "type": "string"
          },
          {
            "name": "dataSource",
            "docs": [
              "Data source URL/description for audit trail"
            ],
            "type": "string"
          }
        ]
      }
    }
  ]
};

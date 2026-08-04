/**
 * Authoritative JSON Schema for cool.receipt.v1, embedded for offline use.
 *
 * SOURCE OF TRUTH: cool-spec/receipt-format/receipt.schema.json. This copy is
 * kept byte-identical to that file; a conformance test asserts the match when
 * the spec repo is present. Do not edit by hand — regenerate from cool-spec.
 *
 * What this proves: the structural shape of a receipt only.
 * What this does NOT prove: authenticity — that is the signature/hash layers.
 */
export declare const RECEIPT_SCHEMA: {
    readonly $schema: "https://json-schema.org/draft/2020-12/schema";
    readonly $id: "https://cool.northwindcipher.dev/schemas/cool.receipt.v1.json";
    readonly title: "cool.receipt.v1";
    readonly description: "A CooL evidentiary receipt. Proves WHAT was computed (which model, on which committed input, producing which committed output, and when) and that the record is unforged. It proves NOTHING about whether the output is correct, fair, unbiased, safe, or policy-compliant.";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["schema", "record", "binding_hash", "inclusion", "sth", "attestation", "anchor", "key_directory"];
    readonly properties: {
        readonly schema: {
            readonly const: "cool.receipt.v1";
        };
        readonly record: {
            readonly $ref: "#/$defs/signedRecord";
        };
        readonly binding_hash: {
            readonly $ref: "#/$defs/multihash";
        };
        readonly inclusion: {
            readonly oneOf: readonly [{
                readonly $ref: "#/$defs/inclusion";
            }, {
                readonly type: "null";
            }];
        };
        readonly sth: {
            readonly oneOf: readonly [{
                readonly $ref: "#/$defs/sth";
            }, {
                readonly type: "null";
            }];
        };
        readonly attestation: {
            readonly $ref: "#/$defs/attestation";
        };
        readonly anchor: {
            readonly description: "On-chain anchor. ABSENT in this build: always null (anchoring is PLANNED, not implemented).";
            readonly type: "null";
        };
        readonly key_directory: {
            readonly $ref: "#/$defs/keyDirectory";
        };
    };
    readonly $defs: {
        readonly multihash: {
            readonly type: "string";
            readonly pattern: "^mh:sha256:[0-9a-f]{64}$";
            readonly description: "Multihash-tagged SHA-256 digest.";
        };
        readonly hexField: {
            readonly type: "string";
            readonly pattern: "^hex:[0-9a-f]{32}$";
            readonly description: "A 16-byte salt, hex-encoded with a 'hex:' prefix.";
        };
        readonly base64Field: {
            readonly type: "string";
            readonly pattern: "^base64:[A-Za-z0-9+/]*={0,2}$";
            readonly description: "Base64-encoded bytes with a 'base64:' prefix (keys, signatures).";
        };
        readonly ulid: {
            readonly type: "string";
            readonly pattern: "^[0-9A-HJKMNP-TV-Z]{26}$";
            readonly description: "Crockford base32 ULID.";
        };
        readonly signatureAlg: {
            readonly const: "ml-dsa-65+ed25519";
        };
        readonly signatureBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["alg", "key_id", "ml_dsa", "ed25519"];
            readonly properties: {
                readonly alg: {
                    readonly $ref: "#/$defs/signatureAlg";
                };
                readonly key_id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly ml_dsa: {
                    readonly $ref: "#/$defs/base64Field";
                };
                readonly ed25519: {
                    readonly $ref: "#/$defs/base64Field";
                };
            };
        };
        readonly timeBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["issued_at", "seq"];
            readonly properties: {
                readonly issued_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
                readonly seq: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
            };
        };
        readonly modelBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "version", "weights_hash", "provider"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly version: {
                    readonly type: "string";
                };
                readonly weights_hash: {
                    readonly $ref: "#/$defs/multihash";
                };
                readonly provider: {
                    readonly type: "string";
                };
            };
        };
        readonly requestBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["input_hash", "input_salt", "params_hash"];
            readonly properties: {
                readonly input_hash: {
                    readonly $ref: "#/$defs/multihash";
                };
                readonly input_salt: {
                    readonly $ref: "#/$defs/hexField";
                };
                readonly params_hash: {
                    readonly $ref: "#/$defs/multihash";
                };
            };
        };
        readonly responseBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["output_hash", "output_salt"];
            readonly properties: {
                readonly output_hash: {
                    readonly $ref: "#/$defs/multihash";
                };
                readonly output_salt: {
                    readonly $ref: "#/$defs/hexField";
                };
            };
        };
        readonly runtimeBlock: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["tee_vendor", "mode", "enclave_measurement", "tee_quote"];
            readonly description: "Runtime/attestation block. MOCK in this build: no hardware quote exists.";
            readonly properties: {
                readonly tee_vendor: {
                    readonly const: "none";
                };
                readonly mode: {
                    readonly const: "mock";
                };
                readonly enclave_measurement: {
                    readonly type: "null";
                };
                readonly tee_quote: {
                    readonly type: "null";
                };
            };
        };
        readonly signedRecord: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["schema", "record_id", "time", "model", "request", "response", "runtime", "signature"];
            readonly properties: {
                readonly schema: {
                    readonly const: "cool.inference.v1";
                };
                readonly record_id: {
                    readonly $ref: "#/$defs/ulid";
                };
                readonly time: {
                    readonly $ref: "#/$defs/timeBlock";
                };
                readonly model: {
                    readonly $ref: "#/$defs/modelBlock";
                };
                readonly request: {
                    readonly $ref: "#/$defs/requestBlock";
                };
                readonly response: {
                    readonly $ref: "#/$defs/responseBlock";
                };
                readonly runtime: {
                    readonly $ref: "#/$defs/runtimeBlock";
                };
                readonly signature: {
                    readonly $ref: "#/$defs/signatureBlock";
                };
            };
        };
        readonly inclusion: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["leaf_index", "tree_size", "audit_path"];
            readonly properties: {
                readonly leaf_index: {
                    readonly type: "integer";
                    readonly minimum: 0;
                };
                readonly tree_size: {
                    readonly type: "integer";
                    readonly minimum: 1;
                };
                readonly audit_path: {
                    readonly type: "array";
                    readonly items: {
                        readonly $ref: "#/$defs/multihash";
                    };
                };
            };
        };
        readonly witness: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["id", "external", "alg", "ml_dsa", "ed25519"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly external: {
                    readonly type: "boolean";
                };
                readonly alg: {
                    readonly $ref: "#/$defs/signatureAlg";
                };
                readonly ml_dsa: {
                    readonly $ref: "#/$defs/base64Field";
                };
                readonly ed25519: {
                    readonly $ref: "#/$defs/base64Field";
                };
            };
        };
        readonly sth: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["log_id", "tree_size", "root_hash", "timestamp", "signature", "witnesses"];
            readonly properties: {
                readonly log_id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly tree_size: {
                    readonly type: "integer";
                    readonly minimum: 1;
                };
                readonly root_hash: {
                    readonly $ref: "#/$defs/multihash";
                };
                readonly timestamp: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
                readonly signature: {
                    readonly $ref: "#/$defs/signatureBlock";
                };
                readonly witnesses: {
                    readonly type: "array";
                    readonly items: {
                        readonly $ref: "#/$defs/witness";
                    };
                };
            };
        };
        readonly attestation: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["mode", "note"];
            readonly description: "Attestation block. MOCK in this build: no hardware quote. Never reported as verified.";
            readonly properties: {
                readonly mode: {
                    readonly const: "mock";
                };
                readonly note: {
                    readonly type: "string";
                };
            };
        };
        readonly directoryEntry: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["ml_dsa_pub", "ed25519_pub"];
            readonly properties: {
                readonly ml_dsa_pub: {
                    readonly $ref: "#/$defs/base64Field";
                };
                readonly ed25519_pub: {
                    readonly $ref: "#/$defs/base64Field";
                };
            };
        };
        readonly keyDirectory: {
            readonly type: "object";
            readonly minProperties: 1;
            readonly additionalProperties: {
                readonly $ref: "#/$defs/directoryEntry";
            };
        };
    };
};

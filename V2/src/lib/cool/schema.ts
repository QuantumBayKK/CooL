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
export const RECEIPT_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://cool.northwindcipher.dev/schemas/cool.receipt.v1.json",
  "title": "cool.receipt.v1",
  "description": "A CooL evidentiary receipt. Proves WHAT was computed (which model, on which committed input, producing which committed output, and when) and that the record is unforged. It proves NOTHING about whether the output is correct, fair, unbiased, safe, or policy-compliant.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "record",
    "binding_hash",
    "inclusion",
    "sth",
    "attestation",
    "anchor",
    "key_directory"
  ],
  "properties": {
    "schema": {
      "const": "cool.receipt.v1"
    },
    "record": {
      "$ref": "#/$defs/signedRecord"
    },
    "binding_hash": {
      "$ref": "#/$defs/multihash"
    },
    "inclusion": {
      "oneOf": [
        {
          "$ref": "#/$defs/inclusion"
        },
        {
          "type": "null"
        }
      ]
    },
    "sth": {
      "oneOf": [
        {
          "$ref": "#/$defs/sth"
        },
        {
          "type": "null"
        }
      ]
    },
    "attestation": {
      "$ref": "#/$defs/attestation"
    },
    "anchor": {
      "description": "On-chain anchor. ABSENT in this build: always null (anchoring is PLANNED, not implemented).",
      "type": "null"
    },
    "key_directory": {
      "$ref": "#/$defs/keyDirectory"
    }
  },
  "$defs": {
    "multihash": {
      "type": "string",
      "pattern": "^mh:sha256:[0-9a-f]{64}$",
      "description": "Multihash-tagged SHA-256 digest."
    },
    "hexField": {
      "type": "string",
      "pattern": "^hex:[0-9a-f]{32}$",
      "description": "A 16-byte salt, hex-encoded with a 'hex:' prefix."
    },
    "base64Field": {
      "type": "string",
      "pattern": "^base64:[A-Za-z0-9+/]*={0,2}$",
      "description": "Base64-encoded bytes with a 'base64:' prefix (keys, signatures)."
    },
    "ulid": {
      "type": "string",
      "pattern": "^[0-9A-HJKMNP-TV-Z]{26}$",
      "description": "Crockford base32 ULID."
    },
    "signatureAlg": {
      "const": "ml-dsa-65+ed25519"
    },
    "signatureBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "alg",
        "key_id",
        "ml_dsa",
        "ed25519"
      ],
      "properties": {
        "alg": {
          "$ref": "#/$defs/signatureAlg"
        },
        "key_id": {
          "type": "string",
          "minLength": 1
        },
        "ml_dsa": {
          "$ref": "#/$defs/base64Field"
        },
        "ed25519": {
          "$ref": "#/$defs/base64Field"
        }
      }
    },
    "timeBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "issued_at",
        "seq"
      ],
      "properties": {
        "issued_at": {
          "type": "string",
          "format": "date-time"
        },
        "seq": {
          "type": "integer",
          "minimum": 0
        }
      }
    },
    "modelBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "version",
        "weights_hash",
        "provider"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string"
        },
        "weights_hash": {
          "$ref": "#/$defs/multihash"
        },
        "provider": {
          "type": "string"
        }
      }
    },
    "requestBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "input_hash",
        "input_salt",
        "params_hash"
      ],
      "properties": {
        "input_hash": {
          "$ref": "#/$defs/multihash"
        },
        "input_salt": {
          "$ref": "#/$defs/hexField"
        },
        "params_hash": {
          "$ref": "#/$defs/multihash"
        }
      }
    },
    "responseBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "output_hash",
        "output_salt"
      ],
      "properties": {
        "output_hash": {
          "$ref": "#/$defs/multihash"
        },
        "output_salt": {
          "$ref": "#/$defs/hexField"
        }
      }
    },
    "runtimeBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "tee_vendor",
        "mode",
        "enclave_measurement",
        "tee_quote"
      ],
      "description": "Runtime/attestation block. MOCK in this build: no hardware quote exists.",
      "properties": {
        "tee_vendor": {
          "const": "none"
        },
        "mode": {
          "const": "mock"
        },
        "enclave_measurement": {
          "type": "null"
        },
        "tee_quote": {
          "type": "null"
        }
      }
    },
    "signedRecord": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "schema",
        "record_id",
        "time",
        "model",
        "request",
        "response",
        "runtime",
        "signature"
      ],
      "properties": {
        "schema": {
          "const": "cool.inference.v1"
        },
        "record_id": {
          "$ref": "#/$defs/ulid"
        },
        "time": {
          "$ref": "#/$defs/timeBlock"
        },
        "model": {
          "$ref": "#/$defs/modelBlock"
        },
        "request": {
          "$ref": "#/$defs/requestBlock"
        },
        "response": {
          "$ref": "#/$defs/responseBlock"
        },
        "runtime": {
          "$ref": "#/$defs/runtimeBlock"
        },
        "signature": {
          "$ref": "#/$defs/signatureBlock"
        }
      }
    },
    "inclusion": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "leaf_index",
        "tree_size",
        "audit_path"
      ],
      "properties": {
        "leaf_index": {
          "type": "integer",
          "minimum": 0
        },
        "tree_size": {
          "type": "integer",
          "minimum": 1
        },
        "audit_path": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/multihash"
          }
        }
      }
    },
    "witness": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "external",
        "alg",
        "ml_dsa",
        "ed25519"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "external": {
          "type": "boolean"
        },
        "alg": {
          "$ref": "#/$defs/signatureAlg"
        },
        "ml_dsa": {
          "$ref": "#/$defs/base64Field"
        },
        "ed25519": {
          "$ref": "#/$defs/base64Field"
        }
      }
    },
    "sth": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "log_id",
        "tree_size",
        "root_hash",
        "timestamp",
        "signature",
        "witnesses"
      ],
      "properties": {
        "log_id": {
          "type": "string",
          "minLength": 1
        },
        "tree_size": {
          "type": "integer",
          "minimum": 1
        },
        "root_hash": {
          "$ref": "#/$defs/multihash"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time"
        },
        "signature": {
          "$ref": "#/$defs/signatureBlock"
        },
        "witnesses": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/witness"
          }
        }
      }
    },
    "attestation": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "mode",
        "note"
      ],
      "description": "Attestation block. MOCK in this build: no hardware quote. Never reported as verified.",
      "properties": {
        "mode": {
          "const": "mock"
        },
        "note": {
          "type": "string"
        }
      }
    },
    "directoryEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "ml_dsa_pub",
        "ed25519_pub"
      ],
      "properties": {
        "ml_dsa_pub": {
          "$ref": "#/$defs/base64Field"
        },
        "ed25519_pub": {
          "$ref": "#/$defs/base64Field"
        }
      }
    },
    "keyDirectory": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "$ref": "#/$defs/directoryEntry"
      }
    }
  }
} as const;

// Hardware attestation domain.
//
// HONESTY BOUNDARY — READ THIS:
// Real TEE attestation requires running inside genuine confidential hardware
// (Intel TDX via Phala dstack) and verifying the quote's signature chain to the
// Intel SGX/TDX Root CA with dcap-qvl. This laptop is NOT a TEE, so we CANNOT
// produce a real quote here. This module returns an HONESTLY-LABELED simulated
// attestation and shows exactly what real hardware would add. Nothing here is
// presented as a genuine hardware proof.

export function getAttestation() {
  return {
    mode: 'SIMULATED',
    honest_note:
      'This is a software-only demo. On real Phala TDX, this becomes a genuine Intel TDX quote ' +
      'verified via dcap-qvl to the Intel Root CA. The two domains below flip from "simulated" to "pass".',
    would_provide_on_real_hardware: {
      tee: 'Intel TDX',
      quote: '<Intel TDX quote, verified to Intel Root CA via dcap-qvl>',
      measurements: {
        MRTD: '<measurement of the trusted domain>',
        RTMR0_3: '<runtime measurement registers>',
        compose_hash: '<hash of the exact container image that ran, bound into RTMR3>',
      },
      tcb_status: 'UpToDate (would be checked against Intel TCB info)',
      report_data: '<fresh nonce bound to this record — defeats replay>',
      key_sealing: 'signing key sealed to enclave measurement via dstack-KMS',
    },
  };
}

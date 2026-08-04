# The CooL evidence plane, as a container Phala can deploy.
#
# Deliberately thin: the CLI is the evidence plane, and inside a CVM it needs
# exactly one thing from the host — the dstack guest agent's socket. Everything
# else (keys, quotes, the log) is derived or created inside the enclave, which is
# the entire point. There is nothing to configure that could leak.
FROM node:22-alpine

# Pinned by version, not by tag drift: the image's digest is what gets measured
# into MRTD, so "which code is running" must be answerable from this file alone.
ARG COOL_VERSION=2.5.0
RUN npm install -g cool-nwc@${COOL_VERSION} && cool --version

# Evidence lives on a volume so a redeploy does not orphan the log. The signing
# key is NOT here — it is re-derived from the measurement on every boot.
WORKDIR /evidence
VOLUME /evidence

# Fail the container if the wiring is wrong, rather than serving a plane that
# quietly produces simulated receipts inside a real CVM.
HEALTHCHECK --interval=60s --timeout=20s --start-period=15s \
  CMD cool doctor || exit 1

# On boot: prove the wiring, then hold the CVM open. `cool wire` exits non-zero
# until a vendor-rooted quote verifies, so a failed deployment is visible in the
# logs instead of being discovered at audit time.
CMD ["sh", "-c", "cool wire; cool status; tail -f /dev/null"]

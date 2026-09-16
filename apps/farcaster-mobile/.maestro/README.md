# Maestro E2E (farcaster-mobile)

Black-box end-to-end tests driven by [Maestro](https://maestro.mobile.dev). Two
flows today, executed in order:

1. `flows/auth/sign-in-with-recovery-phrase.yaml` — cold-launches with cleared
   state, enters the recovery phrase, asserts the home feed renders.
2. `flows/feed/tap-first-cast.yaml` — launches without clearing state (inherits
   the signed-in session), taps the first cast, asserts the cast detail screen.

Maestro does not clear app state between flows unless a flow opts in with
`launchApp: clearState: true`, so the sign-in step runs once per suite
invocation and downstream flows skip the slow mnemonic-entry path.

## Layout

```
.maestro/
├── config.yaml                          Workspace config + flowsOrder.
├── fixtures/
│   └── test-account.env.example         Copy to test-account.env for local runs.
└── flows/
    ├── auth/
    │   └── sign-in-with-recovery-phrase.yaml
    └── feed/
        └── tap-first-cast.yaml
```

## Required env vars

| Var                   | Where it's used                                | Notes                                                                                                                                                        |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `APP_ID`              | All flows (`appId: ${APP_ID}`)                 | Set per-platform: `com.farcaster.mobile-client` (iOS) or `com.farcaster.mobile` (Android). The `pnpm e2e:ios` / `pnpm e2e:android` scripts set this for you. |
| `E2E_RECOVERY_PHRASE` | `flows/auth/sign-in-with-recovery-phrase.yaml` | 12 or 24 word BIP-39 mnemonic for the dedicated E2E test FID. Quote the value so spaces survive. The FID is derived from this at sign-in time.               |

Generated automatically per run (do not set):

| Var              | Source                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `MAESTRO_RUN_ID` | `pnpm e2e:*` scripts set this to `$(date +%s)-$(git rev-parse --short HEAD)` for cast-content disambiguation in future flows. |

## Local quickstart

1. Install Maestro (one-time):
   ```bash
   pnpm e2e:install
   ```
2. Copy the env template and fill in the recovery phrase:
   ```bash
   cp .maestro/fixtures/test-account.env.example .maestro/fixtures/test-account.env
   $EDITOR .maestro/fixtures/test-account.env
   ```
3. Build + install the app on a booted simulator/emulator (one-time per native
   change). For iOS, use an Expo dev client or an EAS simulator artifact; for
   Android, an APK from `eas build --profile preview`.
4. Run the smoke flow:
   ```bash
   pnpm e2e:ios       # boots first available iOS simulator
   pnpm e2e:android   # uses the first booted Android emulator
   ```

To author or debug flows interactively:

```bash
pnpm e2e:studio
```

## CI

`.github/workflows/mobile-e2e.yml` runs this suite on `workflow_dispatch`
against [BrowserStack App Automate](https://www.browserstack.com/docs/app-automate/maestro/get-started)'s
managed real-device fleet. The matrix runs iOS and Android concurrently;
BrowserStack's single parallel slot queues the Maestro execution tails
if both jobs reach it at the same moment.

Dispatch inputs:

| Input            | Default               | Notes                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------ |
| `platform`       | `all`                 | `all`, `ios`, or `android`. Picks which matrix legs actually run.  |
| `ios_device`     | `iPhone 15-17`        | BrowserStack device-OS string.                                     |
| `android_device` | `Google Pixel 7-13.0` | ibid. Pixel 9 ships Android 15 and is rejected as `Pixel 9-14.0`. |

Each selected platform's job runs `eas build --profile internal
--non-interactive --json --wait` inline, parses `artifacts.buildUrl`
from the resulting JSON, downloads the `.ipa` / `.apk` to the runner,
and feeds it into BrowserStack. The build is the bulk of the wall time
(~15-25 min per platform); the Maestro execution after that is
~5-10 min.

Required repo secrets:

| Secret                    | Source                                                                            |
| ------------------------- | --------------------------------------------------------------------------------- |
| `BROWSERSTACK_USERNAME`   | browserstack.com → Account → Profile                                              |
| `BROWSERSTACK_ACCESS_KEY` | ibid.                                                                             |
| `E2E_RECOVERY_PHRASE`     | BIP-39 mnemonic for the test FID. **Not masked on the BrowserStack dashboard** — treat the FID as compromised-by-design and restrict dashboard access. |
| `EXPO_TOKEN`              | EAS auth. Same secret consumed by `mobile-internal-release.yml`.                  |

Failure artifacts (video, network logs, device logs, screenshots) live
on the BrowserStack dashboard; the workflow step summary links directly
to the per-build page.

## Known limitations / follow-ups

- **PR trigger.** The workflow is `workflow_dispatch` only. Flipping
  on `pull_request` is a deliberate follow-up — kept off until the
  suite proves stable, so a 30+ min EAS build per PR can't block
  unrelated work during the hardening period.
- **Auth speed.** Mnemonic entry is the slowest, flakiest step. A
  debug-only `__E2E__` deeplink that bypasses sign-in would cut wall
  time by 30+ seconds per flow and would also retire the dashboard
  visibility concern on `E2E_RECOVERY_PHRASE`.

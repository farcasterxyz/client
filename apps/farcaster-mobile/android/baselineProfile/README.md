# Baseline Profile

Generates an Android Baseline Profile to AOT-compile hot startup paths and reduce
slow cold starts on mid/low-end devices.

## Generate

Connect a device (or rely on the managed `pixel6Api31` AVD) and run:

```
cd apps/farcaster-mobile/android
./gradlew :app:generateReleaseBaselineProfile
```

The profile is written to:

```
apps/farcaster-mobile/android/app/src/release/generated/baselineProfiles/baseline-prof.txt
```

Commit the resulting file. AGP picks it up automatically on the next release build,
and `androidx.profileinstaller` (added to `:app`) installs it at first launch.

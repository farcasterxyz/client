#!/bin/bash

# Maximum size of a single file in KB
max_file_size_kb=500

# These are files that we can't reduce the size of for one reason or another.
# We should try really hard to keep this list small.
ignored_files=$(cat << EOF
pnpm-lock.yaml
apps/farcaster-web/public/~/channel-images/all-channels.png
apps/farcaster-web/public/~/images/never_feel_left_out.svg
apps/farcaster-web/public/~/images/swap_in_seconds.svg
apps/farcaster-web/public/~/images/DepositBonusesSplash.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/image.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/image@2x.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/image@3x.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/dark_image.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/dark_image@2x.png
apps/farcaster-mobile/ios/Farcaster/Images.xcassets/SplashScreenLogo.imageset/dark_image@3x.png
apps/farcaster-mobile/src/screens/CollectibleCast/collectibleCastIntro.png
apps/farcaster-mobile/src/assets/images/deposit-bonuses-splash.png
apps/farcaster-mobile/src/screens/WalletSwap/intro.png
apps/farcaster-wallet/public/canvaskit.wasm
apps/farcaster-web/public/~/images/referrals-background.png
apps/farcaster-web/public/~/images/referrals-background-mobile.png
apps/farcaster-web/src/pages/homeLanding/LandingVideo.mp4
patches/lucide-react-native@0.542.0.patch
packages/farcaster-client-data/bin/types.yml
EOF
)

failed=false
for filename in $(git ls-files); do
  filesize_kb=$(du -k "$filename" | cut -f1)

  # Ignore all sitemap files
  if [[ "$filename" == apps/farcaster-web/public/sitemaps/* ]]; then
    echo "Ignoring $filename ($filesize_kb KB)" >/dev/stderr
    continue
  fi

  if grep -q "^$filename$" <(echo "$ignored_files"); then
    echo "Ignoring $filename ($filesize_kb KB)" >/dev/stderr
    continue
  fi

  if (( filesize_kb > max_file_size_kb )); then
    echo "$filename is $filesize_kb KB (> $max_file_size_kb KB)" >/dev/stderr
    failed=true
  fi
done

if $failed; then
  exit 1
fi

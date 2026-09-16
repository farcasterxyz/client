#!/bin/bash
set -eu

bucket="${S3_BUCKET}"
cf_id="${CF_DISTRIBUTION_ID}"
keep_deploys="${KEEP_NUM_DEPLOYS:-5}"
release_id="${RELEASE_ID}"

time="$(date '+%Y-%m-%d_%H-%M-%S')"
time_meta="$(echo ${time} | tr -d _-)"
hash="$(git rev-parse --short=7 HEAD)"
deploy_dir="__deploy_${time}_${hash}"

echo "Deploying git commit ${hash} at time ${time} to bucket ${bucket}, deploy dir ${deploy_dir}, keeping last ${keep_deploys} deploys"

echo "Uploading to s3://${bucket}/${deploy_dir}/"
echo "Commit: ${hash}" > dist/__version.txt
echo "Deployed: ${time_meta}" >> dist/__version.txt
echo "Release: ${release_id}" >> dist/__version.txt

aws s3 sync ./dist/ s3://${bucket}/${deploy_dir} --delete --exclude "*.html" --cache-control "public, max-age=3600, immutable" --metadata "deploy-time=${time_meta},deploy-commit=${hash}"
aws s3 sync ./dist/ s3://${bucket}/${deploy_dir} --exclude "*" --include "*.html" --cache-control "no-cache" --metadata "deploy-time=${time_meta},deploy-commit=${hash}"

echo "Copying all files except index.html to bucket root"
aws s3 cp s3://${bucket}/${deploy_dir}/ s3://${bucket}/ --recursive --exclude "*.html" --cache-control "public, max-age=3600, immutable"

echo "Copying index.html to bucket root"
aws s3 cp s3://${bucket}/${deploy_dir}/index.html s3://${bucket}/index.html --cache-control "no-cache"

echo "Invalidating CloudFront distribution"
aws cloudfront create-invalidation --distribution-id ${cf_id} --paths "/*"

echo "Checking for old deploys to remove"
delete_deploys_from=$(($keep_deploys + 1))
for old_deploy_dir in $( \
    aws s3 ls s3://${bucket} | \
    grep -E '__deploy_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}_[a-z0-9]{7}/$' | \
    tr -s ' ' | \
    cut -d ' ' -f 3 | \
    sort -r | \
    tail -n +${delete_deploys_from} \
  ); do
    echo "Removing old deploy directory s3://${bucket}/${old_deploy_dir}"
    aws s3 rm --recursive s3://${bucket}/${old_deploy_dir}
done

echo "Deploy succeeded"

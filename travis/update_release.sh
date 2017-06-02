#!/bin/bash

# ==============================================================================
# Creates or updates a GitHub release and uploads release artifacts for builds 
# initiated by a tag. Does nothing if the# build is not associated with a tag.
#
# Uses curl to performs CRUD operations on the GitHub Repos/Releases REST API.
#
# Uses jq to process the REST API JSON results. jq should be installed before 
# this script is executed, e.g., in the .travis.yml "before_script" block:
#       sudo apt-get install -qq jq
# See https://stedolan.github.io/jq/manual/ for jq documentation.
#
# Uses Git to update tags in the repo. Git commands using authentication are 
# redirected to /dev/null to prevent leaking # the access token into the log.
# ==============================================================================

# Ensure shell commands are not echoed in the log to prevent leaking the access token.
set +x

# Ensure the GitHub Personal Access Token for GitHub exists
if [[ -z "$GITHUB_API_KEY" ]]; then
    echo "$0 error: You must export the GITHUB_API_KEY containing the personal access token for Travis\; GitHub was not updated."
    exit 1
fi

# GitHub RESTful API URLs
RELEASES_URL="https://api.github.com/repos/emxsys/worldwindserverkit/releases"
TAGS_URL="https://api.github.com/repos/emxsys/worldwindserverkit/tags"
UPLOADS_URL="https://uploads.github.com/repos/emxsys/worldwindserverkit/releases"
DOWNLOADS_URL="https://github.com/emxsys/worldwindserverkit/releases/download"

# Get the GitHub remote origin URL
REMOTE_URL=$(git config --get remote.origin.url) > /dev/null
# Add the GitHub authentication token if it's not already embedded in the URL (test if an "@" sign is present)
if [[ $REMOTE_URL != *"@"* ]]; then
    # Use the stream editor to inject the GitHub authentication token into the remote url after the protocol
    # Example:  https://github.com/.../repo.git -> https://<token>@github.com/.../repo.git
    REMOTE_URL=$(echo $REMOTE_URL | sed -e "s#://#://$GITHUB_API_KEY@#g") > /dev/null
fi

# Just a heads up, in a tagged build, Travis cloned the repo into a branch named 
# with the tag, thus the variable TRAVIS_BRANCH contains the tag name, not 
# "master" or "develop" like you might expect. Thus testing if the tag was made 
# on a particular branch cannot be done using the TRAVIS_BRANCH var in tagged build.

# Initialize the release variables predicated on the tag. 
if [[ -n $TRAVIS_TAG ]]; then # a tagged build; prepare a draft release
    RELEASE_NAME=$TRAVIS_TAG
    DRAFT="true"
    PRERELEASE="false"
else # build is not associated with a tag; exit without error
    echo "Skipping release updates as this is not a tagged build"
    exit 0
fi

# ===========================
# GitHub Release Maintenance
# ===========================

# Query the release ids for releases with with the given name. If there's more 
# than one, then we'll use the first. In order to see draft releases, we need to 
# authenticate with a user that has push access to the repo.
RELEASE_ARRAY=( \
    $(curl --silent --header "Authorization: token ${GITHUB_API_KEY}" ${RELEASES_URL} \
    | jq --arg name "${RELEASE_NAME}" '.[] | select(.name == $name) | .id') \
    ) > /dev/null

# Get the first id returned from the query
RELEASE_ID=${RELEASE_ARRAY[0]}

# Update the GitHub releases (create if release id's length == 0)
if [[ ${#RELEASE_ID} -eq 0 ]]; then
    # Emit a log message for the new release
    echo "Creating release ${RELEASE_NAME} with tag ${TRAVIS_TAG}"

    # Build the JSON (Note: single quotes inhibit variable substitution, must use escaped double quotes)
    # Note: the tag already exists, so the "target_commitish" parameter is not used
    JSON_DATA="{ \
      \"tag_name\": \"${TRAVIS_TAG}\", \
      \"name\": \"${RELEASE_NAME}\", \
      \"draft\": ${DRAFT}, \
      \"prerelease\": ${PRERELEASE} \
    }"

    # Create the release on GitHub and retrieve the JSON result
    RELEASE=$(curl --silent \
    --header "Authorization: token ${GITHUB_API_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "${JSON_DATA}" \
    --request POST ${RELEASES_URL}) > /dev/null

    # Extract the newly created release id from the JSON result
    RELEASE_ID=$(echo $RELEASE | jq '.id')
else
    # Emit a log message for the updated release
    echo "Updating release ${RELEASE_NAME} with tag ${TRAVIS_TAG}"

    # Define the patch data to update the tag_name
    JSON_DATA="{ \
        \"tag_name\": \"${TRAVIS_TAG}\" \
     }"

    # Update the release on GitHub
    curl --silent \
    --header "Authorization: token ${GITHUB_API_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "${JSON_DATA}" \
    --request PATCH ${RELEASES_URL}/${RELEASE_ID} > /dev/null
fi

# Assert that we found a GitHub release id for the current branch (release id length > 0)
if [[ ${#RELEASE_ID} -eq 0 ]]; then
    echo "$0 error: Release $RELEASE_NAME was not found. No artifacts were uploaded to GitHub releases."
    exit 0
fi

# =================
# Release Artifacts
# =================

# Emit a log message for the updated release
echo "Uploading release assets for ${RELEASE_NAME}"

# Get array of files in the WWSK distribution folder;
DIST_FILES=(worldwind-geoserver-dist/target/*)

# Process the array; using quotes to handle spaces in file names
for FILE in "${DIST_FILES[@]}"
do
    # Only process files; skip folders
    if [[ ! -f "$FILE" ]]; then
        continue
    fi
    # Use quotes to handle spaces in file names
    FILENAME=$(basename "$FILE")

    echo "Query for existing $FILENAME asset"
    # Remove the old release asset if it exists (asset id length > 0)
    # Query the GitHub assets with curl and parse the result with jq. 
    # See the jq manual for more info: https://stedolan.github.io/jq/manual/
    # Note: We're using the "jq --arg name value" command-line option to create 
    # a predefined $filename variable. 
    # TODO: I'm not sure this would handle embedded spaces in a filename.
    RESPONSE=$(curl ${RELEASES_URL}/${RELEASE_ID}/assets)
    echo $RESPONSE
    ASSET_ID=$(echo $RESPONSE | jq --arg filename ${FILENAME} '.[] | select(.name == $filename) | .id')
    if [ ${#ASSET_ID} -gt 0 ]; then
        echo "Deleting $FILENAME"
        curl -include --header "Authorization: token ${GITHUB_API_KEY}" --request DELETE ${RELEASES_URL}/assets/${ASSET_ID}
    fi

    # Upload the new release asset
    echo "Posting $FILENAME"
    curl -include \
    --header "Authorization: token ${GITHUB_API_KEY}" \
    --header "Content-Type: application/vnd.android.package-archive" \
    --header "Accept: application/json" \
    --data-binary @${TRAVIS_BUILD_DIR}/${FILE} \
    --request POST ${UPLOADS_URL}/${RELEASE_ID}/assets?name=${FILENAME}

    # Upload error handling
    RESULT=$?
    if [[ $RESULT -gt 0 ]]; then
        echo "$0 error: curl post failed. Returned $RESULT"
        exit 1
    fi
done

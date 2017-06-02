#!/bin/bash

# ==============================================================================
# Creates or updates a GitHub release. Does nothing if the# build is not 
# associated with a tag. Uses curl to performs CRUD operations on the 
# GitHub Repos/Releases REST API.
#
# Uses jq to process the REST API JSON results. jq should be installed before 
# this script is executed, e.g., in the .travis.yml "before_script" block:
#       sudo apt-get install -qq jq
# See https://stedolan.github.io/jq/manual/ for jq documentation.
#
# Uses Git to update tags in the repo. Git commands using authentication are 
# redirected to /dev/null to prevent leaking # the access token into the log.
#
# Just a heads up, in a tagged build, Travis cloned the repo into a branch named 
# with the tag, thus the variable TRAVIS_BRANCH contains the tag name, not 
# "master" or "develop" like you might expect. Thus testing if the tag was made 
# on a particular branch cannot be done using the TRAVIS_BRANCH var in tagged build.
# ==============================================================================

# Ensure shell commands are not echoed in the log to prevent leaking the access token.
set +x

# Set the prefix to be prepended to the tag to create a release name; may be blank.
RELEASE_PREFIX="WWSK "

# Ensure the GitHub Personal Access Token for GitHub exists
if [[ -z "$GITHUB_API_KEY" ]]; then
    echo "$0 error: You must export the GITHUB_API_KEY containing the personal access token for Travis\; GitHub was not updated."
    exit 1
fi

# Initialize the release variables predicated on the tag. 
if [[ -n $TRAVIS_TAG ]]; then # a tagged build; prepare a draft release
    RELEASE_NAME="${RELEASE_PREFIX}${TRAVIS_TAG}" 
    DRAFT="true"
    PRERELEASE="false"
else # build is not associated with a tag; exit without error
    echo "Skipping release creation as this is not a tagged build"
    exit 0
fi

# ===========================
# GitHub Release Maintenance
# ===========================

# GitHub RESTful API URL
LOWERCASE_REPO_SLUG="$(echo $TRAVIS_REPO_SLUG | tr '[A-Z]' '[a-z]')"
echo "$TRAVIS_REPO_SLUG -> $LOWERCASE_REPO_SLUG"

RELEASES_URL="https://api.github.com/repos/${LOWERCASE_REPO_SLUG}/releases"

# Query the release ids for releases with with the given name. If there's more 
# than one, then we'll use the first. In order to see draft releases, you must 
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
    echo "Creating draft release ${RELEASE_NAME} with tag ${TRAVIS_TAG}"

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
    #RELEASE_ID=$(echo $RELEASE | jq '.id')
else
    # Emit a log message for the updated release
    echo "Updating release ${RELEASE_NAME} with the tag ${TRAVIS_TAG}"

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


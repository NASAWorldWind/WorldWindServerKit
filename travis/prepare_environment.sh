#!/bin/bash

# ===============================================================================================
# Prepares the Travis build environment for the project build and conditional post-build actions.
# ===============================================================================================

# Ensure shell commands are not echoed to the log to prevent leaking any encrypted environment variables
set +x

# Install the jq shell filter so we can extract data from GitHub API JSON results
# See apt configuration: https://docs.travis-ci.com/user/ci-environment/#apt-configuration
sudo apt-get install -qq jq
jq --version

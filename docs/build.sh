#!/bin/bash

# This script must be run in the root project
# directory using  `npm run docs` in order to
# have the `dox` and `doxme` commands in PATH

set -e

dox -r < index.js | doxme > .api
echo '## API' | cat - .api > docs/API.md
rm .api

cat docs/README.md docs/API.md > README.md

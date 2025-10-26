#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
set_list_file="helper/set-list.json"

# Generate JSON array of .json files
{
    echo '{'
    echo '  "sets": ['

    # Pipeline explanation:
    # 1. Find all .json files in card-sets folder
    # 2. Extract just the filename from each path
    # 3. Sort filenames alphabetically
    # 4. Wrap each filename in double quotes
    # 5. Add comma to all lines except the last one
    # 6. Add 4 spaces indentation to each line
    find card-sets -name "*.json" -type f 2>/dev/null | \
    xargs -n1 basename | \
    sort | \
    sed 's/.*/"&"/' | \
    sed '$!s/$/,/' | \
    sed 's/^/    /'

    echo '  ]'
    echo '}'
} > "$set_list_file"

echo "Generated $set_list_file"

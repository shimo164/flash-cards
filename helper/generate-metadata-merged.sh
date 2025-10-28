#!/bin/bash
cd "$(dirname "$0")"

echo '{"sets":[' > set-metadata.json

first=true
for file in ../card-sets/business_*.json; do
    if [[ ! "$file" =~ _L[123]\.json$ ]]; then
        filename=$(basename "$file")
        name=$(jq -r '.name' "$file")
        l1_count=$(jq '.levels.L1 | length' "$file")
        l2_count=$(jq '.levels.L2 | length' "$file")
        l3_count=$(jq '.levels.L3 | length' "$file")
        
        if [ "$first" = true ]; then
            first=false
        else
            echo ',' >> set-metadata.json
        fi
        
        jq -n \
            --arg filename "$filename" \
            --arg name "$name" \
            --argjson l1 "$l1_count" \
            --argjson l2 "$l2_count" \
            --argjson l3 "$l3_count" \
            '{filename: $filename, name: $name, cardCounts: {L1: $l1, L2: $l2, L3: $l3}}' \
            | tr -d '\n' >> set-metadata.json
    fi
done

echo ']}' >> set-metadata.json
echo "Metadata generated!"

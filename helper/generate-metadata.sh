#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
metadata_file="set-metadata.json"
card_set_files=(../card-sets/*.json)

echo '{' > "$metadata_file"
echo '  "sets": [' >> "$metadata_file"

first=true
for file in "${card_set_files[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        name=$(grep '"name"' "$file" | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/')
        cardCount=$(grep -c '"japanese"' "$file")

        if [ "$first" = true ]; then
            first=false
        else
            echo '    ,' >> "$metadata_file"
        fi

        echo "    {" >> "$metadata_file"
        echo "      \"filename\": \"$filename\"," >> "$metadata_file"
        echo "      \"name\": \"$name\"," >> "$metadata_file"
        echo "      \"cardCount\": $cardCount" >> "$metadata_file"
        echo "    }" >> "$metadata_file"
    fi
done

echo '  ]' >> "$metadata_file"
echo '}' >> "$metadata_file"

echo "Created metadata for ${#card_set_files[@]} sets"

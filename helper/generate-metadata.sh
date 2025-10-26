#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
metadata_file="set-metadata.json"
card_set_files=(../card-sets/*.json)

echo '{' > "$metadata_file"
echo '  "sets": [' >> "$metadata_file"

declare -A theme_numbers
theme_counter=1
first=true

for file in "${card_set_files[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        name=$(grep '"name"' "$file" | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/')
        cardCount=$(grep -c '"japanese"' "$file")
        
        # Extract base theme name (remove level suffix)
        base_theme=$(echo "$name" | sed 's/(初級)$//' | sed 's/(中級)$//' | sed 's/(上級)$//')
        
        # Assign number to theme if not already assigned
        if [[ -z "${theme_numbers[$base_theme]:-}" ]]; then
            theme_numbers[$base_theme]=$theme_counter
            ((theme_counter++))
        fi
        
        # Add number to name
        numbered_name="${theme_numbers[$base_theme]}. $name"

        if [ "$first" = true ]; then
            first=false
        else
            echo '    ,' >> "$metadata_file"
        fi

        echo "    {" >> "$metadata_file"
        echo "      \"filename\": \"$filename\"," >> "$metadata_file"
        echo "      \"name\": \"$numbered_name\"," >> "$metadata_file"
        echo "      \"cardCount\": $cardCount" >> "$metadata_file"
        echo "    }" >> "$metadata_file"
    fi
done

echo '  ]' >> "$metadata_file"
echo '}' >> "$metadata_file"

echo "Created metadata for ${#card_set_files[@]} sets"

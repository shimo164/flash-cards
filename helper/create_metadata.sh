#!/bin/bash

cd "$(dirname "$0")"

echo '{' > helper/set-metadata.json
echo '  "sets": [' >> helper/set-metadata.json

first=true
for file in card-sets/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        name=$(grep '"name"' "$file" | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/')
        cardCount=$(grep -c '"japanese"' "$file")
        
        if [ "$first" = true ]; then
            first=false
        else
            echo '    ,' >> helper/set-metadata.json
        fi
        
        echo "    {" >> helper/set-metadata.json
        echo "      \"filename\": \"$filename\"," >> helper/set-metadata.json
        echo "      \"name\": \"$name\"," >> helper/set-metadata.json
        echo "      \"cardCount\": $cardCount" >> helper/set-metadata.json
        echo "    }" >> helper/set-metadata.json
    fi
done

echo '  ]' >> helper/set-metadata.json
echo '}' >> helper/set-metadata.json

echo "Created metadata for $(ls card-sets/*.json | wc -l) sets"

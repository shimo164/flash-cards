#!/bin/bash

cd "$(dirname "$0")/../card-sets"

# Get unique base names (without _L1/L2/L3)
for file in *_L1.json; do
    base="${file%_L1.json}"
    
    # Check if all three levels exist
    if [[ -f "${base}_L1.json" && -f "${base}_L2.json" && -f "${base}_L3.json" ]]; then
        echo "Merging $base..."
        
        # Extract name without level suffix
        name=$(jq -r '.name' "${base}_L1.json" | sed 's/(初級)//')
        
        # Create merged JSON
        jq -n \
            --arg name "$name" \
            --slurpfile l1 "${base}_L1.json" \
            --slurpfile l2 "${base}_L2.json" \
            --slurpfile l3 "${base}_L3.json" \
            '{
                name: $name,
                levels: {
                    L1: $l1[0].cards,
                    L2: $l2[0].cards,
                    L3: $l3[0].cards
                }
            }' > "${base}.json"
        
        echo "Created ${base}.json"
    fi
done

echo "Merge complete!"

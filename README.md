# flash-cards

## What

Practicing English phases by using flash-cards.

## Terms

| Word | Description                      |
| ---- | -------------------------------- |
| Card | 日英のフレーズを表裏に書いたもの |
| Set  | Card のまとまり                  |

## Dev

### How to add card-set

1. Add json file.
   `card-sets/zz_pens.json`. Name "test-pens" will be shown on the menu page as the name of the set.

```json
{
  "name": "test-pens",
  "cards": [
    {
      "japanese": "これはペンです。",
      "english": "This is a pen."
    },
    {
      "japanese": "あれはペンですか。",
      "english": "Is that a pen?"
    }
  ]
}
```

2. Generate set-list. This command generates `helper/set-list.json` from the sorted names of json files in `card-sets/`.

```
bash helper/generate-set-list.sh
```

### dev note

- top page のことを menu としてコード内で書いている。現状 top と menu が同じなので

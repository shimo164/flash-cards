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

1. Re-generate set-list.json and set-metadata.json by running sh files.

```
bash helper/generate-set-list.sh
bash helper/generate-metadata.sh
```

### dev note

- top page のことを menu としてコード内で書いている。現状 top と menu が同じなので

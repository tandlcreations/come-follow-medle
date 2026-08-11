# Come Follow Medle

A scripture-themed five-letter word puzzle based on *Come, Follow Me* readings.

## Play locally

Open [come-follow-medle.html](come-follow-medle.html) in a browser.

The static app is split into `styles.css`, `game.js`, and the generated
`scripture-data.js`. Completed rounds and the selected chapter are saved in
the browser.

## Scripture data

The chapter banks are generated from the English verse text on
ChurchofJesusChrist.org:

```sh
node scripts/build-scripture-data.mjs
node scripts/validate-data.mjs
```

The build command requires internet access. The validation command is local
and confirms that chapter records, five-letter banks, and game answers agree.

## GitHub Pages

After GitHub Pages is enabled for the `main` branch, the game is available at the repository's GitHub Pages URL.

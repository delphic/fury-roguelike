# Fury Roguelike

Using [Fury](https://github.com/delphic/fury/) to replicate [rusty_rogulike](https://github.com/delphic/rusty_roguelike)

See the [Game Design Document](gdd.md) for design details.

## Build
One time build: `browserify ./scripts/client.js -o ./build/scripts/fury-roguelike.js`

Continuous build: `watchify ./scripts/client.js -o ./build/scripts/fury-roguelike.js`
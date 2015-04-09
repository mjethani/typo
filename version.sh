#!/bin/bash

cd "$(dirname "$0")" || exit 1

if [ $# -lt 1 ]; then
  exit 1
fi

version=$1

date=$(date +'%B %-d, %Y')

cp -f README.md .README.md.tmp
sed -E "s/^(#+ Version ).+$/\1$version/" .README.md.tmp > README.md

cp -f package.json .package.json.tmp
sed -E "s/(\"version\": )\"([^\"]+)\"/\1\"$version\"/" .package.json.tmp \
  > package.json

cp -f main.js .main.js.tmp
sed -E "s/^( \*  typo v).+$/\1$version/" .main.js.tmp \
  | sed -E "s/^(var _version = )'[^']+';$/\1'$version';/" \
  | sed -E "s/^( \*  Date: +).+$/\1$date/" \
  > main.js

# vim: et ts=2 sw=2

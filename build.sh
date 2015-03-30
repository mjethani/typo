#!/bin/bash

cd "$(dirname "$0")" || exit 1

function esc {
  str=${1//\\/\\\\}
  str=${str//\'/\\\'}
  str=${str//\"/\\\"}
  str=${str//$'\n'/\\n\\$'\n'}
  echo "$str"
}

js=$(< main.js)

js=${js//<%= package %>/}

js=${js//<%= keyboard %>/"$(esc "$(< QWERTY.keyboard)")"}
js=${js//<%= dictionary %>/"$(esc "$(< dictionary)")"}
js=${js//<%= help %>/"$(esc "$(< default.help)")"}
js=${js//<%= license %>/"$(esc "$(< LICENSE)")"}

echo "$js" > typo.js

# vim: et ts=2 sw=2

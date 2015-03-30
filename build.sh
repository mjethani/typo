#!/bin/bash

cd "$(dirname "$0")" || exit 1

function esc {
  str=${1//\\/\\\\}
  str=${str//\'/\\\'}
  str=${str//\"/\\\"}
  str=${str//$'\n'/\\n\\$'\n'}
  echo "$str"
}

echo 'Reading main.js'

js=$(< main.js)

js=${js//<%= package %>/}

echo 'Processing QWERTY.keyboard ...'
js=${js//<%= keyboard %>/"$(esc "$(< QWERTY.keyboard)")"}
echo 'Processing dictionary ...'
js=${js//<%= dictionary %>/"$(esc "$(< dictionary)")"}
echo 'Processing default.help ...'
js=${js//<%= help %>/"$(esc "$(< default.help)")"}
echo 'Processing LICENSE ...'
js=${js//<%= license %>/"$(esc "$(< LICENSE)")"}

echo 'Writing typo.js'

echo "$js" > typo.js

echo 'Build complete'

# vim: et ts=2 sw=2

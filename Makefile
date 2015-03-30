all:

typo.js: main.js QWERTY.keyboard dictionary default.help LICENSE
	bash build.sh

typo.js.asc: typo.js
	keybase sign typo.js

SIGNED.md: typo.js.asc
	keybase dir sign

clean:
	rm -fv typo.js
	git checkout SIGNED.md typo.js.asc

.PHONY: clean SIGNED.md


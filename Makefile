all: SIGNED.md

$(VERSION):
	bash version.sh $(VERSION)

version: $(VERSION)

typo.js: main.js QWERTY.keyboard dictionary default.help LICENSE $(VERSION)
	bash build.sh

typo.js.asc: typo.js
	keybase sign typo.js

.npmignore: .gitignore
	sort -ru .gitignore > .npmignore
	echo '.gitignore .npmignore Makefile *.sh' | tr ' ' '\n' >> .npmignore

.kbignore: .npmignore
	sort -ru .npmignore > .kbignore
	echo package.json >> .kbignore

SIGNED.md: typo.js.asc .kbignore
	keybase dir sign

verify:
	keybase dir verify
	keybase verify typo.js.asc

ifdef VERSION
tag: SIGNED.md
	git commit -am 'Signed PGP:E6B74303'
	git tag v$(VERSION)
endif

clean:
	rm -fv typo.js
	git checkout SIGNED.md typo.js.asc

.PHONY: clean version SIGNED.md verify tag


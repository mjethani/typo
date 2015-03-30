all:

$(VERSION):
	bash version.sh $(VERSION)

typo.js: main.js QWERTY.keyboard dictionary default.help LICENSE $(VERSION)
	bash build.sh

typo.js.asc: typo.js
	keybase sign typo.js

SIGNED.md: typo.js.asc
	keybase dir sign

verify:
	keybase dir verify && keybase verify typo.js.asc

release: SIGNED.md
	git commit -am 'Signed PGP:E6B74303' && git tag v$(VERSION)

clean:
	rm -fv typo.js
	git checkout SIGNED.md typo.js.asc

.PHONY: clean SIGNED.md verify release


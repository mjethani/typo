##### Signed by https://keybase.io/mj
```
-----BEGIN PGP SIGNATURE-----
Version: GnuPG/MacGPG2 v2.0.22 (Darwin)
Comment: GPGTools - https://gpgtools.org

iQIcBAABCgAGBQJVGRlZAAoJEPvclVzmt0MDUhIQAMFd293dgLLo/d9kGi0LFChC
E2cVamw38ihSKhr6nX0epKIjx7E5DpgKygAzsYTtT8lrNzjG0UuFEpBtgXDAPGMO
T0v+F9CG4GwqFC+vMBv7ay3AJ9ti2WpGcb1GxVNU3IdiCc4ugs0eMmW00F9fy3Xw
DM9QnxowvXqO2C/YRBboQr7XFTHbNjVFoQBxymjKDmI1ivnV+F5HG/KbbvAYkEsV
HLbUkFZ3zq2DrvGtgB8Nmu9y6QwxhSF9DFv3K4u2sa/GpG19BOKmskDn3g7KDI+X
YgU3uHe2n9xn3P3SBXGJFcA8Z58sQoLwx4F/4F1X8L8JHOa5TSNVMY3WL9MBAYyc
zjHc7Ac8XVWjEauJyUjOwMrP/lDDCtrg5mfGfL96O9zcpAy4c2GvOwt30VlyqJWN
UdVtg1r5gtoEILwap/Wf3sI2Qp2SzThw2p0ImstNaqV8XvqS0BdSVJIZmNnisrZT
uIpzBfPj4zS/Qy5p+hXl2IZ2jxpSHXRQCZDaX7ZRtFlk20ZqGyuZ0t7IzU1lRQgs
IVS61SF+UIlczLz1Se0XD5v6OEToeT4bawNS8nb8ID3SlPRrAGq8KFGRh3ohr8mz
0WA/cLbxAzWXOXqE3Q69GQb45cMZw9IFRt0AtVJVX8L8qdHdgUvKMY0WPZQNuJ9K
U0Oz89IwB1qw7VRwk9sm
=H9Vc
-----END PGP SIGNATURE-----

```

<!-- END SIGNATURES -->

### Begin signed statement 

#### Expect

```
size   exec  file                 contents                                                                                                                         
             ./                                                                                                                                                    
46             .gitignore         f3c6f1add61021e7e740449cf6cd1f46683d83191477b32cc811be25686b8fc9                                                                 
56             Dvorak.keyboard    f3d93dbd5387a693b537ceabd5dc441975023f8e3908a2f45a450c257935f0fb                                                                 
732            LICENSE            e7fa0c5707aa3eae23e841a73ea57cda21f3bd87b90ba3ea254ca5bdec29d386                                                                 
397            Makefile           db3f0c16dbb7bc17782dee9473f7de708be70ec4447ebf8de733e3e749a62037                                                                 
56             QWERTY.keyboard    c8431394f7812b8022fdcd86bd359056a26e538fac4446ab1e908753e1fa1a89                                                                 
1054           README.md          a859ce2465e5247ecd644a4b4ff43b42047e731f0fa57fe3627be8295a03e6c1                                                                 
472            build.sh           1620fa632824627048525a245badb63033b86d86ed9e8cd23407ecafdb2d7c66                                                                 
5976           default.help       f92e83a0f86467dbe191ba4f46ce006057dce33f8f9e224c23d50143a9ee9a50                                                                 
14310          dictionary         c68088ec46bb71d60447e956c4bdf1c3801c97791786fdd45522bb5e8a253163                                                                 
921            grammatical.rules  0823880f62bd7f2372efd2f43bc36ddb4d2d6919f892e7520e1ee8f9b443400c                                                                 
38100          main.js            08aa62b5bd4aaf3f6fc484b80d8e53ca3899dbaba7ca7145501839a2397afbc6                                                                 
44032          misspelling.rules  4bdbfbfe2abfabafae0f8af4c29e2d0a5d98a2bb9c234749dbbf62395b378862                                                                 
829            package.json       35f6177bdc126205e8aef9b1d11c511524c5946fac066daf34eac8c152fc22b6                                                                 
54908          screenshot.png     a6171e315392ee0d98641f3bcd7f05636fb988d5b5a15b49c2cdb537cb8805da|7a555df6a99c038be00da6d0b68a7b7dba44c010f760d466528658f61fe70404
26341          security.png       1dfd9f6409fccd5316779b99b835fefd20bd0b57b8bcecc8156c5798af00e9eb|d06142c796249dc95470f5420ef4316a369f2ee159bb12c403768546052c20ad
47     x       typo               ad1d918f07b08400ddd47b71001b6ee4928c5f6bbe50ddb75cb1d024d47dcfbe                                                                 
30217          typo.js.asc        8ac80c87148bd46cea6ccfad3128c547bada9d6a176cce8b3f2f91a0b25a6726                                                                 
8407           variant.rules      df6bb99bde97f43b43352eaa8e4d94a4c8f385cd69c74dbacce3701da34425b4                                                                 
570            version.sh         0707e8bc9688e9c4eebcf05b5983840ab40cfc69bff7f0a7f01e7efd495aaaf1                                                                 
```

#### Ignore

```
/SIGNED.md
```

#### Presets

```
git      # ignore .git and anything as described by .gitignore files
dropbox  # ignore .dropbox-cache and other Dropbox-related files    
kb       # ignore anything as described by .kbignore files          
```

<!-- summarize version = 0.0.9 -->

### End signed statement

<hr>

#### Notes

With keybase you can sign any directory's contents, whether it's a git repo,
source code distribution, or a personal documents folder. It aims to replace the drudgery of:

  1. comparing a zipped file to a detached statement
  2. downloading a public key
  3. confirming it is in fact the author's by reviewing public statements they've made, using it

All in one simple command:

```bash
keybase dir verify
```

There are lots of options, including assertions for automating your checks.

For more info, check out https://keybase.io/docs/command_line/code_signing
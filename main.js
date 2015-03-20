/*  ----------------------------------------------------------------------------
 *  typo v0.3.1
 *  
 *  Hide secret information in typographical errors
 *  
 *  Author:  Manish Jethani (manish.jethani@gmail.com)
 *  Date:    March 21, 2015
 *  
 *  See 'typo --help'
 *  
 *  PGP: 57F8 9653 7461 1F9C EEF9 578B FBDC 955C E6B7 4303
 *  
 *  http://manishjethani.com/
 *  ------------------------------------------------------------------------- */

var crypto   = require('crypto');
var fs       = require('fs');
var os       = require('os');
var path     = require('path');
var readline = require('readline');
var stream   = require('stream');

var pkg      = require('./package');

var _name = 'typo';

var dict = {};

var rules = {};
var rulesetOrder = 'qwerty misspelling grammatical'.split(' ');

var wordCharacter = /[A-Za-z'-]/;

var wordPattern = /^'?[A-Za-z]+-?[A-Za-z]+'?[A-Za-z]'?$/;

var say = function () {};

function sayImpl(prefix) {
  if (!prefix) {
    return console.error;
  } else if (typeof prefix === 'function') {
    return function () {
      console.error.apply(console, [ prefix() ].concat(
            sliceArguments(arguments)));
    };
  } else {
    return function () {
      console.error.apply(console, [ prefix ].concat(
            sliceArguments(arguments)));
    };
  }
}

function sliceArguments(begin, end) {
  return Array.prototype.slice.call(sliceArguments.caller.arguments,
      begin, end);
}

function async(func) {
  var args = sliceArguments(1);
  process.nextTick(function () {
    func.apply(null, args);
  });
}

function chain(list, errorCallback, doneCallback) {
  // Basically why I love JavaScript.

  // This function lets you chain function calls so the output of one is the
  // the input to the next. If any of them throws an error, it goes to the
  // error callback. Once the list has been exhausted, the final result goes to
  // the done callback.

  var params = sliceArguments(3);

  var func = list.shift();

  if (func) {
    params.push(function (error) {
      if (error) {
        errorCallback(error);
      } else {
        chain.apply(null, [ list, errorCallback, doneCallback ]
              .concat(sliceArguments(1)));
      }
    });
  } else {
    func = doneCallback;
  }

  async(function () {
    try {
      func.apply(null, params);
    } catch (error) {
      errorCallback(error);
    }
  });
}

function die() {
  if (arguments.length > 0) {
    console.error.apply(console, arguments);
  }

  process.exit(1);
}

function dieOnExit() {
  process.exitCode = 1;
}

function printOutput(string, filename) {
  if (string != null) {
    if (filename) {
      say('Writing output to file ' + filename);

      fs.writeFileSync(filename, string);

    } else {
      say('Writing output to stdout');

      process.stdout.write(string);
    }
  }
}

function logError(error) {
  if (error) {
    console.error(error.toString());
  }
}

function parseArgs(args) {
  // This is another cool function. It parses command line arguments of two
  // kinds: '--long-name[=<value>]' and '-n [<value>]'
  // 
  // If the value is omitted, it's assumed to be a boolean true.
  // 
  // You can pass in default values and a mapping of short names to long names
  // as the first and second arguments respectively.

  var rest = sliceArguments(1);

  var defaultOptions  = typeof rest[0] === 'object' && rest.shift() || {};
  var shortcuts       = typeof rest[0] === 'object' && rest.shift() || {};

  var expect = null;

  return args.reduce(function (obj, arg) {
    var single = arg[0] === '-' && arg[1] !== '-';

    if (!(single && !(arg = shortcuts[arg]))) {
      if (arg.slice(0, 2) === '--') {
        var eq = arg.indexOf('=');

        if (eq === -1) {
          eq = arg.length;
        }

        var name  = arg.slice(2, eq);

        if (single && eq === arg.length - 1) {
          expect = name;

          return obj;
        }

        obj[name] = typeof defaultOptions[name] === 'boolean'
            && eq === arg.length
            || arg.slice(eq + 1);

      } else if (expect) {
        obj[expect] = arg;

      } else if (rest.length > 0) {
        obj[rest.shift()] = arg;
      }
    }

    expect = null;

    return obj;
  }, Object.create(defaultOptions));
}

function prettyBuffer(buffer) {
  return (buffer.toString('hex').toUpperCase().match(/.{2}/g) || []).join(' ');
}

function hash(message, algorithm) {
  return crypto.Hash(algorithm || 'md5').update(message).digest();
}

function mash(digest) {
  var d = 0;

  for (var i = 0; i < digest.length; i++) {
    d ^= digest[i];
  }

  return d;
}

function swap(obj, k1, k2) {
  var tmp = obj[k1];
  obj[k1] = obj[k2];
  obj[k2] = tmp;
}

function shuffle(array) {
  if (array == null) {
    return array;
  }

  for (var i = 0; i < array.length; i++) {
    swap(array, i, Math.floor(Math.random() * array.length));
  }

  return array;
}

function unique(array) {
  if (array == null) {
    return array;
  }

  // Filter out duplicates while preserving order.

  var set = [];

  var obj = {};

  for (var i = 0; i < array.length; i++) {
    var item = array[i];

    if (!obj.hasOwnProperty(item)) {
      obj[item] = set.push(item);
    }
  }

  return set;
}

function parseTabularData(data) {
  if (data == null) {
    return null;
  }

  var lines = data.toString().split('\n');
  var records = lines.filter(function (line) {
    return line.match(/^[^#]/);
  });

  return records.map(function (record) {
    return record.split('\t');
  });
}

function stringToBuffer(string, format) {
  var buffer = null;

  switch (format) {
  case 'hex':
    string = '0'.slice(0, string.length % 2) + string;
  case 'base64':
    buffer = new Buffer(string, format);
    break;
  default:
    buffer = new Buffer(string);
  }

  return buffer;
}

function bufferToString(buffer, format) {
  var string = null;

  switch (format) {
  case 'hex':
  case 'base64':
    string = buffer.toString(format);
    break;
  default:
    string = buffer.toString();
  }

  return string;
}

function slurp(callback) {
  var input = '';

  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function () {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      input += chunk;
    }
  });

  process.stdin.on('end', function () {
    callback(null, input);
  });
}

function slurpFile(filename, callback) {
  fs.readFile(filename, { encoding: 'utf8' }, callback);
}

function slurpFileSync(filename) {
  return fs.readFileSync(filename, { encoding: 'utf8' });
}

function dumpFile(filename, transformer) {
  if (transformer) {
    transformer.pipe(process.stdout);
    fs.createReadStream(filename, { encoding: 'utf8' }).pipe(transformer);
  } else {
    fs.createReadStream(filename, { encoding: 'utf8' }).pipe(process.stdout);
  }
}

function prompt(label, quiet, callback) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('No TTY.');
  }

  if (arguments.length > 0) {
    callback = arguments[arguments.length - 1];
    if (typeof callback !== 'function') {
      callback = null;
    }
  }

  if (typeof quiet !== 'boolean') {
    quiet = false;
  }

  if (typeof label === 'string') {
    process.stdout.write(label);
  }

  var rl = readline.createInterface({
    input: process.stdin,
    // The quiet argument is for things like passwords. It turns off standard
    // output so nothing is displayed.
    output: !quiet && process.stdout || null,
    terminal: true
  });

  rl.on('line', function (line) {
    rl.close();

    if (quiet) {
      process.stdout.write(os.EOL);
    }

    if (callback) {
      callback(null, line);
    }
  });
}

function deriveKey(text, password, salt, length) {
  return crypto.pbkdf2Sync(password || '',
      Buffer.concat([ hash(text, 'sha256'), salt || new Buffer(0) ]),
      0x100000,
      length, 'sha256');
}

function encrypt(buffer, text, password, salt, authenticated) {
  var keyLength = 48;
  var algorithm = 'aes-256-ctr';
  if (authenticated) {
    keyLength = 44;
    algorithm = 'aes-256-gcm';
  }
  var key = deriveKey(text, password, salt, keyLength);
  var cipher = crypto.createCipheriv(algorithm, key.slice(0, 32),
      key.slice(32));
  var result = Buffer.concat([ cipher.update(buffer), cipher.final() ]);
  if (authenticated) {
    result = Buffer.concat([ result, cipher.getAuthTag() ]);
  }
  return result;
}

function decrypt(buffer, text, password, salt, authenticated) {
  var keyLength = 48;
  var algorithm = 'aes-256-ctr';
  if (authenticated) {
    keyLength = 44;
    algorithm = 'aes-256-gcm';
  }
  var key = deriveKey(text, password, salt, keyLength);
  var decipher = crypto.createDecipheriv(algorithm, key.slice(0, 32),
      key.slice(32));
  if (authenticated) {
    decipher.setAuthTag(buffer.slice(-16));
    buffer = buffer.slice(0, -16);
  }
  return Buffer.concat([ decipher.update(buffer), decipher.final() ]);
}

function printVersion() {
  console.log(_name + ' v' + pkg.version + ' by ' + pkg.author.name);
}

function printHelp() {
  dumpFile(path.join(__dirname, 'default.help'));
}

function printLicense() {
  dumpFile(path.join(__dirname, 'LICENSE'));
}

function printUsage() {
  var cut = false;
  var tee = new stream.Transform({ decodeStrings: false });
  tee._transform = function (chunk, encoding, callback) {
    if (!cut) {
      var nlnl = chunk.indexOf('\n\n');
      if (nlnl !== -1) {
        cut = true;
        this.push(chunk.slice(0, nlnl));
      } else {
        this.push(chunk);
      }
      callback();
    }
  };
  tee._flush = function (callback) {
    this.push(os.EOL + os.EOL + "See '" + _name + " --help'."
        + os.EOL + os.EOL);
    callback();
  };

  dumpFile(path.join(__dirname, 'default.help'), tee);
}

function loadDict() {
  say('Loading dictionary');

  var data = slurpFileSync(path.join(__dirname, 'dict'));
  var lines = data.toString().split('\n');

  lines.forEach(function (word) {
    var seq = [
      '^' + word.slice(0, 2),
      word.slice(word.length - 2) + '$'
    ];

    for (var i = 0; i < word.length - 2; i++) {
      seq.push(word.slice(i, i + 3));
    }

    seq.forEach(function (v) {
      dict[v] = dict[v] + 1 || 1;
    });
  });
}

function loadRulesetFile(filename, name) {
  var data = slurpFileSync(filename);
  var records = parseTabularData(data);

  var ruleset = records.map(function (fields) {
    return { re: new RegExp(fields[0]), sub: fields[1] };
  });

  rules[name || filename] = ruleset;

  return ruleset;
}

function loadRules(name) {
  name = name || 'typo';

  if (rules.hasOwnProperty(name)) {
    return rules[name];
  }

  say('Loading ruleset ' + name);

  return loadRulesetFile(path.join(__dirname, name + '.rules'), name);
}

function shuffleRules(name) {
  shuffle(rules[name || 'typo']);
}

function readPassword(password, callback) {
  if (password === true) {
    prompt('Password: ', true, callback);
  } else {
    async(callback, null, typeof password === 'string' ? password : null);
  }
}

function readInputText(filename, callback) {
  if (filename) {
    say('Reading input from file ' + filename);

    slurpFile(filename, callback);

  } else {
    say('Reading input from stdin');

    slurp(callback);
  }
}

function checkPlausibility(typo) {
  var score = 0;

  score += dict['^' + typo.slice(0, 2)] && 1 || 0;
  score += dict[typo.slice(typo.length - 2) + '$'] && 1 || 0;

  for (var i = 0; i < typo.length - 2; i++) {
    score += dict[typo.slice(i, i + 3)] && 1 || 0;
  }

  return score / typo.length >= 1;
}

function generateTypos(word) {
  // Here we generate a bunch of typos for a given word.
  var arr = [];

  if (word.match(wordPattern)) {
    // Apply each rule.

    // WARNING: This is not resistant to statistical analysis.
    rulesetOrder.forEach(function (name) {
      if (rules.hasOwnProperty(name)) {
        rules[name].forEach(function (rule) {
          var typo = word.replace(rule.re, rule.sub);
          if (typo !== word) {
            if (name !== 'qwerty' || checkPlausibility(typo)) {
              arr.push(typo);
            }
          }
        });
      }
    });
  }

  return unique(arr);
}

function processWord(word, buffer, offset) {
  // Take only the low 4 bits.
  var nibble = 0xF & buffer[offset];

  // Why only 4 bits?
  // 
  // It's easier to find a match for one (as you see below), and the remaining
  // bits can be used for special purposes.

  var typos = generateTypos(word);

  for (var i = 0; i < typos.length; i++) {
    var candidate = typos[i];

    if ((mash(hash(candidate)) & 0xF) === nibble) {
      return candidate;
    }
  }

  return word;
}

function extractTyposFromOriginalText(text, originalText) {
  // Compare the two texts to get all the typos.
  var typos = [];

  var offset = 0;

  var i = -1;
  var j = -1;
  var k = -1;

  var c = null;

  for (i = 0; i < text.length; i++) {
    if (text[i] !== originalText[i + offset]) {
      // We've hit a typo!

      var word = '';

      // Add every character until the beginning of the word.
      for (j = i - 1; j >= 0; j--) {
        c = text[j];

        if (!c.match(wordCharacter)) {
          break;
        }

        word = c + word;
      }

      // Now add every character until the end of the word.
      for (j = i; j < text.length; j++) {
        c = text[j];

        if (!c.match(wordCharacter)) {
          break;
        }

        word += c;
      }

      // This is the piece of information we're looking for.
      typos.push(word);

      // Stay in sync with the original text.
      for (k = i + offset; k < originalText.length; k++) {
        if (!originalText[k].match(wordCharacter)) {
          break;
        }
      }

      i = j;
      offset = k - j;
    }
  }

  return {
    typos: typos,
    text:  originalText
  };
}

function extractTyposFromMarkup(text) {
  var typos = [];

  // Look for our custom markup, which is of the form '{[s/typo/correction/]}'
  var index = text.indexOf('{[s/');
  while (index !== -1) {
    var x1 = text.indexOf('/', index + 4) + 1;
    var x2 = text.indexOf('/', x1);

    // Extract typo and save it.
    typos.push(text.slice(index + 4, x1 - 1));

    // Also do the substitution on the input text.
    text = text.slice(0, index) + text.slice(x1, x2) + text.slice(x2 + 3);

    index = text.indexOf('{[s/');
  }

  // By the end of the loop we have both the list of typos and the original
  // text.
  return {
    typos: typos,
    text:  text
  };
}

function encode(text, secret, format, password, authenticated, nosalt,
    markup, deterministic) {
  var result = null;

  say('Encrypting ...');

  var salt = !deterministic && !nosalt ? crypto.randomBytes(2) : null;

  // Convert the string into a buffer and encrypt the buffer using the given
  // password, the text, and the random salt.
  // 
  // Note: The SHA-256 of the original text along with a random two bytes is
  // used as the salt to PBKDF2. If '--nosalt' is used, an empty string is used
  // as the salt. Also, if password is null, an empty password is used anyway.
  var buffer = encrypt(stringToBuffer(secret, format), !nosalt && text || '',
      password, salt, authenticated);

  say('Encrypted secret:', prettyBuffer(buffer));

  if (salt) {
    say('Salt:', prettyBuffer(salt));

    buffer = Buffer.concat([ salt, buffer ]);
  }

  say('Buffer size: ' + buffer.length);

  var random = null;
  var odd = false;

  if (!deterministic) {
    try {
      random = crypto.randomBytes(2);

      // One in two times add an extra meaningless typo just to throw 'em off.
      // By default we always have an even number of typos. This helps.
      odd = random[1] >= 128;
    } catch (error) {
    }
  }

  // This is the ratio of the total number of typos to the text length. It's
  // the rate at which typos should be introduced. We want to make sure the
  // typos are spread out more or less evenly.
  var density = (buffer.length * 2 + odd) / text.length;

  say('Density: ' + (density * 1000).toFixed(4) + ' per thousand');

  // This is how much we try to squeeze the information into the text.
  var multiplier = 1.0;

  do {
    say('Trying with multiplier ' + multiplier.toFixed(4));

    var workingBuffer = new Buffer(buffer);

    var word = '';
    var count = 0;

    var targetDensity = density * multiplier;

    result = '';

    for (var i = 0; i < text.length; i++) {
      var c = text[i];

      if (c.match(wordCharacter)) {
        word += c;
      } else {
        if (word) {
          // Here we're dividing count by two and rounding down. The offset
          // into the buffer is half of the number of typos already introduced,
          // because each typo carries only 4 bits of information.
          var offset = count >>> 1;
          var newWord = null;

          if (offset < buffer.length) {
            // Adjust the bar for letting in the next typo based on the current
            // rate.
            var bar = count / i / targetDensity || 0;

            if (bar < 1.0) {
              newWord = processWord(word, workingBuffer, offset);
            } else {
              newWord = word;
            }

          } else if (odd) {
            // Throw in the extra typo.
            newWord = processWord(word, random, 0);

          } else {
            newWord = word;
          }

          var replacement = newWord;

          if (newWord !== word) {
            if (markup) {
              replacement = '{[s/' + newWord + '/' + word + '/]}';

              // Once you're satisfied with the result, open in Vim and do:
              // %s/{\[s\/\([^\/]\+\)\/[^\/]\+\/\]}/\1/g
            }

            if (offset < buffer.length) {
              // Bring the next 4 bits into position.
              workingBuffer[offset] >>>= 4;
            } else {
              odd = false;
            }

            if (++count >>> 1 >= buffer.length && !odd) {
              // Optimization: We don't want any more typos. Just add the rest
              // of the text and move on.
              result += replacement;
              result += text.slice(i);
              break;
            }
          }

          result += replacement;
          word = '';
        }

        result += c;
      }
    }

    say('Score: ' + count + ' / ' + buffer.length * 2);

    // Try again if required with a higher density.
  } while (count >>> 1 < buffer.length && (multiplier *= 1.1) <= 10.0);

  if (count >>> 1 < buffer.length) {
    // This is the main problem. The input text simply isn't big enough for the
    // secret. For example, you can't encode 'Hello, world!' in 'A quick brown
    // fox jumped over the lazy dog.'
    throw new Error('Not enough text.');
  }

  return result;
}

function decode(text, originalText, format, password, authenticated, nosalt) {
  var buffer = null;

  var extractInfo = null;

  say('Extracting typos');

  if (originalText != null) {
    // If we have the original text, we're only interested in extracting the
    // typos.
    extractInfo = extractTyposFromOriginalText(text, originalText);
  } else {
    // If the original text hasn't been provided, then we assume the input text
    // contains substitution markup, and we try to extract both the list of
    // typos and the original text out of it.
    extractInfo = extractTyposFromMarkup(text);
  }

  if (extractInfo.typos.length % 2 === 1) {
    // Ignore any odd typo at the end.
    extractInfo.typos.pop();
  }

  buffer = new Buffer(extractInfo.typos.length / 2);

  say('Buffer size: ' + buffer.length);

  for (var i = 0; i < extractInfo.typos.length; i++) {
    var d = mash(hash(extractInfo.typos[i]));

    // Read the encrypted secret 4 bits at a time. The even ones are the low 4
    // bits, the odd ones are the high 4 bits.
    if (i % 2 === 0) {
      buffer[i >>> 1] = d & 0xF;
    } else {
      buffer[i >>> 1] |= d << 4 & 0xF0;
    }
  }

  var salt = null;

  if (!nosalt) {
    salt = buffer.slice(0, 2);

    say('Salt:', prettyBuffer(salt));

    buffer = buffer.slice(2);
  }

  say('Encrypted secret:', prettyBuffer(buffer));

  say('Decrypting ...');

  // Finally, decrypt the buffer to get the original secret.
  return bufferToString(decrypt(buffer, !nosalt && extractInfo.text || '',
        password, salt, authenticated), format);
}

function run() {
  if (process.argv.length <= 2) {
    dieOnExit();
    printUsage();
    return;
  }

  var defaultOptions = {
    'version':        false,
    'help':           false,
    'license':        false,
    'secret':         null,
    'decode':         false,
    'file':           null,
    'output-file':    null,
    'original-file':  null,
    'format':         null,
    'password':       false,
    'authenticated':  false,
    'nosalt':         false,
    'markup':         false,
    'deterministic':  false,
    'rulesets':       null,
    'ruleset-file':   null,
    'verbose':        false,
  };

  var shortcuts = {
    '-V': '--version',
    '-h': '--help',
    '-?': '--help',
    '-v': '--verbose',
    '-d': '--decode',
    '-f': '--file=',
    '-o': '--output-file=',
    '-g': '--original-file=',
    '-P': '--password',
    '-a': '--authenticated',
  };

  var options = parseArgs(process.argv.slice(2), defaultOptions, shortcuts,
      'secret');

  if ((options.help || options.version || options.license)
      && Object.keys(options).length > 1) {
    dieOnExit();
    printUsage();
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    printVersion();
    return;
  }

  if (options.license) {
    printLicense();
    return;
  }

  var seeHelp = os.EOL + os.EOL + "See '" + _name + " --help'."
      + os.EOL;

  var name = null;

  for (name in options) {
    if (!defaultOptions.hasOwnProperty(name)) {
      die("Unknown option '" + name + "'." + seeHelp);
    }
  }

  for (name in defaultOptions) {
    // If any boolean options have non-boolean (string) values, print usage and
    // exit.
    if (typeof defaultOptions[name] === 'boolean'
        && typeof options[name] !== 'boolean'
        && name !== 'password') {
      dieOnExit();
      printUsage();
      return;
    }
  }

  if (typeof options.secret !== 'string' && !options.decode) {
    dieOnExit();
    printUsage();
    return;
  }

  for (name in options) {
    if ((name === 'file' || name.slice(-5) === '-file')
        && options[name] === '') {
      die('Filename cannot be blank.' + seeHelp);
    }
  }

  if (options.decode && !options['original-file'] && !options.markup) {
    die("Required '--original-file' or '--markup' argument." + seeHelp);
  }

  if (options.format != null && options.format != 'hex'
      && options.format != 'base64') {
    die("Format must be 'hex' or 'base64'." + seeHelp);
  }

  if (options.verbose) {
    say = sayImpl(function () {
      return '[' + process.uptime().toFixed(2) + ']';
    });
  }

  say('Hi!');

  chain([
      function (callback) {
        readPassword(options.password, callback);
      },

      function (password, callback) {
        readInputText(options.file, function (error, text) {
          callback(error, password, text);
        });
      },

      function (password, text, callback) {
        if (options.decode && !options.markup) {
          // Read the original file.
          say('Reading original file ' + options['original-file']);

          slurpFile(options['original-file'], function (error, originalText) {
            callback(error, password, text, originalText);
          });

        } else {
          callback(null, password, text, null);
        }
      },

      function (password, text, originalText, callback) {
        if (!options.decode) {
          loadDict();

          // Load rulesets.
          var rulesets = options['rulesets'];
          var rulesetFile = options['ruleset-file'];

          if (rulesetFile) {
            rulesetOrder.push('custom');

            say('Loading ruleset file ' + rulesetFile);

            loadRulesetFile(rulesetFile, 'custom');

          } else {
            if (rulesets != null) {
              rulesetOrder = rulesets.match(/([^ ,]+)/g) || [];
            }

            rulesetOrder.forEach(loadRules);
          }

          if (!options.deterministic) {
            say('Shuffling rules');

            rulesetOrder.forEach(shuffleRules);
          }
        }

        callback(null, password, text, originalText);
      },

      function (password, text, originalText, callback) {
        var secret = null;

        if (options.decode) {
          say('Decoding');

          secret = decode(text, originalText, options.format, password,
              options.authenticated, options.nosalt);

          say('Secret: ' + secret);

          // Note: secret can be an empty string! It's an error only if it's
          // null or undefined.
          if (secret == null) {
            // Throw an empty string to exit quietly with a nonzero exit code.
            throw '';
          }
        }

        callback(null, password, text, originalText, secret);
      },

      function (password, text, originalText, secret, callback) {
        if (options.decode) {
          callback(null, secret);
          return;
        }

        say('Secret: ' + options.secret);

        say('Encoding');

        var output = encode(text, options.secret, options.format, password,
            options.authenticated, options.nosalt,
            options.markup, options.deterministic);

        if (!output) {
          throw '';
        }

        callback(null, output);
      }
    ],

    function (error) {
      logError(error);

      say('Sorry, we failed');

      die();
    },

    function (finalResult) {
      say('Almost done!');

      if (options.decode || !options['output-file'] && process.stdout.isTTY) {
        console.log(finalResult);
      } else {
        printOutput(finalResult, options['output-file']);
      }

      say('Goodbye');
    }
  );
}

function main() {
  run();
}

if (require.main === module) {
  main();
}

exports.run = run;

// vim: et ts=2 sw=2

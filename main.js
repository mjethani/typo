/*  ----------------------------------------------------------------------------
 *  typo v0.2.0
 *  
 *  Hide secret information in typographical errors
 *  
 *  Author:  Manish Jethani (manish.jethani@gmail.com)
 *  Date:    March 8, 2015
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

var rules = {};
var rulesetOrder = 'typo spelling grammatical'.split(' ');

var wordCharacter = /[A-Za-z'-]/;

var wordPattern = /^'?[A-Za-z]+-?[A-Za-z]+'?[A-Za-z]'?$/;

function chain(list, errorCallback, doneCallback) {
  // Basically why I love JavaScript.

  // This function lets you chain function calls so the output of one is the
  // the input to the next. If any of them throws an error, it goes to the
  // error callback. Once the list has been exhausted, the final result goes to
  // the done callback.

  var params = Array.prototype.slice.call(arguments, 3);

  var func = list.shift();

  if (func) {
    params.push(function (error) {
      if (error) {
        errorCallback(error);
      } else {
        chain.bind(null, list, errorCallback, doneCallback)
            .apply(null, Array.prototype.slice.call(arguments, 1));
      }
    });
  } else {
    func = doneCallback;
  }

  setTimeout(function () {
    try {
      func.apply(null, params);
    } catch (error) {
      errorCallback(error);
    }
  }, 1);
}

function die() {
  if (arguments.length > 0) {
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }

  process.exit(1);
}

function dieOnExit() {
  process.exitCode = 1;
}

function printOutput(string, filename) {
  if (string != null) {
    if (filename) {
      fs.writeFileSync(filename, string);
    } else {
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

  var rest = Array.prototype.slice.call(arguments, 1);

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

        obj[name] = arg.slice(eq + 1)
            || typeof defaultOptions[name] === 'boolean'
            || null;

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

function stringToBufferHex(string) {
  if (string.length % 2 === 1) {
    string = '0' + string;
  }

  var buffer = new Buffer(string.length / 2);

  for (var i = 0; i < buffer.length; i++) {
    buffer[i] = parseInt(string.slice(i * 2, i * 2 + 2), 16);
  }

  return buffer;
}

function stringToBuffer(string, format) {
  var buffer = null;

  switch (format) {
  case 'hex':
    buffer = stringToBufferHex(string);
    break;
  case 'base64':
    buffer = new Buffer(string, 'base64');
    break;
  default:
    buffer = new Buffer(string);
  }

  return buffer;
}

function bufferToStringHex(buffer) {
  var string = '';

  for (var i = 0; i < buffer.length; i++) {
    string += ('0' + buffer[i].toString(16)).slice(-2);
  }

  return string;
}

function bufferToString(buffer, format) {
  var string = null;

  switch (format) {
  case 'hex':
    string = bufferToStringHex(buffer);
    break;
  case 'base64':
    string = buffer.toString('base64');
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

function deriveKey(text, password, length) {
  return crypto.pbkdf2Sync(password || '', hash(text, 'sha256'), 0x100000,
      length, 'sha256');
}

function encrypt(buffer, text, password) {
  var key = deriveKey(text, password, 48);
  var cipher = crypto.createCipheriv('aes-256-ctr', key.slice(0, 32),
      key.slice(32));
  return Buffer.concat([ cipher.update(buffer), cipher.final() ]);
}

function decrypt(buffer, text, password) {
  var key = deriveKey(text, password, 48);
  var decipher = crypto.createDecipheriv('aes-256-ctr', key.slice(0, 32),
      key.slice(32));
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

  return loadRulesetFile(path.join(__dirname, name + '.rules'), name);
}

function shuffleRules(name) {
  shuffle(rules[name || 'typo']);
}

function readPassword(password, callback) {
  if (password === true) {
    prompt('Password: ', true, callback);
  } else {
    setTimeout(callback, 1, null,
        typeof password === 'string' ? password : null);
  }
}

function readInputText(filename, callback) {
  if (filename) {
    slurpFile(filename, callback);
  } else {
    slurp(callback);
  }
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
          arr.push(word.replace(rule.re, rule.sub));
        });
      }
    });

    arr = arr.filter(function (v) { return v !== word; });
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

function encode(text, secret, format, password, nosalt, markup,
    deterministic) {
  var result = '';

  // Convert the string into a buffer and encrypt the buffer using the given
  // password and the text.
  // 
  // Note: The SHA-256 of the original text is used as the salt to PBKDF2. If
  // '--nosalt' is used, an empty string is used in place of the text. Also, if
  // password is null, an empty password is used anyway.
  var buffer = encrypt(stringToBuffer(secret, format), !nosalt && text || '',
      password);

  var word = '';
  var count = 0;

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
  // typos are spread out.
  var rate = (buffer.length * 2 + odd) / text.length;

  for (var i = 0; i < text.length; i++) {
    var c = text[i];

    if (c.match(wordCharacter)) {
      word += c;
    } else {
      if (word) {
        // Here we're dividing count by two and rounding down. The offset into
        // the buffer is half of the number of typos already introduced,
        // because each typo carries only 4 bits of information.
        var offset = count >>> 1;
        var newWord = null;

        if (offset < buffer.length) {
          // Adjust the bar for letting in the next typo based on the current
          // rate.
          var bar = count / i / rate || 0;

          if (bar < 1.0) {
            newWord = processWord(word, buffer, offset);
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
          }

          if (offset < buffer.length) {
            // Bring the next 4 bits into position.
            buffer[offset] >>>= 4;
          } else {
            odd = false;
          }

          if (++count >>> 1 >= buffer.length && !odd) {
            // Optimization: We don't want any more typos. Just add the rest of
            // the text and move on.
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

  if (count >>> 1 < buffer.length) {
    // This is the main problem. The input text simply isn't big enough for the
    // secret. For example, you can't encode 'Hello, world!' in 'A quick brown
    // fox jumped over the lazy dog.'
    throw new Error('Not enough text.');
  }

  return result;
}

function decode(text, originalText, format, password, nosalt) {
  var buffer = null;

  var extractInfo = null;

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

  // Finally, decrypt the buffer to get the original secret.
  return bufferToString(decrypt(buffer, !nosalt && extractInfo.text || '',
        password), format);
}

function getOptions() {
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
    'password':       null,
    'nosalt':         false,
    'markup':         false,
    'deterministic':  false,
    'alternative':    false,
    'ruleset-file':   null,
  };

  var shortcuts = {
    '-v': '--version',
    '-h': '--help',
    '-d': '--decode',
    '-f': '--file=',
    '-o': '--output-file=',
    '-g': '--original-file=',
    '-p': '--password=',
    '-P': '--password',
  };

  return parseArgs(process.argv.slice(2), defaultOptions, shortcuts, 'secret');
}

function validateOptions(options) {
  if (options.version || options.help) {
    return;
  }

  var seeHelp = os.EOL + os.EOL + "See '" + _name + " --help'."
      + os.EOL + os.EOL;

  if (options.decode && !options['original-file'] && !options.markup) {
    return "Required '--original-file' or '--markup' argument." + seeHelp;
  }

  if (options.format != null && options.format != 'hex'
      && options.format != 'base64') {
    return "Format must be 'hex' or 'base64'." + seeHelp;
  }
}

function run() {
  var options = getOptions();

  if (options.version) {
    printVersion();
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  if (options.license) {
    printLicense();
    return;
  }

  if (typeof options.secret !== 'string' && !options.decode) {
    dieOnExit();
    printUsage();
    return;
  }

  var errorMessage = validateOptions(options);
  if (errorMessage) {
    die(errorMessage);
  }

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
          slurpFile(options['original-file'], function (error, originalText) {
            callback(error, password, text, originalText);
          });
        } else {
          callback(null, password, text, null);
        }
      },

      function (password, text, originalText, callback) {
        if (!options.decode) {
          // Load rulesets.
          var rulesetFile = options['ruleset-file'];
          if (rulesetFile) {
            rulesetOrder.push('custom');

            loadRulesetFile(rulesetFile, 'custom');
          } else {
            if (options.alternative) {
              rulesetOrder.push('alternative');
            }

            rulesetOrder.forEach(loadRules);
          }

          if (!options.deterministic) {
            rulesetOrder.forEach(shuffleRules);
          }
        }

        callback(null, password, text, originalText);
      },

      function (password, text, originalText, callback) {
        var secret = null;

        if (options.decode) {
          secret = decode(text, originalText, options.format, password,
              options.nosalt);

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

        var output = encode(text, options.secret, options.format, password,
            options.nosalt, options.markup, options.deterministic);

        if (!output) {
          throw '';
        }

        callback(null, output);
      }
    ],

    function (error) {
      logError(error), die();
    },

    function (finalResult) {
      if (options.decode || !options['output-file'] && process.stdout.isTTY) {
        console.log(finalResult);
      } else {
        printOutput(finalResult, options['output-file']);
      }
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

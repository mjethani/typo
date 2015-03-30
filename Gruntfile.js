function jsStringEscape(text) {
  return text.replace(/\\/g, '\\\\')
      .replace(/'/g,  "\\'")
      .replace(/"/g,  '\\"')
      .replace(/\n/g, '\\n\\\n')
  ;
}

function sign(grunt, done) {
  var time = +new Date();

  var tmpFilename = '.typo.js.build-' + time + '.tmp';

  var object = {
    data: {
      keyboard:   jsStringEscape(grunt.file.read('QWERTY.keyboard')),
      dictionary: jsStringEscape(grunt.file.read('dictionary')),
      help:       jsStringEscape(grunt.file.read('default.help')),
      license:    jsStringEscape(grunt.file.read('LICENSE')),
    }
  };

  var source = grunt.file.read('main.js');
  source = grunt.template.process(source, object);
  grunt.file.write(tmpFilename, source);

  var signOptions = {
    cmd:  'keybase',
    args: ('sign ' + tmpFilename + ' -o typo.js.asc').split(' ')
  };

  var dirSignOptions = {
    cmd:  'keybase',
    args: 'dir sign'.split(' ')
  };

  grunt.util.spawn(signOptions, function (error, result) {
    grunt.file.delete(tmpFilename);

    if (result.code !== 0) {
      done(false);
      return;
    }

    grunt.util.spawn(dirSignOptions, function (error, result) {
      done(result.code === 0);
    });
  });
}

module.exports = function (grunt) {
  grunt.registerTask('sign', function () {
    sign(grunt, this.async());
  });
};

// vim: et ts=2 sw=2

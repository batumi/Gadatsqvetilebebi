#!/usr/local/bin/node

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');
var childProcess = require('child_process');
var pdfText = require('pdf-text');
var format = require('util').format;
var siteSpecificExtractor = require('./lib/generic/GenericExtractor').extract;
var App = require('fielddb/api/app/App').App;
var Corpus = require('fielddb/api/corpus/Corpus').Corpus;
var LanguageSpecificImporter = require('./lib/kartuli/KartuliImporter').KartuliImporter;
var transliterateToLatin = require('translitit-mkhedruli-georgian-to-latin');
var transliterateToIPA = require('translitit-mkhedruli-georgian-to-ipa');

var concurrency = 10;

var urls = process.argv.splice(2);
console.log(urls);

var app = new App({
  user: {
    username: process.env.USERNAME,
    gravatar: '226b903027c34e84f97161ff7f3db1ae'
  }
});

var corpus = new Corpus(Corpus.prototype.defaults);
corpus.dbname = 'batumi-sarchelebi';
if (process.env.CORPUS_URL) {
  corpus.url = process.env.CORPUS_URL;
}
var importer = new LanguageSpecificImporter({
  corpus: corpus
});

var processHTMLFile = function(err, response, body, resultfilename, next) {
  var result;
  if (err) {
    result = '  Not found';
  } else {
    // console.log(body);
    var $ = cheerio.load(body);
    result = siteSpecificExtractor($);
  }
  console.log(result);
  fs.writeFile(resultfilename, result, 'utf8', function(err, data) {
    if (err) {
      console.log('  Error writing file ' + resultfilename);
    } else {
      console.log('  Wrote ' + resultfilename);
    }
  });
  next();
};


var processPDFFile = function(originalfilename, next) {
  var result = ' No text';

  console.log('  originalfilename: ' + originalfilename);
  pdfText(originalfilename, function(error, chunks) {
    //chunks is an array of strings
    //loosely corresponding to text objects within the pdf
    if (error !== null) {
      console.log('  PDF conversion error ' + originalfilename);
      console.log(error);
      next();
    } else {
      console.log('  PDF conversion completed ');
      if (chunks && chunks.length > 0) {
        result = chunks.join('\n\n\n');
      }
      var resultfilename = originalfilename.replace('.pdf', '.txt');
      console.log(resultfilename);
      console.log(result);
      fs.writeFile(resultfilename, result, 'utf8', function(err, data) {
        if (err) {
          console.log('  Error writing file ' + resultfilename);
        } else {
          console.log('  Wrote ' + resultfilename);
        }
      });
      next();

    }
  });
};

var processDOCFile = function(originalfilename, next) {
  var result,
    convertCommand = ' soffice --headless --convert-to html:HTML ',
    path;

  console.log('  originalfilename: ' + originalfilename);
  if (originalfilename.indexOf('/') > -1) {
    path = originalfilename.substring(0, originalfilename.lastIndexOf('/'));
    convertCommand = convertCommand + ' --outdir ' + path + ' ';
    // originalfilename.replace(path + '/', ''); .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  }
  console.log(convertCommand + '' + originalfilename + '');
  childProcess.exec(convertCommand + originalfilename, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('  Doc conversion error ' + originalfilename);
      console.log(error);
      console.log('  Doc conversion stderr ' + stderr);
      next();
    } else {
      console.log('  Doc conversion stdout ' + stdout);

      var htmlFilename = originalfilename.replace(/\\ /g, ' ').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace('.docx', '.html').replace('.doc', '.html');
      console.log(htmlFilename);

      fs.readFile(htmlFilename, 'utf8', function(err, data) {
        processHTMLFile(err, null, data, htmlFilename.replace('.html', '.txt'), next);
      });

    }
  });
};

//on mac docx cant run headless https://bugs.freedesktop.org/show_bug.cgi?id=63324
var processDOCXFile = function(originalfilename, next) {
  var result,
    convertCommand = ' soffice --convert-to doc:DOC ',
    path;

  console.log('  originalfilename: ' + originalfilename);
  if (originalfilename.indexOf('/') > -1) {
    path = originalfilename.substring(0, originalfilename.lastIndexOf('/'));
    convertCommand = convertCommand + ' --outdir ' + path + ' ';
    // originalfilename.replace(path + '/', ''); .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    console.log(convertCommand + '' + originalfilename + '');
  }
  childProcess.exec(convertCommand + originalfilename, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('  Docx conversion error ' + originalfilename);
      console.log(error);
      console.log('  Docx conversion stderr ' + stderr);
      next();
    } else {
      console.log('  Docx conversion stdout ' + stdout);
      processDOCFile(originalfilename.replace(".docx", ".doc"), next);
    }
  });
};

async.mapLimit(urls, concurrency, function(url, next) {
  var filename = url.substring(url.lastIndexOf('/') + 1);
  var fileBaseName = filename.substring(0, filename.lastIndexOf('.'));
  var extension = filename.replace(fileBaseName, '');

  console.log('Extracting text for ' + fileBaseName);
  console.log('  extension: ' + extension);

  if (url.indexOf('://') > -1) {
    request(url, function(err, response, body) {
      if (filename.indexOf('.doc') === filename.length - 4 || filename.indexOf('.docx') === filename.length - 5) {
        if (err) {
          processHTMLFile(err, null, null, fileBaseName + '.txt', next);
          return;
        }
        fs.writeFile(filename, body, 'utf8', function(err, data) {
          if (err) {
            console.log('Error writing file ' + filename);
            next();
            return;
          }
          processDOCFile(filename, next);
        });
      } else {
        processHTMLFile(err, response, body, fileBaseName + '.txt', next);
      }
    });
  } else {
    if (url.indexOf('.pdf') === url.length - 4) {
      processPDFFile(url, next);
    } else if (url.indexOf('.doc') === url.length - 4) {
      processDOCFile(url.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), next);
    } else if (url.indexOf('.docx') === url.length - 5) {
      processDOCFile(url.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)'), next);
    } else if (url.indexOf('.html') === url.length - 5) {
      fs.readFile(url, 'utf8', function(err, data) {
        processHTMLFile(err, null, data, fileBaseName + '.txt', next);
      });
    } else if (url.indexOf('.txt') === url.length - 4) {

      console.log('addFileUri', url)
      var options = {
        uri: url,
        id: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')),
        readOptions: {
          readFileFunction: function(options, callback) {
            fs.readFile(url, "utf8", callback);
          }
        },
        preprocessOptions: {
          writePreprocessedFileFunction: function(options, callback) {
            fs.writeFile(options.preprocessedUri, options.body, "utf8", callback);
          },
          transliterate: true,
          joinLines: true,
        },
        importOptions: {
          dryRun: true,
          fromPreprocessedFile: true
        }
      };

      importer.readUri(options).then(function(result) {
        console.log(result.rawText.length);
        return importer.preprocess(result);
      }).then(function(result) {
        console.log('done adding files', result.datum.orthography.substring(0, 200));
        result.datum.utterance = result.datum.morphemes = transliterateToIPA(result.datum.orthography);
        console.log('done adding files', result.datum.utterance.substring(0, 200));
        
        console.log('url', importer.corpus.url);
        console.log('id', result.datum.id);
        console.log('rev', result.datum.rev);
        result.datum.corpus = corpus;
        delete result.datum.tempId;
        return result.datum.save().then(next).fail(next);
      }).catch(function(err) {
        console.log('err adding files', err);
        next();
      });
    }
  }
});

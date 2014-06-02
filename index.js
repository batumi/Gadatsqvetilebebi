#!/usr/local/bin/node

var request = require('request'),
  cheerio = require('cheerio'),
  async = require('async'),
  fs = require('fs'),
  childProcess = require('child_process'),
  pdfText = require('pdf-text'),
  format = require('util').format,
  siteSpecificExtractor = require('./lib/generic/GenericExtractor').extract,
  LanguageSpecificImporter = require('./lib/kartuli/KartuliImporter').KartuliImporter;

var concurrency = 2;

var urls = process.argv.splice(2);
console.log(urls);

var importer = new LanguageSpecificImporter();

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

async.eachLimit(urls, concurrency, function(url, next) {
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

      importer.addFileUrl({
        url: url,
        readOptions: {
          readFileFunction: function(callback) {
            fs.readFile(url, 'utf8', callback);
          }
        },
        preprocessOptions: {
          writePreprocessedFileFunction: function(filename, body, callback) {
            fs.writeFile(filename, body, 'utf8', callback);
          },
          transliterate: true,
          joinLines: true,
        },
        importOptions: {
          dryRun: true,
          fromPreprocessedFile: true
        },
        next: next
      });

    }
  }
});

#!/usr/local/bin/node

var request = require('request'),
  cheerio = require('cheerio'),
  async = require('async'),
  fs = require('fs'),
  childProcess = require('child_process'),
  format = require('util').format,
  siteSpecificExtractor = require('./constitutionalExtractor').extract;

var concurrency = 2;

var urls = process.argv.splice(2);
console.log(urls);


var processHTMLFile = function(err, response, body, resultfilename, next) {
  var result;
  if (err) {
    result = 'Not found';
  } else {
    // console.log(body);
    var $ = cheerio.load(body);
    result = siteSpecificExtractor($);
  }
  console.log(result);
  fs.writeFile(resultfilename, result, 'utf8', function(err, data) {
    if (err) {
      console.log('Error writing file ' + resultfilename);
    } else {
      console.log('Wrote ' + resultfilename);
    }
  });
  next();
};


var processDOCFile = function(originalfilename, next) {
  var result,
    convertCommand = 'soffice --headless --convert-to html:html ',
    path;

  if (originalfilename.indexOf('/')) {
    path = originalfilename.substring(0, originalfilename.lastIndexOf('/'));
    convertCommand = convertCommand + ' --outdir ' + path + ' ';
    // originalfilename.replace(path + '/', '');
    console.log(convertCommand + originalfilename);
  }
  childProcess.exec(convertCommand + originalfilename, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('Doc conversion error ' + originalfilename);
      console.log(error);
      console.log('Doc conversion stderr ' + stderr);
      next();
    } else {
      console.log('Doc conversion stdout ' + stdout);

      var htmlFilename = originalfilename.replace('.doc', '.html').replace('.docx', '.html');
      console.log(htmlFilename);

      fs.readFile(htmlFilename, 'utf8', function(err, data) {
        processHTMLFile(err, null, data, htmlFilename.replace('.html', '.txt'), next);
      });

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
    if (url.indexOf('.doc') === url.length - 4 || url.indexOf('.docx') === url.length - 5) {
      processDOCFile(url, next);
    } else {
      fs.readFile(url, 'utf8', function(err, data) {
        processHTMLFile(err, null, data, fileBaseName + '.txt', next);
      });
    }
  }
});

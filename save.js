#!/usr/local/bin/node

var request = require('request'),
  cheerio = require('cheerio'),
  async = require('async'),
  fs = require('fs'),
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
}

async.eachLimit(urls, concurrency, function(url, next) {
  var filename = url.substring(url.lastIndexOf('/') + 1);
  console.log('Extracting text for ' + filename);
  if (url.indexOf('://') > -1) {
    request(url, function(err, response, body) {
      processHTMLFile(err, response, body, filename.replace('.html', '.txt'), next)
    });
  } else {
    fs.readFile(url, 'utf8', function(err, data) {
      processHTMLFile(err, null, data, filename.replace('.html', '.txt'), next);
    });
  }
});

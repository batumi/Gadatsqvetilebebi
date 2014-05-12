var request = require('request')
  , cheerio = require('cheerio')
  , async = require('async')
  , format = require('util').format
  , siteSpecificExtractor = require("./genericExtractor").extract;

var concurrency = 2;

var urls = process.argv.splice(2);
console.log(urls);
async.eachLimit(urls, concurrency, function (url, next) {
    console.log(url);
    request(url, function (err, response, body) {
        if (err) throw err;
        var $ = cheerio.load(body);
        var result = siteSpecificExtractor($);
        console.log(result);
        next();
    });
});

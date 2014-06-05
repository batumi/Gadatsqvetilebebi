'use strict';

var KartuliImporter = require('./../../lib/kartuli/KartuliImporter.js').KartuliImporter;
var Corpus = require('./../../node_modules/fielddb/api/corpus/Corpus').Corpus;

var fs = require('fs');
var specIsRunningTooLong = 5000;

/*
  ======== A Handy Little Jasmine Reference ========
https://github.com/pivotal/jasmine/wiki/Matchers

  Spec matchers:
    expect(x).toEqual(y); compares objects or primitives x and y and passes if they are equivalent
    expect(x).toBe(y); compares objects or primitives x and y and passes if they are the same object
    expect(x).toMatch(pattern); compares x to string or regular expression pattern and passes if they match
    expect(x).toBeDefined(); passes if x is not undefined
    expect(x).toBeUndefined(); passes if x is undefined
    expect(x).toBeNull(); passes if x is null
    expect(x).toBeTruthy(); passes if x evaluates to true
    expect(x).toBeFalsy(); passes if x evaluates to false
    expect(x).toContain(y); passes if array or string x contains y
    expect(x).toBeLessThan(y); passes if x is less than y
    expect(x).toBeGreaterThan(y); passes if x is greater than y
    expect(function(){fn();}).toThrow(e); passes if function fn throws exception e when executed

    Every matcher's criteria can be inverted by prepending .not:
    expect(x).not.toEqual(y); compares objects or primitives x and y and passes if they are not equivalent

    Custom matchers help to document the intent of your specs, and can help to remove code duplication in your specs.
    beforeEach(function() {
      this.addMatchers({

        toBeLessThan: function(expected) {
          var actual = this.actual;
          var notText = this.isNot ? ' not' : '';

          this.message = function () {
            return 'Expected ' + actual + notText + ' to be less than ' + expected;
          }

          return actual < expected;
        }

      });
    });

*/


describe('lib/KartuliImporter', function() {
  var corpus,
    importer,
    localUri = process.env.FIELDDB_HOME + '/FieldDB/sample_data/orthography.txt',
    remoteUri = 'https://raw.githubusercontent.com/OpenSourceFieldlinguistics/FieldDB/master/sample_data/orthography.txt';

  beforeEach(function() {
    corpus = new Corpus(Corpus.defaults);
    importer = new KartuliImporter({
      corpus: corpus
    });
  });

  it('should load', function() {
    expect(KartuliImporter).toBeDefined();
  });

  it("should be able to instantiate an object", function() {
    var importer = new KartuliImporter();
    expect(importer).toBeDefined();
  });

  it("should be able to use a corpus", function() {
    var dbname = "testingcorpusinimport-firstcorpus";
    var corpus = new Corpus(Corpus.defaults);
    expect(corpus).toBeDefined();
    // console.log(corpus);
    expect(corpus.dbname).toBeDefined();

    var importer = new KartuliImporter({
      corpus: corpus
    });
    expect(importer).toBeDefined();
  });

  it("should be able to ask the corpus to create a datum", function() {
    var dbname = "testingcorpusinimport-firstcorpus";
    var corpus = new Corpus(Corpus.defaults);
    corpus.dbname = dbname;
    var datum = corpus.newDatum();
    console.log(datum);
    expect(datum).toBeDefined();
  });


});

describe("Batch KartuliImporter: as a morphologist I want to import directories of text files for machine learning", function() {
  var corpus,
    importer,
    localUri = process.env.FIELDDB_HOME + '/FieldDB/sample_data/orthography.txt',
    remoteUri = 'https://raw.githubusercontent.com/OpenSourceFieldlinguistics/FieldDB/master/sample_data/orthography.txt';

  var defaultOptions = {
    uri: localUri,
    readOptions: {
      readFileFunction: function(callback) {
        fs.readFile(localUri, 'utf8', callback);
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
    }
  };

  beforeEach(function() {
    var dbname = "testingbatchimport-kartuli"
    corpus = new Corpus(Corpus.defaults);
    corpus.dbname = dbname;
    corpus.language = {
      "ethnologueUrl": "",
      "wikipediaUrl": "",
      "iso": "ka",
      "locale": "",
      "englishName": "",
      "nativeName": "",
      "alternateNames": ""
    };
    importer = new KartuliImporter({
      dbname: dbname,
      corpus: corpus
    });
    console.log('corpus', importer.corpus);
  });


  it('should provide a read file hook', function(done) {
    expect(importer.preprocess).toBeDefined();
    defaultOptions.rawText = "placeholder text ";

    importer
      .readUri({
        uri: localUri,
        readOptions: defaultOptions.readOptions
      })
      .then(function(result) {
        console.log('after preprocess file');
        expect(result.datum).toBeDefined();
        expect(result.rawText.substring(0, 20)).toEqual('Noqata qan qaparinay');
      })
      .then(done, done);

  }, specIsRunningTooLong);

  it('should provide a preprocess hook', function(done) {
    expect(importer.preprocess).toBeDefined();
    // defaultOptions.rawText = "placeholder text ";
    importer
      .readUri(defaultOptions)
      .then(importer.preprocess)
      .then(function(result) {
        console.log('after preprocess file');
        expect(result.datum.datumFields.utterance).toBeDefined();
        expect(result.preprocessedUrl).toEqual(process.env.FIELDDB_HOME + '/FieldDB/sample_data/orthography_preprocessed.json');

        if (result.datum.datumFields.orthography.value !== result.rawText.trim()) {
          expect(result.datum.datumFields.originalText.value)
            .toEqual(result.rawText.trim());
        } else {
          expect(result.datum.datumFields.orthography.value)
            .toEqual(result.rawText.trim());
        }
      })
      .then(done, done);

  }, specIsRunningTooLong);


  it('should provide a addUri hook', function(done) {
    expect(importer.preprocess).toBeDefined();
    expect(importer.corpus).toBeDefined();
    expect(importer.corpus.newDatum).toBeDefined();
    defaultOptions.rawText = "placeholder text ";

    importer
      .addFileUri(defaultOptions)
      .then(function(result) {
        console.log('after preprocess file');
        expect(result).toBeDefined();
        // expect(result.datum.datumFields.utterance).toBeDefined();
        // expect(result.preprocessedUrl).toEqual(process.env.FIELDDB_HOME + '/FieldDB/sample_data/orthography_preprocessed.json');

      })
      .then(done, done);

  }, specIsRunningTooLong);

});

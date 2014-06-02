/*
 * Kartuli Raw Text Preprocessor and Importer
 * https://github.com/batumi/Gadatsqvetilebebi
 *
 * Copyright (c) 2014 Batumi App devs
 * Licensed under the Apache 2.0 license.
 */

(function(exports) {

  'use strict';

  var FieldDBObject = require('fielddb/api/FieldDBObject').FieldDBObject;

  var KartuliImporter = function KartuliImporter(options) {
    // console.log("In KartuliImporter ", options);
    FieldDBObject.apply(this, arguments);
  };

  KartuliImporter.prototype = Object.create(FieldDBObject.prototype, /** @lends KartuliImporter.prototype */ {
    constructor: {
      value: KartuliImporter
    }
  });

  console.log(KartuliImporter);
  exports.KartuliImporter = KartuliImporter;

}(typeof exports === 'object' && exports || this));

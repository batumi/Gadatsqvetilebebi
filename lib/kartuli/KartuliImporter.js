/*
 * Kartuli Raw Text Preprocessor and Importer
 * https://github.com/batumi/Gadatsqvetilebebi
 *
 * Copyright (c) 2014 Batumi App devs
 * Licensed under the Apache 2.0 license.
 */

(function(exports) {

  'use strict';

  var Import = require('fielddb/api/import/Import').Import;

  var KartuliImporter = function KartuliImporter(options) {
    Import.apply(this, arguments);
  };

  KartuliImporter.prototype = Object.create(Import.prototype, /** @lends KartuliImporter.prototype */ {
    constructor: {
      value: KartuliImporter
    }

  });

  exports.KartuliImporter = KartuliImporter;

}(typeof exports === 'object' && exports || this));

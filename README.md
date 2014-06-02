# Gadatsqvetilebebi

Web spider and corpora importer for public legal decisions

## Getting Started
### On the server
Install the module with: `npm install gadatsqvetilebebi`

```javascript
var Gadatsqvetilebebi = require('Gadatsqvetilebebi');
Gadatsqvetilebebi.init(); // "init"
```

### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/batumi/Gadatsqvetilebebi/master/dist/Gadatsqvetilebebi.min.js
[max]: https://raw.github.com/batumi/Gadatsqvetilebebi/master/dist/Gadatsqvetilebebi.js

In your web page:

```html
<script src="dist/Gadatsqvetilebebi.min.js"></script>
<script>
init(); // "init"
</script>
```

In your code, you can attach Gadatsqvetilebebi's methods to any object.

```html
<script>
var exports = Bocoup.utils;
</script>
<script src="dist/Gadatsqvetilebebi.min.js"></script>
<script>
Bocoup.utils.init(); // "init"
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
* June 14 2013 Extractor for YouVersion
* May 20 2014 Extractor for generic html, doc, docx, pdf

## License
Copyright (c) 2014 batumi  
Licensed under the Apache 2.0 license.

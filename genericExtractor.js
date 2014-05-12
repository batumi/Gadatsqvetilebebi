var extract = function($) {
	// $('a.title').each(function () {
	//     console.log('%s (%s)', $(this).text(), $(this).attr('href'));
	// });
	return $('body').text();
}
exports.extract = extract;

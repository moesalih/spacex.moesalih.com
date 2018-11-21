'use strict'

const request = require('request')
const cheerio = require('cheerio')


module.exports.launches = (event, context, callback) => {

	request.get({
		url: 'https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches',
	}, function(error, response, body) {
		if (!body) {
			console.log(error, response)
			callback(null, {
				statusCode: 400,
				body: '',
			})
			return
		}

		var $ = cheerio.load(body)
		var futureLaunchesH2 = $("#Future_launches").parent()

		var table = futureLaunchesH2.nextAll('table')

		var rows = table.find("tr")
		rows = rows.filter(function(i, el) {
			if ($(this).find("th").length > 0) return false // hide header
			if ($(this).find("td").first().attr("colspan") == 6) return false // hide year rows
			return true
		})


		var result = '<html><head>'
		result += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">'
		result += '<meta charset="UTF-8">'
		result += '<title>SpaceX Launches 🚀</title>'
		result += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">'
		result += '</head><body><div class="container"><br />'
		result += '<h3>SpaceX Launches 🚀</h3><hr />'

		rows.each(function(i, el) {

			var children = $(this).children()
			if (children.first().attr("rowspan")) {

				var date = removeReferences(children.eq(0).text())
				var type = removeReferences(children.eq(1).text())
				var site = removeReferences(children.eq(2).text())
				var payload = removeReferences(children.eq(3).text())
				var orbit = removeReferences(children.eq(4).text())
				var customer = removeReferences(children.eq(5).text())

				result += '<strong>' + date + '</strong><br /><small style="opacity:0.5">'
				result += type + " • "
				result += site + " • "
				result += orbit + "</small><br />"
				result += payload + " • "
				result += customer + "<br />"
			}
			if (children.first().attr("colspan")) {
				var note = removeReferences(children.eq(0).text())
				result += '<div class="small">' + note + '</div><hr />'
			}

		})

		result += '<small style="opacity:0.5">Source: <a href="https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches" target="_blank">List of Falcon 9 and Falcon Heavy launches</a></small><br /><br />'
		result += '</div></body></html>'


		callback(null, {
			statusCode: 200,
			headers: {"content-type": "text/html charset=utf-8"},
			body: result,
		})
	})

}

function removeReferences(string) {
	return string.replace(/\[\d+\]/g, "")
}

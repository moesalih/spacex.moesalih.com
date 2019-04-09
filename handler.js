'use strict'
const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const mustache = require('mustache')


module.exports.launchesApi = (event, context, callback) => {
	getLaunches(data => {
		if (!data) {
			callback(null, { statusCode: 400, body: '' })
			return
		}
		callback(null, {
			statusCode: 200,
			headers: {"content-type": "application/json; charset=utf-8"},
			body: JSON.stringify(data),
		})
	})
}

module.exports.launches = (event, context, callback) => {
	getLaunches(data => {
		if (!data) {
			callback(null, { statusCode: 400, body: '' })
			return
		}

		fs.readFile('launches.mustache', 'utf8', (err, template) => {
			callback(null, {
				statusCode: 200,
				headers: {"content-type": "text/html; charset=utf-8"},
				body: mustache.render(template, data),
			})
		})

	})
}



function getLaunches(callback) {
	request.get({
		url: 'https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches',
	}, function(error, response, body) {
		if (!body) {
			console.log(error, response)
			callback(null)
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

		var data = {
			launches: []
		}
		var launch = {}
		rows.each(function(i, el) {
			var children = $(this).children()
			// console.log(children.length)
			if (children.first().attr("rowspan")) {
				launch = {}
				launch.date = removeReferences(children.eq(0).text())
				launch.type = removeReferences(children.eq(1).text())
				launch.site = removeReferences(children.eq(2).text())
				launch.payload = removeReferences(children.eq(3).text())
				launch.orbit = removeReferences(children.eq(4).text())
				launch.customer = removeReferences(children.eq(5).text())
			}
			else if (!children.first().attr("colspan") && children.length == 1) {
				launch.type += ', ' + removeReferences(children.eq(0).text())
			}
			else if (children.first().attr("colspan")) {
				launch.note = removeReferences(children.eq(0).text())
				data.launches.push(launch)
			}

		})

		// console.log(data)
		callback(data)
	})
}

function removeReferences(string) {
	return string.replace(/\[\d+\]/g, "").replace(/\n$/g, "")
}

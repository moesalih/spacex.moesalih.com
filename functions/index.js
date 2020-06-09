const functions = require('firebase-functions');

const fs = require('fs')
const util = require('util')
const request = require('request')
const cheerio = require('cheerio')
const mustache = require('mustache')
const moment = require('moment-timezone')
const ical = require('ical-generator')

const get_ = util.promisify(request.get)
const readFile_ = util.promisify(fs.readFile);



let cacheControl = 'public, max-age=1800'


exports.starlinkApi = require('./starlink').starlinkApi

exports.launchesApi = functions.https.onRequest(async (request, response) => {
	try {
		let data = await getLaunches()
		if (!data) { throw null }

		response.header('Access-Control-Allow-Origin', '*')
		response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
		response.set('Cache-Control', cacheControl)
		response.json(data)

	} catch(e) {
		response.json({ error: e })
	}
})


exports.launches = functions.https.onRequest(async (request, response) => {
	try {
		let data = await getLaunches()
		if (!data) { throw null }

		let template = await readFile_('launches.mustache', 'utf8')

		response.set('Cache-Control', cacheControl)
		response.send(mustache.render(template, data));

	} catch(e) {
		response.json({ error: e });
	}
})

exports.launchesCal = functions.https.onRequest(async (request, response) => {
	try {
		let data = await getLaunches()
		if (!data) { throw null }

		data.launches = data.launches.filter(l => !!l.date)

		const timezone = 'UTC'
		const cal = ical({ domain: 'spacex.moesalih.com', name: 'SpaceX Launches' }).timezone(timezone)

		for (let launch of data.launches) {
			// console.log(launch)
			const event = cal.createEvent({
				start: moment.tz(launch.date, timezone),
				end: moment.tz(launch.date, timezone).add(1, 'hour'),
				timezone: timezone,
				summary: launch.payload + ' • ' + launch.customer,
				location: launch.type + ' • ' + launch.site + ' • ' + launch.orbit,
				description: launch.note,
				organizer: 'SpaceX <hello@spacex.com>'
			})
			const alarm = event.createAlarm({type: 'audio', trigger: 1800});
		}

		response.contentType('text/calendar; charset=utf-8')
		response.set('Cache-Control', cacheControl)
		response.send(cal.toString());

	} catch(e) {
		console.log(e);
		response.json({ error: e.message });
	}
})



async function getLaunches() {
	try {

		let { statusCode, body } = await get_({ url: 'https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches', timeout: 5000 })
		if (!body) { throw null }

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
				launch.dateText = removeReferences(children.eq(0).text())
				launch.dateText = launch.dateText.replace(/(\d\d:\d\d)/, ' $1')
				if (launch.dateText.match(/(\d\d:\d\d)/)) launch.date = new Date(launch.dateText + ' UTC')
				if (isNaN(launch.date)) launch.date = null
				launch.type = removeReferences(children.eq(1).text())
				launch.site = removeReferences(children.eq(2).text())
				launch.payload = removeReferences(children.eq(3).text())
				if (launch.payload.includes('Starlink')) launch.payloadIcon = '🛰'
				if (launch.payload.includes('GPS')) launch.payloadIcon = '📍'
				launch.orbit = removeReferences(children.eq(4).text())
				launch.customer = removeReferences(children.eq(5).text())
			}
			else if (!children.first().attr("colspan") && children.length == 1) {
				launch.type += ', ' + removeReferences(children.eq(0).text())
			}
			else if (children.first().attr("colspan")) {
				launch.note = removeReferences(children.eq(0).text())
				if (launch.note.includes('astronaut')) launch.payloadIcon = '👨‍🚀'
				if (launch.note.toLowerCase().includes('lunar')) launch.payloadIcon = '🌘'
				if (launch.note.toLowerCase().includes('classified')) launch.payloadIcon = '👽'
				if (launch.note.toLowerCase().includes('tourist')) launch.payloadIcon = '👨‍🚀'
				data.launches.push(launch)
			}

		})

		// console.log(data)
		return data

	} catch(e) {
		console.error(e);
		return null
	}
}

function removeReferences(string) {
	return string.replace(/\[\d+\]/g, "").replace(/\n$/g, "")
}

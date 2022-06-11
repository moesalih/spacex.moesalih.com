const functions = require('firebase-functions');
var admin = require("firebase-admin");
admin.initializeApp();
var bucket = admin.storage().bucket();

const axios = require('axios');
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const ical = require('ical-generator')




let cacheControl = 'public, max-age=1800'

let saveCache = async (data, file) => {
	if (!data) { return null }
	await bucket.file(file).save(JSON.stringify(data), {
		metadata: {
			contentType: 'application/json'
		}
	})
	return data
}





exports.testCacheStarlink = functions.https.onRequest(async (request, response) => {
	try {
		let data = await require('./starlink').getStarlinkData()
		if (!data) { throw null }
		await saveCache(data, 'starlink.json')
		response.json(data)
	} catch (e) {
		console.error(e)
		response.json({ error: e })
	}
})
exports.scheduledCacheStarlink = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
	try {
		let data = await require('./starlink').getStarlinkData()
		if (!data) { throw null }
		await saveCache(data, 'starlink.json')
	} catch (e) {
		console.error(e)
	}
})




exports.testCacheLaunches = functions.https.onRequest(async (request, response) => {
	try {
		let data = await getLaunches()
		if (!data) { throw null }
		await saveCache(data, 'launches.json')
		response.json(data)
	} catch (e) {
		console.error(e)
		response.json({ error: e })
	}
})
exports.scheduledCacheLaunches = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
	try {
		let data = await getLaunches()
		if (!data) { throw null }
		await saveCache(data, 'launches.json')
	} catch (e) {
		console.error(e)
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
				summary: '🚀 ' + (launch.payloadIcon ? launch.payloadIcon + ' ' : '') + launch.payload + ' • ' + launch.customer,
				location: launch.type + ' • ' + launch.site + ' • ' + launch.orbit,
				description: launch.note,
				organizer: 'SpaceX <hello@spacex.com>'
			})
			const alarm = event.createAlarm({ type: 'audio', trigger: 1800 });
		}

		response.contentType('text/calendar; charset=utf-8')
		response.set('Cache-Control', cacheControl)
		response.send(cal.toString());

	} catch (e) {
		console.log(e);
		response.json({ error: e.message });
	}
})

exports.testLaunches = functions.https.onRequest(async (request, response) => {
	try {
		let data = await getLaunches()
		response.json(data)
	} catch (e) {
		console.error(e)
		response.json({ error: e })
	}
})


async function getLaunches() {
	try {


		var old = await loadPage('https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches_(2010%E2%80%932019)')
		var current = await loadPage('https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches')
		
		var data = {
			pastLaunches: [
				...getRows(old, '#Launches', 'table.collapsible', parsePastRows),
				...getRows(current, '#Past_launches', 'table.collapsible', parsePastRows),
			],
			launches: [
				...getRows(current, '#Future_launches', 'table', parseFutureRows),
			],
		}

		// console.log(data)
		return data

	} catch (e) {
		console.error(e);
		return null
	}
}

async function loadPage(url) {
	let response = await axios({ url, timeout: 5000 })
	if (!response.data) { throw null }

	var $ = cheerio.load(response.data)
	return $
}

function getRows($, h2Selector, tableSelector, parseFunc) {
	var launchesH2 = $(h2Selector).parent()
	var launchesTable = launchesH2.nextAll(tableSelector)

	var rows = launchesTable.find("tr")
	rows = rows.filter(function (i, el) {
		if ($(this).find("th").length > 2) return false // hide header
		// if ($(this).find("td").first().attr("colspan") == 6) return false // hide year rows
		return true
	})

	let launches = parseFunc(rows, $)
	return launches
}

function parseFutureRows(rows, $) {
	var launches = []
	var launch = {}
	rows.each(function (i, el) {
		$(this).find('br').replaceWith(' ')
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
			launch.payloadIcon = getPayloadIcon(launch.payload)
			launch.orbit = removeReferences(children.eq(4).text())
			launch.customer = removeReferences(children.eq(5).text())
		}
		else if (!children.first().attr("colspan") && children.length == 1) {
			launch.type += ', ' + removeReferences(children.eq(0).text())
		}
		else if (children.first().attr("colspan")) {
			launch.note = removeReferences(children.eq(0).text())
			launch.payloadIcon = launch.payloadIcon || getPayloadIcon(launch.note)
			launches.push(launch)
		}
	})
	return launches
}
function parsePastRows(rows, $) {
	var launches = []
	var launch = {}
	rows.each(function (i, el) {
		$(this).find('br').replaceWith(' ')
		var children = $(this).children()
		// console.log(children.length)
		if (children.first().attr("rowspan")) {
			launch = {}
			launch.dateText = removeReferences(children.eq(1).text())
			launch.dateText = launch.dateText.replace(/(\d\d:\d\d)/, ' $1')
			if (launch.dateText.match(/(\d\d:\d\d)/)) launch.date = new Date(launch.dateText + ' UTC')
			if (isNaN(launch.date)) launch.date = null
			launch.type = removeReferences(children.eq(2).text())
			launch.site = removeReferences(children.eq(3).text())
			launch.payload = removeReferences(children.eq(4).text())
			launch.payloadIcon = getPayloadIcon(launch.payload)
			launch.orbit = removeReferences(children.eq(6).text())
			launch.customer = removeReferences(children.eq(7).text())
			launch.outcome = removeReferences(children.eq(8).text())
		}
		else if (!children.first().attr("colspan") && children.length == 2) {
			launch.type += ', ' + removeReferences(children.eq(0).text())
		}
		else if (children.first().attr("colspan")) {
			launch.note = removeReferences(children.eq(0).text())
			launch.payloadIcon = launch.payloadIcon || getPayloadIcon(launch.note)
			launches.push(launch)
		}
	})
	return launches
}

function getPayloadIcon(text) {
	if (text.toLowerCase().includes('starlink')) return '🛰'
	if (text.toLowerCase().includes('gps')) return '📍'
	if (text.toLowerCase().includes('crs')) return '📦'
	if (text.toLowerCase().includes('astronaut')) return '👨‍🚀'
	if (text.toLowerCase().includes('lunar')) return '🌘'
	if (text.toLowerCase().includes('classified')) return '👽'
	if (text.toLowerCase().includes('tourist')) return '👨‍🚀'
	if (text.toLowerCase().includes('rideshare')) return '🚌'
	return null
}

function removeReferences(string) {
	return string.replace(/\[\d+\]/g, "").replace(/\n$/g, "")
}

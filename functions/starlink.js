const functions = require('firebase-functions');

const axios = require('axios');
const { getEpochTimestamp, getSatelliteInfo } = require('tle.js');



module.exports = {}

module.exports.starlinkApi = functions.https.onRequest(async (request, response) => {
	// module.exports.test = functions.https.onCall(async (data, context) => {

	try {

		let data = await getStarlinkData()

		response.header('Access-Control-Allow-Origin', '*')
		response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
		response.set('Cache-Control', 'public, max-age=1800')
		response.json(data)

	} catch(e) {
		console.error(e)
		response.json({ error: e })
	}
})


let array_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill(0).map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));

let getStarlinkData = async () => {
	let loginReposnse = await axios.post('https://www.space-track.org/ajaxauth/login', {
		identity: functions.config().spacetrack.email,
		password: functions.config().spacetrack.password
	})
	let cookie = loginReposnse.headers['set-cookie'][0]

	let satelliteIds = require('fs').readFileSync('starlink-satellites.txt', 'utf8')
	satelliteIds = satelliteIds.split('\n').map(l => l.trim()).filter(l => !!l)

	let satelliteIdsChunks = array_chunks(satelliteIds, 500)
	console.log(satelliteIdsChunks.length);

	let promises = satelliteIdsChunks.map(satelliteIds => {
		let satelliteIdsText = satelliteIds.join(',')
		console.log(satelliteIdsText);

		return axios.get('https://www.space-track.org/basicspacedata/query/class/gp/NORAD_CAT_ID/'+satelliteIdsText+'/orderby/TLE_LINE1 ASC/format/3le', {
			headers: { 'Cookie': cookie }
		}).then(dataResponse => {
			console.log('response');
			let data = parseTLE(dataResponse.data)
			return data
		})
	})

	return Promise.all(promises).then(data => {
		let finalData = []
		for (const d of data) {
			finalData = finalData.concat(d)
		}
		return new Promise((resolve, reject) => resolve(finalData))
	})
}


let parseTLE = (tle) => {
	let lines = tle.split('\n').map(l => l.trim())
	// console.log(lines)

	let satellites = []
	let currentSatellite

	for (var line of lines) {
		// console.log(line)
		let components = line.split(' ').filter(c => !!c)
		// console.log(components)

		switch (components[0]) {

			case '0': // satellite name
			currentSatellite = { name: components[1] }
			break

			case '1': // info
			currentSatellite.tle1 = line
			currentSatellite.designator = components[2]
			currentSatellite.launch = designatorToLaunchNumber(currentSatellite.designator)
			let yearText = components[3].substring(0,2)
			currentSatellite.year = parseInt(yearText) + 2000
			let dayText = components[3].substring(2)
			currentSatellite.day = parseFloat(dayText)
			break

			case '2': // data
			currentSatellite.tle2 = line
			currentSatellite.id = components[1]
			currentSatellite.inclination = parseFloat(components[2])
			currentSatellite.longitudeAscendingNode = parseFloat(components[3])
			currentSatellite.argumentOfPerigee = parseFloat(components[5])
			currentSatellite.anomaly = parseFloat(components[6])
			currentSatellite.motion = parseFloat(components[7])

			try {
				let tle = [currentSatellite.tle1,currentSatellite.tle2]
				currentSatellite.timestamp = getEpochTimestamp(tle)
				currentSatellite.info = getSatelliteInfo(tle)
			} catch (e) {
				// console.log(e);
				currentSatellite.info = {}
			}
			satellites.push(currentSatellite)
			currentSatellite = null
			break

			default:
			break
		}

	}

	return satellites
}

let designatorToLaunchNumber = (designator) => {
	let launches = {
		'19029': 'Starlink-0',
		'19074': 'Starlink 1-10',

		'20001': 'Starlink 1-10',
		'20006': 'Starlink 1-10',
		'20012': 'Starlink 1-10',
		'20019': 'Starlink 1-10',
		'20025': 'Starlink 1-10',
		'20035': 'Starlink 1-10',
		'20038': 'Starlink 1-10',
		'20055': 'Starlink 1-10',
		'20057': 'Starlink 1-10',
		'20062': 'Starlink-11',
		'20070': 'Starlink-12',
		'20073': 'Starlink-13',
		'20074': 'Starlink-14',
		'20088': 'Starlink-15',
		
		'21005': 'Starlink-16',
		'21006': 'Starlink-Polar',
		'21009': 'Starlink-18',
		'21012': 'Starlink-19',
		'21017': 'Starlink-17',
	}
	for (var l in launches) {
		if (designator.includes(l)) return launches[l]
	}
	return 'Starlink-X'
}

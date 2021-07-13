const functions = require('firebase-functions');

const axios = require('axios');
const { getEpochTimestamp, getSatelliteInfo } = require('tle.js');



module.exports = {}


module.exports.getStarlinkData = async () => {
	// Login to space-track.org
	let loginReposnse = await axios.post('https://www.space-track.org/ajaxauth/login', {
		identity: functions.config().spacetrack.email,
		password: functions.config().spacetrack.password
	})
	let cookie = loginReposnse.headers['set-cookie'][0]

	// get satellite data
	let satelliteDataResponse = await axios.get('https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_NAME/~~starlink/orderby/NORAD_CAT_ID%20asc/emptyresult/show', {
		headers: { 'Cookie': cookie }
	})
	let starlinkData = satelliteDataResponse.data.map(parseSatelliteData)

	return starlinkData
}

let parseSatelliteData = (satelliteData) => {
	let data = {}
	data.name = satelliteData.OBJECT_NAME
	data.launchDate = satelliteData.LAUNCH_DATE

	if (satelliteData.TLE_LINE1) {
		data.tle1 = satelliteData.TLE_LINE1
		let components = satelliteData.TLE_LINE1.split(' ').filter(c => !!c)
		data.designator = components[2]
		data.launch = designatorToLaunchNumber(data.designator)
		let yearText = components[3].substring(0,2)
		data.year = parseInt(yearText) + 2000
		let dayText = components[3].substring(2)
		data.day = parseFloat(dayText)
	}
	if (satelliteData.TLE_LINE2) {
		data.tle2 = satelliteData.TLE_LINE2
		let components = satelliteData.TLE_LINE2.split(' ').filter(c => !!c)
		data.id = components[1]
		data.inclination = parseFloat(components[2])
		data.longitudeAscendingNode = parseFloat(components[3])
		data.argumentOfPerigee = parseFloat(components[5])
		data.anomaly = parseFloat(components[6])
		data.motion = parseFloat(components[7])
	}

	try {
		let tle = [data.tle1, data.tle2]
		data.timestamp = getEpochTimestamp(tle)
		data.info = getSatelliteInfo(tle)
	} catch (e) {
		// console.log(e);
		data.info = {}
	}

	return data
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

		'20062': 'Starlink 11-15',
		'20070': 'Starlink 11-15',
		'20073': 'Starlink 11-15',
		'20074': 'Starlink 11-15',
		'20088': 'Starlink 11-15',
		
		'21005': 'Starlink-16',
		'21006': 'Starlink Polar 1',
		'21009': 'Starlink-18',
		'21012': 'Starlink-19',
		'21017': 'Starlink-17',
		'21018': 'Starlink-20',

		'21021': 'Starlink-21',
		'21024': 'Starlink-22',
		'21027': 'Starlink-23',
		'21036': 'Starlink-24',
		'21038': 'Starlink-25',

		'21040': 'Starlink-27',
		'21041': 'Starlink-26',
		'21044': 'Starlink-28',
		'21059': 'Starlink Polar 2',
	}
	for (var l in launches) {
		if (designator.includes(l)) return launches[l]
	}
	return 'Starlink-X'
}

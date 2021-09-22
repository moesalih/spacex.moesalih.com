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
		data.version = designatorToLaunchVersion(data.designator)
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


let designatorToLaunchVersion = (designator) => {
	let launches = {
		'19029': 'Starlink v0.9',

		'19074': 'Starlink v1.0',
		'20001': 'Starlink v1.0',
		'20006': 'Starlink v1.0',
		'20012': 'Starlink v1.0',
		'20019': 'Starlink v1.0',
		'20025': 'Starlink v1.0',
		'20035': 'Starlink v1.0',
		'20038': 'Starlink v1.0',
		'20055': 'Starlink v1.0',
		'20057': 'Starlink v1.0',
		'20062': 'Starlink v1.0',
		'20070': 'Starlink v1.0',
		'20073': 'Starlink v1.0',
		'20074': 'Starlink v1.0',
		'20088': 'Starlink v1.0',
		
		'21005': 'Starlink v1.0',
		'21006': 'Starlink v1.0',
		'21009': 'Starlink v1.0',
		'21012': 'Starlink v1.0',
		'21017': 'Starlink v1.0',
		'21018': 'Starlink v1.0',
		'21021': 'Starlink v1.0',
		'21024': 'Starlink v1.0',
		'21027': 'Starlink v1.0',
		'21036': 'Starlink v1.0',
		'21038': 'Starlink v1.0',
		'21040': 'Starlink v1.0',
		'21041': 'Starlink v1.0',
		'21044': 'Starlink v1.0',
		'21059': 'Starlink v1.0',

		'21082': 'Starlink v1.5',
	}
	for (var l in launches) {
		if (designator.includes(l)) return launches[l]
	}
	return 'Starlink v1.5'
}

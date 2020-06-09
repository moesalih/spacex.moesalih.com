const functions = require('firebase-functions');

const axios = require('axios');



module.exports = {}

module.exports.starlinkApi = functions.https.onRequest(async (request, response) => {
	// module.exports.test = functions.https.onCall(async (data, context) => {

	try {

		let data = await getStarlinkData()
		console.log(data)

		response.header('Access-Control-Allow-Origin', '*')
		response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
		response.set('Cache-Control', 'public, max-age=300')
		response.json(data)

	} catch(e) {
		console.error(e)
		response.json({ error: e })
	}
})


let getStarlinkData = async () => {
	let loginReposnse = await axios.post('https://www.space-track.org/ajaxauth/login', {
		identity: functions.config().spacetrack.email,
		password: functions.config().spacetrack.password
	})
	let cookie = loginReposnse.headers['set-cookie'][0]

	let satelliteIds = `
	44235
	44236
	44237
	44238
	44239
	44240
	44241
	44242
	44243
	44244
	44245
	44246
	44247
	44248
	44249
	44250
	44251
	44252
	44253
	44254
	44255
	44256
	44257
	44258
	44259
	44260
	44261
	44262
	44263
	44264
	44265
	44266
	44267
	44268
	44269
	44270
	44271
	44272
	44273
	44274
	44275
	44276
	44277
	44278
	44279
	44280
	44281
	44282
	44283
	44284
	44285
	44286
	44287
	44288
	44289
	44290
	44291
	44292
	44293
	44294
	44713
	44714
	44715
	44716
	44717
	44718
	44719
	44720
	44721
	44722
	44723
	44724
	44725
	44726
	44727
	44728
	44729
	44730
	44731
	44732
	44733
	44734
	44735
	44736
	44737
	44738
	44739
	44740
	44741
	44742
	44743
	44744
	44745
	44746
	44747
	44748
	44749
	44750
	44751
	44752
	44753
	44754
	44755
	44756
	44757
	44758
	44759
	44760
	44761
	44762
	44763
	44764
	44765
	44766
	44767
	44768
	44769
	44770
	44771
	44772
	44914
	44915
	44916
	44917
	44918
	44919
	44920
	44921
	44922
	44923
	44924
	44925
	44926
	44927
	44928
	44929
	44930
	44931
	44932
	44933
	44934
	44935
	44936
	44937
	44938
	44939
	44940
	44941
	44942
	44943
	44944
	44945
	44946
	44947
	44948
	44949
	44950
	44951
	44952
	44953
	44954
	44955
	44956
	44957
	44958
	44959
	44960
	44961
	44962
	44963
	44964
	44965
	44966
	44967
	44968
	44969
	44970
	44971
	44972
	44973
	45044
	45045
	45046
	45047
	45048
	45049
	45050
	45051
	45052
	45053
	45054
	45055
	45056
	45057
	45058
	45059
	45060
	45061
	45062
	45063
	45064
	45065
	45066
	45067
	45068
	45069
	45070
	45071
	45072
	45073
	45074
	45075
	45076
	45077
	45078
	45079
	45080
	45081
	45082
	45083
	45084
	45085
	45086
	45087
	45088
	45089
	45090
	45091
	45092
	45093
	45094
	45095
	45096
	45097
	45098
	45099
	45100
	45101
	45102
	45103
	45178
	45179
	45180
	45181
	45182
	45183
	45184
	45185
	45186
	45187
	45188
	45189
	45190
	45191
	45192
	45193
	45194
	45195
	45196
	45197
	45198
	45199
	45200
	45201
	45202
	45203
	45204
	45205
	45206
	45207
	45208
	45209
	45210
	45211
	45212
	45213
	45214
	45215
	45216
	45217
	45218
	45219
	45220
	45221
	45222
	45223
	45224
	45225
	45226
	45227
	45228
	45229
	45230
	45231
	45232
	45233
	45234
	45235
	45236
	45237
	45360
	45361
	45362
	45363
	45364
	45365
	45366
	45367
	45368
	45369
	45370
	45371
	45372
	45373
	45374
	45375
	45376
	45377
	45378
	45379
	45380
	45381
	45382
	45383
	45384
	45385
	45386
	45387
	45388
	45389
	45390
	45391
	45392
	45393
	45394
	45395
	45396
	45397
	45398
	45399
	45400
	45401
	45402
	45403
	45404
	45405
	45406
	45407
	45408
	45409
	45410
	45411
	45412
	45413
	45414
	45415
	45416
	45417
	45418
	45419
	45531
	45532
	45533
	45534
	45535
	45536
	45537
	45538
	45539
	45540
	45541
	45542
	45543
	45544
	45545
	45546
	45547
	45548
	45549
	45550
	45551
	45552
	45553
	45554
	45555
	45556
	45557
	45558
	45559
	45560
	45561
	45562
	45563
	45564
	45565
	45566
	45567
	45568
	45569
	45570
	45571
	45572
	45573
	45574
	45575
	45576
	45577
	45578
	45579
	45580
	45581
	45582
	45583
	45584
	45585
	45586
	45587
	45588
	45589
	45590
	`.split('\n').map(l => l.trim()).filter(l => !!l).join(',')
	console.log(satelliteIds);

	let dataResponse = await axios.get('https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/NORAD_CAT_ID/'+satelliteIds+'/orderby/TLE_LINE1 ASC/format/3le', {
		headers: { 'Cookie': cookie }
	})

	let data = parseTLE(dataResponse.data)
	return data
}


let parseTLE = (tle) => {
	let lines = tle.split('\n').map(l => l.trim())
	// console.log(lines)

	let satellites = []
	let currentSatellite

	for (var line of lines) {
		console.log(line)
		let components = line.split(' ').filter(c => !!c)
		// console.log(components)

		switch (components[0]) {

			case '0': // satellite name
			currentSatellite = { name: components[1] }
			break

			case '1': // info
			currentSatellite.designator = components[2]
			currentSatellite.launch = 'Starlink-'+designatorToLaunchNumber(currentSatellite.designator)
			let yearText = components[3].substring(0,2)
			currentSatellite.year = parseInt(yearText) + 2000
			let dayText = components[3].substring(2)
			currentSatellite.day = parseFloat(dayText)
			break

			case '2': // data
			currentSatellite.id = components[1]
			currentSatellite.inclination = parseFloat(components[2])
			currentSatellite.longitudeAscendingNode = parseFloat(components[3])
			currentSatellite.anomaly = parseFloat(components[6])
			currentSatellite.argumentOfPerigee = parseFloat(components[5])
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
	let launches = ['19029', '19074', '20001', '20006', '20012', '20019', '20025']
	for (var l of launches) {
		if (designator.includes(l)) return launches.indexOf(l)+1
	}
	return 'X'
}

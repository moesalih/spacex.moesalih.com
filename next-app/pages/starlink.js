import React from "react"
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import moment from 'moment'

import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';
import { Scatter } from 'react-chartjs-2'
import { getEpochTimestamp, getSatelliteInfo } from 'tle.js'

import * as Planetaryjs from 'planetary.js';
import worldData from 'planetary.js/dist/world-110m.json';



let colors = [
	'100,100,100',

	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',
	'140,140,140',

	'54, 162, 235',
	'100, 200, 75',
	'255, 99, 172',
	'255, 206, 86',
	'153, 102, 255',
	'255, 120, 99',

	'100, 120, 200',
	'192, 192, 75',
	'75, 192, 192',
	'255, 159, 64',
	'100, 100, 100',

	'160,160,160',
	'160,160,160',
	'160,160,160',
	'160,160,160',
	'160,160,160',
	'160,160,160',
]
const center = {
	lat: 0,
	lng: 0
}


export default class Starlink extends React.Component {

	originalSatellitesData = null
	satellites = null
	timer = null

	constructor(props) {
		super(props)
		this.state = { showView: 'globe' }
		this.getStarlinkData()
	}

	componentDidMount() {
		document.body.setAttribute('data-theme', 'dark')
	}
	componentWillUnmount() {
		clearTimeout(this.timer)
	}

	static opacityFrom(s) {
		let date = new Date(s.timestamp)
		if ((Date.now() - date.getTime()) > 7 * (1000 * 60 * 60 * 24)) return 0
		let heightRatio = (s.currentInfo.height - 300) / 250
		return heightRatio
	}


	async getStarlinkData() {
		try {
			const response = await axios.get('https://firebasestorage.googleapis.com/v0/b/spacex-launches-318bc.appspot.com/o/starlink.json?alt=media')
			this.originalSatellitesData = response.data
			this.calculateCurrentData()
		} catch (error) {
			console.error(error)
		}
	}

	getLaunches(satellites) {
		let launches = satellites.map(s => s.launch).filter((v, i, a) => i == a.indexOf(v))
		if (launches.includes('Starlink-X')) {
			launches = launches.filter(l => l != 'Starlink-X')
			launches.push('Starlink-X')
		}
		return launches
	}

	calculateCurrentData = () => {
		clearTimeout(this.timer)
		this.calculateDataAtTimestamp(new Date().getTime())
		this.timer = setTimeout(this.calculateCurrentData, 10000)
	}

	calculatePastData = (t) => {
		clearTimeout(this.timer)
		let timestamp = t || new Date().getTime() - 1000 * 60 * 92
		this.calculateDataAtTimestamp(timestamp)
		this.timer = setTimeout(() => {
			timestamp += 1000 * 12
			if (timestamp < new Date().getTime()) {
				this.calculatePastData(timestamp)
			} else {
				this.calculateCurrentData()
			}
		}, 100)
	}

	calculateDataAtTimestamp = (timestamp) => {
		// console.log(timestamp/1000)
		let RAANchangePerSec = -5.19575e-05

		let launches = this.getLaunches(this.originalSatellitesData)
		this.satellites = this.originalSatellitesData.map(s => {
			let secondsInPast = (timestamp - s.timestamp) / 1000
			let degPerSec = 360 * s.motion / (24 * 3600)

			let data = {
				...s,
				color: colors[launches.indexOf(s.launch)],
				anomalyPastAscensingNode: (s.argumentOfPerigee + s.anomaly) % 360,

				currentAnomalyPastAscensingNode: (s.argumentOfPerigee + s.anomaly + degPerSec * secondsInPast + 360) % 360,
				currentLongitudeAscendingNode: (s.longitudeAscendingNode + RAANchangePerSec * secondsInPast + 360 + 180) % 360 - 180,
			}
			try {
				let tle = [s.tle1, s.tle2]
				data.currentInfo = getSatelliteInfo(tle, timestamp)
			} catch (e) {
				data.currentInfo = {}
			}

			return data
		})
		// console.log(this.satellites)

		this.setState({ satellites: this.satellites, timestamp: timestamp, isPast: timestamp < (new Date().getTime() - 1000 * 10) })
		this.updateChart()
	}

	updateChart = () => {

		let launches = this.getLaunches(this.satellites)
		let datasets = launches.map((l, li) => {
			let launchSatellites = this.satellites.filter(s => s.launch == l)
			let points = launchSatellites.map(s => ({ y: s.currentAnomalyPastAscensingNode, x: s.currentLongitudeAscendingNode }))
			let cc = launchSatellites.map(s => 'rgba(' + s.color + ', ' + Starlink.opacityFrom(s) + ')')
			return {
				label: l,
				pointRadius: 3,
				pointBackgroundColor: cc,
				backgroundColor: 'rgba(' + colors[li] + ', 1)',
				borderColor: 'rgba(' + colors[li] + ', 0.25)',
				pointBorderWidth: 0,
				pointHoverRadius: 6,
				data: points
			}
		})
		// console.log(satellites, launches)

		let chartData = {
			datasets: datasets
		}

		let chartOptions = {
			maintainAspectRatio: false,
			animation: false,
			// legend: {
			// 	display: false
			// },
			legend: {
				labels: {
					boxWidth: 20,
				},
			},
			scales: {
				yAxes: [{
					scaleLabel: {
						labelString: 'Anomaly past Ascending Node',
						display: true,
						fontColor: '#666',
					},
					ticks: {
						max: 360,
						min: 0,
						stepSize: 20,
						fontSize: 10,
						// color: '#666',
					},
					gridLines: {
						color: '#222',
						zeroLineColor: '#444',
					},
				}],
				xAxes: [{
					scaleLabel: {
						labelString: 'Longitude of Ascending Node',
						display: true,
						fontColor: '#666',
					},
					ticks: {
						max: 180,
						min: -180,
						stepSize: 20,
						fontSize: 10,
					},
					gridLines: {
						color: '#222',
						zeroLineColor: '#444',
					},
				}]
			},
			tooltips: {
				displayColors: false,
				callbacks: {
					title: (tooltipItems, data) => {
						let tooltipItem = tooltipItems[0]
						let launch = launches[tooltipItem.datasetIndex]
						let launchSatellites = this.satellites.filter(s => s.launch == launch)
						let satellite = launchSatellites[tooltipItem.index]
						return satellite.name
					},
					label: (tooltipItem, data) => {
						let launch = launches[tooltipItem.datasetIndex]
						let launchSatellites = this.satellites.filter(s => s.launch == launch)
						let satellite = launchSatellites[tooltipItem.index]


						let label = [
							'Launch: ' + satellite.launch,
							'Designator: ' + satellite.designator,
							'',
							'Anomaly past Ascending Node: ' + satellite.currentAnomalyPastAscensingNode,
							'Longitude of Ascending Node: ' + satellite.currentLongitudeAscendingNode,
							'Altitude: ' + satellite.currentInfo.height,
						]

						return label
					},
				}
			}

		}

		// console.log(response.data)
		this.setState({ chartData: chartData, chartOptions: chartOptions })
	}

	render() {
		const googleMapsApiKey = 'AIzaSyBW6PmAbGxAU_01g4CHlZ4oaYthN0dia3c'
		const containerStyle = {
			width: '100%',
			height: '100%'
		};

		const styles = [
			{
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#333333"
					}
				]
			},
			// {
			// 	"elementType": "labels.icon",
			// 	"stylers": [
			// 		{
			// 			"visibility": "off"
			// 		}
			// 	]
			// },
			{
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#00999999"
					}
				]
			},
			{
				"elementType": "labels.text.stroke",
				"stylers": [
					{
						"color": "#00444444"
					}
				]
			},
			{
				"featureType": "administrative.land_parcel",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#bdbdbd"
					}
				]
			},
			{
				"featureType": "poi",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#eeeeee"
					}
				]
			},
			{
				"featureType": "poi",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#757575"
					}
				]
			},
			{
				"featureType": "poi.park",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#e5e5e5"
					}
				]
			},
			{
				"featureType": "poi.park",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#9e9e9e"
					}
				]
			},
			{
				"featureType": "road",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#ffffff"
					}
				]
			},
			{
				"featureType": "road.arterial",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#757575"
					}
				]
			},
			{
				"featureType": "road.highway",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#dadada"
					}
				]
			},
			{
				"featureType": "road.highway",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#616161"
					}
				]
			},
			{
				"featureType": "road.local",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#9e9e9e"
					}
				]
			},
			{
				"featureType": "transit.line",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#e5e5e5"
					}
				]
			},
			{
				"featureType": "transit.station",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#eeeeee"
					}
				]
			},
			{
				"featureType": "water",
				"elementType": "geometry",
				"stylers": [
					{
						"color": "#111111"
					}
				]
			},
			{
				"featureType": "water",
				"elementType": "labels.text.fill",
				"stylers": [
					{
						"color": "#00333333"
					}
				]
			}
		]


		return (
			<div>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
					<meta charset="UTF-8" />
					<title>Starlink 🛰</title>
					<link rel="icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/237/satellite_1f6f0.png" />

					<link rel="stylesheet" type="text/css" href="//at.alicdn.com/t/font_o5hd5vvqpoqiwwmi.css" />
					<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous" />
					<link rel="stylesheet" type="text/css" href="/bootstrap-dark.css" />

					<script async src="https://www.googletagmanager.com/gtag/js?id=UA-33281840-7"></script>
					<script dangerouslySetInnerHTML={{
						__html: `
							window.dataLayer = window.dataLayer || []
							function gtag(){dataLayer.push(arguments)}
							gtag('js', new Date())
							gtag('config', 'UA-33281840-7')
						`
					}} />

					<style media="screen">{`
						.feather { font-size: inherit }
						@media (max-width: 575px) {
							.embed-responsive-narrowsquare::before { padding-top: 100%; }
						}
					`}</style>

				</Head>

				<div class="container-lg my-4 my-lg-5">

					<div class="float-right mt-1">
						<Link href="/" ><a><span class="d-none d-md-inline-block">Launches 🚀</span><span class="d-md-none h5 text-decoration-none mr-2">🚀</span></a></Link>
						<a href="#info" class="d-md-none h5 text-muted text-decoration-none"><i class="feather icon-info"></i></a>
					</div>



					<h3 class="mb-5">Starlink Satellites 🛰</h3>

					<div class="row">
						<div class="col-md-9">

							{!this.state.chartData &&
								<div class="text-center my-5 text-muted"><div class="spinner-border" role="status"></div></div>
							}

							{this.state.chartData &&
								<>

									<div className="text-center">
										{this.state.isPast &&
											<div class="btn-group btn-group-sm mx-2 mb-2" role="group" >
												<button type="button" className="btn btn-outline-secondary disabled" >Animating most recent orbit (92 mins)</button>
												<a href="" className="btn btn-outline-secondary " onClick={(e) => { e.preventDefault(); this.calculateCurrentData() }}>Stop</a>
											</div>
										}
										{!this.state.isPast &&
											<div class="btn-group btn-group-sm mx-2 mb-2" role="group" >
												<a href="" className="btn btn-outline-secondary " onClick={(e) => { e.preventDefault(); this.calculatePastData() }}>Animate most recent orbit</a>
											</div>
										}
										<div class="btn-group btn-group-sm mx-2 mb-2" role="group" >
											<button type="button" className={"btn btn-outline-secondary " + (this.state.showView == 'globe' ? 'active' : '')} onClick={(e) => { e.preventDefault(); this.setState({ showView: 'globe' }) }}>Globe</button>
											<button type="button" className={"btn btn-outline-secondary " + (this.state.showView == 'map' ? 'active' : '')} onClick={(e) => { e.preventDefault(); this.setState({ showView: 'map' }) }}>Map</button>
											<button type="button" className={"btn btn-outline-secondary " + (this.state.showView == 'params' ? 'active' : '')} onClick={(e) => { e.preventDefault(); this.setState({ showView: 'params' }) }}>Parameters</button>
										</div>
									</div>

									<div class="text-center text-muted small mb-2">
										<div className=" text-monospace small">{moment(this.state.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
									</div>

									{this.state.showView == 'map' &&
										<div class="mb-2 embed-responsive embed-responsive-16by9">
											<div class="embed-responsive-item">
												<LoadScript googleMapsApiKey={googleMapsApiKey} >
													<GoogleMap
														mapContainerStyle={containerStyle}
														center={center}
														zoom={window.innerWidth < 1000 ? 1 : 2}
														options={{ styles: styles, disableDefaultUI: true, zoomControl: true }}
													>
														{this.state.satellites.filter(s => !!s.currentInfo.lat).map(s =>
															<Circle
																center={{ lat: s.currentInfo.lat, lng: s.currentInfo.lng }}
																radius={60000}
																options={{ fillOpacity: 1, fillColor: 'rgba(' + s.color + ',' + Starlink.opacityFrom(s) + ')', strokeColor: 'rgba(' + s.color + ',' + Starlink.opacityFrom(s) + ')', strokeWidth: 1 }}
																key={s.id} />
														)}
													</GoogleMap>
												</LoadScript>
											</div>
										</div>
									}

									{this.state.showView == 'globe' &&
										<div class="mb-2 embed-responsive embed-responsive-1by1">
											<div class="embed-responsive-item">
												<Planet satellites={this.state.satellites.filter(s => !!s.currentInfo.lat)} />
											</div>
										</div>
									}

									{this.state.showView == 'params' &&
										<div class="mb-2 embed-responsive embed-responsive-1by1">
											<div class="embed-responsive-item">
												<Scatter data={this.state.chartData} options={this.state.chartOptions} />
											</div>
										</div>
									}


									<div class="small my-5">
										<p>This chart shows the current orbital parameters of each Starlink satellite launched so far.</p>
										<p><strong>Anomaly past Ascending Node</strong> refers to the position of each satellite in its plane, and is the sum of <a href="https://en.wikipedia.org/wiki/Argument_of_periapsis" target="_blank">Argument of perigee</a> and <a href="https://en.wikipedia.org/wiki/Mean_anomaly" target="_blank">Mean anomaly</a>.</p>
										<p><a href="https://en.wikipedia.org/wiki/Longitude_of_the_ascending_node" target="_blank"><strong>Longitude of Ascending Node</strong></a> refers to the orientation of each satellite's plane.</p>
										<p>Altitude is represented by the opacity of each point (300 - 550 KM).</p>
										<p>All Starlink satellites have the same inclination of 53°.</p>

										<p>More info here: <a href="https://en.wikipedia.org/wiki/Orbital_elements" target="_blank">Orbital Elements (Wikipedia)</a></p>

									</div>

								</>
							}


						</div>
						<div class="col-md-3 ">
							<div class="sticky-top pt-0">
								<div class="rounded small bg-light p-3 " id="info">
									<div class="mb-3"><a href="/starlink/api" target="_blank">API</a></div>

									<div class="text-uppercase small text-muted">Source</div>
									<div class="mb-3"><a href="https://www.space-track.org/" target="_blank">Space-Track.org</a></div>

									<div class="text-uppercase small text-muted">Created by</div>
									<div class="mb-3"><a href="https://moesalih.com" target="_blank" class="mr-3">Moe Salih</a></div>

									<div class="text-uppercase small text-muted">Contact</div>
									<div class="mb-3"><a href="mailto:moe.salih@gmail.com" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-mail"></i></a> <a href="https://twitter.com/moesalih_" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-twitter"></i></a></div>

									<div class="text-uppercase small text-muted">Code</div>
									<div class="mb-3"><a href="https://github.com/moesalih/spacex.moesalih.com" target="_blank" class="mr-3">GitHub</a></div>

									<div class="text-uppercase small text-muted">Support this site</div>
									<div class=""><a href="https://www.paypal.me/moesalih1" target="_blank">Donate</a></div>

								</div>
							</div>
						</div>

					</div>

				</div>

			</div>
		)
	}
}


class Planet extends React.Component {

	planet = null

	getCircles() {
		return this.props.satellites.map(s => {
			return {
				circle: d3.geo.circle().origin([s.currentInfo.lng, s.currentInfo.lat]).angle(0.2)(),
				color: 'rgba(' + s.color + ',' + Starlink.opacityFrom(s) + ')'
			}
		})
	}

	componentDidMount() {
		this.planet = Planetaryjs.planet();
		const canvas = document.getElementById('globe');

		this.planet.loadPlugin(
			Planetaryjs.plugins.earth({
				topojson: { world: worldData },
				oceans: { fill: '#222' },
				land: { fill: '#333' },
				borders: { stroke: '#222' },
			})
		);
		this.planet.loadPlugin(Planetaryjs.plugins.pings());
		this.planet.loadPlugin(Planetaryjs.plugins.drag());

		this.planet.projection.scale(canvas.width / 2).translate([canvas.width / 2, canvas.width / 2]).rotate([90, -10])
		this.planet.draw(canvas);

		// this.planet.plugins.pings.add(10, 10, { color: 'red', angle: 0 })


		this.planet.onDraw(() => {
			this.planet.withSavedContext((context) => {

				context.lineWidth = 5

				this.getCircles().forEach(circle => {
					context.strokeStyle = circle.color
					context.beginPath();
					this.planet.path.context(context)(circle.circle);
					context.stroke();
				});

			});
		});

		// console.log('planet mount', this.props);
	}



	render() {
		return (
			<canvas id="globe" width="825" height="825" style={{ width: '100%', height: '100%' }} />
		)
	}

}

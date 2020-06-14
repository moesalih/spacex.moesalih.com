import React from "react"
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'

import {Scatter} from 'react-chartjs-2'


export default class Starlink extends React.Component {

	satellites = null

	constructor(props) {
		super(props)
		this.state = { }
		this.getStarlinkData()
	}

	static opacityFrom(s) {
		let date = new Date(s.timestamp)
		if ((Date.now() - date.getTime()) > 7 * (1000 * 60 * 60 * 24)) return 0
		let heightRatio = (s.info.height-300)/250
		return heightRatio
	}


	async getStarlinkData() {
		try {

			let RAANchangePerSec = -5.19575e-05

			const response = await axios.get('https://spacex.moesalih.com/starlink/api')
			this.satellites = response.data
			this.satellites = this.satellites.map(s => {
				let secondsInPast = (new Date().getTime() - s.timestamp) / 1000
				let degPerSec = 360 * s.motion / (24*3600)
				return {
					...s,
					anomalyPastAscensingNode: (s.argumentOfPerigee + s.anomaly) % 360,

					currentAnomalyPastAscensingNode: (s.argumentOfPerigee + s.anomaly + degPerSec*secondsInPast) % 360,
					currentLongitudeAscendingNode: (s.longitudeAscendingNode + RAANchangePerSec*secondsInPast) % 360,
				}
			})
			console.log(this.satellites)

			this.updateChart()

		} catch (error) {
			console.error(error)
		}
	}

	updateChart = () => {

		let colors = [
			'200,200,200',
			'255, 99, 132',
			'54, 162, 235',
			'255, 206, 86',
			'255, 159, 64',
			'75, 192, 192',
			'153, 102, 255',
			'192, 192, 75',

			'160,160,160',
		]

		let launches = this.satellites.map(s => s.launch).filter((v,i,a) => i == a.indexOf(v))
		let datasets = launches.map((l,li) => {
			let launchSatellites = this.satellites.filter(s => s.launch == l)
			let points = launchSatellites.map(s => ({ x:s.currentAnomalyPastAscensingNode, y:s.currentLongitudeAscendingNode }))
			let cc = launchSatellites.map(s => 'rgba('+colors[li]+', '+Starlink.opacityFrom(s)+')')
			return {
				label: l,
				pointRadius: 4,
				pointBackgroundColor: cc,
				backgroundColor: 'rgba('+colors[li]+', 1)',
				borderColor: 'rgba('+colors[li]+', 0.25)',
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
				xAxes: [{
					scaleLabel: {
						labelString: 'Anomaly past Ascending Node',
						display: true,
						fontColor: '#999',
					},
					ticks: {
						max: 360,
						min: 0,
						stepSize: 20,
						fontSize: 10,
					}
				}],
				yAxes: [{
					scaleLabel: {
						labelString: 'Longitude of Ascending Node',
						display: true,
						fontColor: '#999',
					},
					ticks: {
						max: 360,
						min: 0,
						stepSize: 20,
						fontSize: 10,
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
							'Argument of Perigee: ' + satellite.argumentOfPerigee,
							'Mean Anomaly: ' + satellite.anomaly,
							'Anomaly past Ascending Node: ' + satellite.anomalyPastAscensingNode,
							'Longitude of Ascending Node: ' + satellite.longitudeAscendingNode,
							'Altitude: ' + satellite.info.height,
							'',
							'Timestamp: ' + new Date(satellite.timestamp),
							'',
							'Current Anomaly past Ascending Node: ' + satellite.currentAnomalyPastAscensingNode,
							'Current Longitude of Ascending Node: ' + satellite.currentLongitudeAscendingNode,
						]

						return label
					},
				}
			}

		}

		// console.log(response.data)
		this.setState({ chartData:chartData, chartOptions:chartOptions })
	}

	render() {
		let arr = []
		return (
			<div>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
					<meta charset="UTF-8" />
					<title>Starlink 🛰</title>
					<link rel="icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/237/satellite_1f6f0.png" />

					<link rel="stylesheet" type="text/css" href="//at.alicdn.com/t/font_o5hd5vvqpoqiwwmi.css" />
					<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous" />

					/*  Global site tag (gtag.js) - Google Analytics --> */
					<script async src="https://www.googletagmanager.com/gtag/js?id=UA-33281840-7"></script>
					<script dangerouslySetInnerHTML={{ __html: `
						window.dataLayer = window.dataLayer || []
						function gtag(){dataLayer.push(arguments)}
						gtag('js', new Date())
						gtag('config', 'UA-33281840-7')
	            `}} />

					<style  media="screen">{`
						.feather { font-size: inherit }
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
							<div class="text-center my-5 text-black-50"><div class="spinner-border" role="status"></div></div>
						}

						{this.state.chartData &&
							<Scatter data={this.state.chartData} options={this.state.chartOptions} width={100} height={100} />
						}

						{this.state.chartData &&
							<div class="small my-5">
								<p>This chart show the current oribital parameters of each Starlink satellite launched so far. Please note that some satellites have different parameter timestamps so they might not line up exactly with others.</p>
								<p><strong>Anomaly past Ascending Node</strong> refers to the position of each satellite in its plane, and is the sum of <a href="https://en.wikipedia.org/wiki/Argument_of_periapsis" target="_blank">Argument of perigee</a> and <a href="https://en.wikipedia.org/wiki/Mean_anomaly" target="_blank">Mean anomoly</a>.</p>
								<p><a href="https://en.wikipedia.org/wiki/Longitude_of_the_ascending_node" target="_blank"><strong>Longitude of Ascending Node</strong></a> refers to the orientation of each satellite's plane.</p>
								<p>Altitude is represented by the opacity of each point (300 - 550 KM)</p>
								<p>All Starlink satellites have the same inclination of 53°</p>

								<p>More info here: <a href="https://en.wikipedia.org/wiki/Orbital_elements" target="_blank">Orbital Elements (Wikipedia)</a></p>

							</div>
						}

						{/*this.state.starlink && this.state.starlink.map((s,i) =>
							<div key={i}>
								<div class="font-weight-bold">{s.name}</div>
								<div class="my-1">{s.id}</div>
								<hr />
							</div>
						)*/}

						</div>
						<div class="col-md-3 ">
							<div class="sticky-top pt-3">
								<div class="rounded small bg-light p-3 " id="info">
									<div  class="mb-3"><a href="/starlink/api" target="_blank">API</a></div>

									<div  class="text-uppercase small text-muted">Source</div>
									<div  class="mb-3"><a href="https://www.space-track.org/" target="_blank">Space-Track.org</a></div>

									<div  class="text-uppercase small text-muted">Created by</div>
									<div class="mb-3"><a href="https://moesalih.com" target="_blank" class="mr-3">Moe Salih</a></div>

									<div  class="text-uppercase small text-muted">Contact</div>
									<div class="mb-3"><a href="mailto:moe.salih@gmail.com" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-mail"></i></a> <a href="https://twitter.com/moesalih_" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-twitter"></i></a></div>

									<div  class="text-uppercase small text-muted">Code</div>
									<div class="mb-3"><a href="https://github.com/moesalih/spacex.moesalih.com" target="_blank" class="mr-3">GitHub</a></div>

									<div  class="text-uppercase small text-muted">Support this site</div>
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

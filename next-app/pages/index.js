import React from "react";
import Head from 'next/head'
import Link from 'next/link'

import axios from 'axios'
import moment from 'moment'
import { Bar } from 'react-chartjs-2'

export default class Index extends React.Component {


	constructor(props) {
		super(props)
		this.state = { showView: 'upcoming' }
		this.getLaunches = this.getLaunches.bind(this)
		this.getLaunches()
		// this.onGenerate = this.onGenerate.bind(this)
	}
	componentDidMount() {
		document.body.setAttribute('data-theme', 'dark')
	}


	async getLaunches() {
		try {
			const response = await axios.get('https://firebasestorage.googleapis.com/v0/b/spacex-launches-318bc.appspot.com/o/launches.json?alt=media');
			// console.log(response.data);
			this.setState({ launches: response.data.launches, pastLaunches: response.data.pastLaunches.reverse() })

			if (this.state.launches && this.state.pastLaunches) {
				let vehicles = ['F9 v1.0', 'F9 v1.1', 'F9 FT', 'F9 B4', 'F9 B5', 'Falcon Heavy']
				let colors = [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
				]

				let getChartData = (yearLabels, launches) => {
					let getYearFromDateText = (launchDateText) => {
						for (let y of yearLabels) { if (launchDateText.includes(y)) { return y } }
					}
					let data = {
						labels: yearLabels,
						datasets: vehicles.map((v, i) => {
							let years = launches.filter(launch => launch.type.includes(v)).map(launch => getYearFromDateText(launch.dateText))
							let counts = years.reduce((map, val) => { map[val] = (map[val] || 0) + 1; return map }, {})
							return {
								label: v,
								data: yearLabels.map(y => counts[y] || 0),
								backgroundColor: colors[i],
							}
						}),
					};
					return data
				}

				let pastYears = []
				for (let index = 2010; index <= moment().year(); index++) {
					pastYears.push(index)
				}
				let futureYears = []
				for (let index = moment().year(); index <= moment().year()+4; index++) {
					futureYears.push(index)
				}

				const pastChartData = getChartData(pastYears, this.state.pastLaunches)
				const futureChartData = getChartData(futureYears, this.state.launches)

				const chartOptions = {
					maintainAspectRatio: false,
					animation: false,
					legend: {
						labels: {
							boxWidth: 20,
							fontColor: '#999',
						},
					},
					scales: {
						yAxes: [
							{
								stacked: true,
								ticks: {
									beginAtZero: true,
									fontColor: '#999',
								},
								gridLines: {
									color: '#333',
									zeroLineColor: '#444',
								},
							},
						],
						xAxes: [
							{
								stacked: true,
								ticks: {
									fontColor: '#999',
								},
								gridLines: {
									color: '#333',
									zeroLineColor: '#444',
								},
							},
						],

					},
				};

				this.setState({ pastChartData, futureChartData, chartOptions })
			}


		} catch (error) {
			console.error(error);
		}
	}

	render() {
		let launches = this.state.showView == 'upcoming' ? this.state.launches : this.state.pastLaunches

		return (
			<div>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
					<meta charset="UTF-8" />
					<title>SpaceX Launches 🚀</title>

					<link rel="icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/232/rocket_1f680.png" />
					<link rel="apple-touch-icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/232/rocket_1f680.png" />
					<link rel="shortcut icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/232/rocket_1f680.png" />

					<link rel="stylesheet" type="text/css" href="//at.alicdn.com/t/font_o5hd5vvqpoqiwwmi.css" />
					<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous" />
					<link rel="stylesheet" type="text/css" href="/bootstrap-dark.css" />

					/*  Global site tag (gtag.js) - Google Analytics --> */
					<script async src="https://www.googletagmanager.com/gtag/js?id=UA-33281840-7"></script>
					<script dangerouslySetInnerHTML={{
						__html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments)}
						gtag('js', new Date());
						gtag('config', 'UA-33281840-7');
	            `}} />

					<style media="screen">{`
						.feather { font-size: inherit; }
					`}</style>

				</Head>

				<div class="container-lg my-4 my-lg-5">

					<div class="float-right mt-1">
						<Link href="/starlink" ><a><span class="d-none d-md-inline-block">Starlink 🛰</span><span class="d-md-none h5 text-decoration-none mr-2">🛰</span></a></Link>
						<a href="#info" class="d-md-none h5 text-muted text-decoration-none"><i class="feather icon-info"></i></a>
					</div>

					<h3 class="mb-5">SpaceX Launches 🚀</h3>

					<div class="row">
						<div class="col-md-9">

							{!this.state.launches &&
								<div class="text-center my-5 text-muted"><div class="spinner-border" role="status"></div></div>
							}

							{this.state.launches &&
								<div class="btn-group btn-group-sm mb-4" role="group" >
									<button type="button" className={"btn btn-outline-secondary " + (this.state.showView == 'upcoming' ? 'active' : '')} onClick={(e) => { e.preventDefault(); this.setState({ showView: 'upcoming' }) }}>Upcoming</button>
									<button type="button" className={"btn btn-outline-secondary " + (this.state.showView == 'past' ? 'active' : '')} onClick={(e) => { e.preventDefault(); this.setState({ showView: 'past' }) }}>Past</button>
								</div>
							}

							{this.state.futureChartData && this.state.showView == 'upcoming' &&
								<div class="mb-4 embed-responsive embed-responsive-16by9">
									<div class="embed-responsive-item">
										<Bar data={this.state.futureChartData} options={this.state.chartOptions} />
									</div>
								</div>
							}
							{this.state.pastChartData && this.state.showView == 'past' &&
								<div class="mb-4 embed-responsive embed-responsive-16by9">
									<div class="embed-responsive-item">
										<Bar data={this.state.pastChartData} options={this.state.chartOptions} />
									</div>
								</div>
							}


							{launches && launches.map((l, i) =>
								<div key={i} className="mb-4">
									<div class="font-weight-bold">{l.dateText}</div>
									<div class="my-1">{l.payloadIcon} {l.payload} • {l.customer}</div>
									<div class="small font-weight-bold my-1" style={{ opacity: 0.6 }}>{l.type} • {l.site} • {l.orbit}</div>
									<div class="small" style={{ opacity: 0.6 }}>{l.note}</div>
								</div>
							)}

						</div>
						<div class="col-md-3 ">
							<div class="sticky-top pt-3">
								<div class="rounded small bg-light p-3 " id="info">
									<div class="mb-3"><a href="/api" target="_blank">API</a></div>
									<div class="mb-4"><a href="/sync.html" >Sync to your calendar</a></div>

									<div class="text-uppercase small text-muted">Source</div>
									<div class="mb-3"><a href="https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches#Future_launches" target="_blank">Wikipedia: List of Falcon 9 and Falcon Heavy launches</a></div>

									<div class="text-uppercase small text-muted">Created by</div>
									<div class="mb-3"><a href="https://0xMoe.com" target="_blank" class="mr-3">MOΞ</a></div>

									<div class="text-uppercase small text-muted">Contact</div>
									<div class="mb-3"><a href="mailto:moe.salih@gmail.com" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-mail"></i></a> <a href="https://twitter.com/moesalih_" target="_blank" class="text-decoration-none mr-2"><i class="feather icon-twitter"></i></a></div>

									<div class="text-uppercase small text-muted">Code</div>
									<div class="mb-3"><a href="https://github.com/moesalih/spacex.moesalih.com" target="_blank" class="mr-3">GitHub</a></div>

								</div>
							</div>
						</div>

					</div>

				</div>

			</div>
		)
	}
}

import React from "react";
import Head from 'next/head'
import Link from 'next/link'

import axios from 'axios'

export default class Index extends React.Component {


	constructor(props) {
		super(props)
		this.state = { }
		this.getLaunches = this.getLaunches.bind(this)
		this.getLaunches()
		// this.onGenerate = this.onGenerate.bind(this)
	}


	async getLaunches() {
	  try {
	    const response = await axios.get('https://spacex.moesalih.com/api');
	    // console.log(response.data);
		 this.setState({ launches: response.data.launches })
	  } catch (error) {
	    console.error(error);
	  }
	}

	render() {
		let arr = []
		return (
			<div>
				<Head>
					<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
					<meta charset="UTF-8" />
					<title>SpaceX Launches 🚀</title>
					<link rel="icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/232/rocket_1f680.png" />

					<link rel="stylesheet" type="text/css" href="//at.alicdn.com/t/font_o5hd5vvqpoqiwwmi.css" />
					<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous" />

					/*  Global site tag (gtag.js) - Google Analytics --> */
					<script async src="https://www.googletagmanager.com/gtag/js?id=UA-33281840-7"></script>
					<script dangerouslySetInnerHTML={{ __html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments)}
						gtag('js', new Date());
						gtag('config', 'UA-33281840-7');
	            `}} />

					<style  media="screen">{`
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
							<div class="text-center my-5 text-black-50"><div class="spinner-border" role="status"></div></div>
						}

						{this.state.launches && this.state.launches.map((l,i) =>
							<div key={i}>
								<div class="font-weight-bold">{l.dateText}</div>
								<div class="my-1">{l.payloadIcon} {l.payload} • {l.customer}</div>
								<div class="small my-1" style={{opacity:0.5}}>{l.type} • {l.site} • {l.orbit}</div>
								<div class="small">{l.note}</div>
								<hr />
							</div>
						)}

						</div>
						<div class="col-md-3 ">
							<div class="sticky-top pt-3">
								<div class="rounded small bg-light p-3 " id="info">
									<div  class="mb-3"><a href="/api" target="_blank">API</a></div>
									<div  class="mb-4"><a href="/sync.html" >Sync to your calendar</a></div>

									<div  class="text-uppercase small text-muted">Source</div>
									<div  class="mb-3"><a href="https://en.wikipedia.org/wiki/List_of_Falcon_9_and_Falcon_Heavy_launches#Future_launches" target="_blank">Wikipedia: List of Falcon 9 and Falcon Heavy launches</a></div>

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

'use strict';

const fs = require('fs')
const path = require('path');
//const querystring = require('node:querystring');
const jsonfile = require('jsonfile')
const tidy = require('bibtex-tidy')
const bibtexParse = require('bibtex-parse')
/*
https://www.bibtex.com/format/
https://github.com/FlamingTempura/website
https://github.com/FlamingTempura/bibtex-tidy
https://github.com/FlamingTempura/bibtex-parse
https://github.com/texworld/betterbib
https://www.npmjs.com/package/astrocite-bibtex
https://papercite.readthedocs.io
https://scholar.google.com/intl/us/scholar/inclusion.html
*/

// Sitemap:
const { SitemapStream } = require('sitemap')
const sitemap = new SitemapStream({ hostname: 'https://olavtenbosch.github.io' })
const writeStream = fs.createWriteStream('./sitemap.xml')
sitemap.pipe(writeStream)
sitemap.write({ url: "./index.html", changefreq: 'weekly', priority: 1.0 })


// MAKE TIDY:
const bibtex = fs.readFileSync('./all.bib', 'utf8');
let res = tidy.tidy(bibtex, {
	curly: true,
	sort: ["-year", "-month"],
	duplicates: ["key"],
	merge: "overwrite",
	tab: true,
	dropAllCaps: true
})
// Write results:
fs.writeFileSync("./all.bib", res.bibtex)


// PRODUCE HOMEPAGE:
let json = bibtexParse.entries(res.bibtex)

// Process into html:
let indent = '\t\t\t\t';
let str = ""
let year = 0
// Do another sorting:
json.sort(
	(a,b) => {
		if (a.YEAR < b.YEAR) return 1
		if (a.YEAR > b.YEAR) return -1
		if ("MONTH" in a && "MONTH" in b)
			return b.MONTH - a.MONTH
		else
			return 1
	}
)
for (const e of json) {
	if ("SKIP" in e) continue
	
	if (e.YEAR != year) {
		str += "<h6 class='small'>"+e.YEAR+"</h6>\n"
		year = e.YEAR
	}
	
	let arr = []

	if ("AUTHOR" in e) {
		let names = (e.AUTHOR || '').split(' and ').map(name => {
			let [last, first] = name.split(', ');
			return `${first || ''} ${last}`;
		}).join(', ')
		arr.push(names)
	}
	
	//if ("YEAR" in e) arr.push(`(${e.YEAR}${e.MONTH?"/"+e.MONTH:""})`) // handy for displaying month
	if ("YEAR" in e) arr.push(`(${e.YEAR})`)
		
	// tmp hack:
	if (e.key == "olav_ten_bosch_2022_7665189") e.TITLE = "The awesome list of official statistics software & FOSS best practices"
	// end tmp hack:
	
	if ("TITLE" in e) arr.push(`<span class="italic">${e.TITLE}</span>`)
	if ("ORGANIZATION" in e) arr.push(`${e.ORGANIZATION}`)
	if ("JOURNAL" in e) arr.push(`${e.JOURNAL}`)
	if ("BOOKTITLE" in e) arr.push(`${e.BOOKTITLE}`)
	if ("VOLUME" in e) arr.push(`vol. ${e.VOLUME}`)
	if ("NUMBER" in e) arr.push(`no. ${e.NUMBER}`)
	if ("PAGES" in e) arr.push(`pp. ${e.PAGES}`)
	if ("PUBLISHER" in e) arr.push(`${e.PUBLISHER}`)

	if ("DOI" in e) arr.push(`doi: ${e.DOI}`)
	if ("URL" in e)
		arr.push(`<a target="_blank" href="${e.URL}">link</a>`)
	else
		if ("DOI" in e) arr.push(`<a target="_blank" href="http://dx.doi.org/${e.DOI}">link</a>`)
		
	// Own props:
	if ("PDF" in e) {
		let href = `./pdf/${e.PDF}`
		arr.push(`<a target="_blank" href="${href}">report</a> (pdf)`)
		sitemap.write({ url: `${href}`, changefreq: 'monthly', priority: 0.8 })
	}
	if ("ARXIV" in e) arr.push(`<a target="_blank" href="${e.ARXIV}">arXiv</a> (preprints)`)
	if ("ABSTRACT" in e) {
		let href = `./pdf/${e.ABSTRACT}`
		arr.push(`<a target="_blank" href="${href}">abstract</a> (pdf)`)
		sitemap.write({ url: `${href}`, changefreq: 'monthly', priority: 0.5 })
	}
	if ("LINK" in e) arr.push(`<a target="_blank" href="${e.LINK}">link</a>`)
	if ("SLIDES" in e) arr.push(`<a target="_blank" href="pdf/${e.SLIDES}">slides</a> (pdf)`)
	if ("CONF" in e) arr.push(`<a target="_blank" href="${e.CONF}">conference</a>`)
	if ("RESEARCHGATE" in e) arr.push(`<a target="_blank" href="${e.RESEARCHGATE}">researchgate</a> `)
		
	if ("NOTE" in e) arr.push(`${e.NOTE}`)
	
	str += "<article>"+arr.join(', ')+"</article>\n"
}
//fs.writeFileSync("all.html", page)

// Make list on home:
let home = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
	.replace(/(<!--PUBLICATIONS-->).*(<!--PUBLICATIONS END-->)/s, '$1$2')

// Merge list in home:
home = home.replace(/(<!--PUBLICATIONS END-->)/, `${str}.\n${indent}$1`)

// Write home:
fs.writeFileSync(path.join(__dirname, './index.html'), home, 'utf8');

// Close sitemap:
sitemap.end();
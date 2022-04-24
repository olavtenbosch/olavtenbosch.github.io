'use strict';

const fs = require('fs')
const path = require('path');
const jsonfile = require('jsonfile')
const tidy = require('bibtex-tidy')
const bibtexParse = require('bibtex-parse')
/*
https://github.com/FlamingTempura/website
https://github.com/FlamingTempura/bibtex-tidy
https://github.com/FlamingTempura/bibtex-tidy
https://github.com/FlamingTempura/bibtex-parse
https://github.com/texworld/betterbib
https://www.npmjs.com/package/astrocite-bibtex
https://papercite.readthedocs.io
https://scholar.google.com/intl/us/scholar/inclusion.html
https://www.bibtex.com/format/
*/

// MAKE TIDY:
const bibtex = fs.readFileSync('./all.bib', 'utf8');
let res = tidy.tidy(bibtex, {
	sort: ["-year", "-month"],
	duplicates: ["key"],
	merge: "overwrite",
	tab: true,
	ddropAllCaps: true
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
		str += "<strong>"+e.YEAR+"</strong>\n"
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
	if ("TITLE" in e) arr.push(`<i>${e.TITLE}</i>`)
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
	if ("PDF" in e) arr.push(`<a target="_blank" href="./pdf/${e.PDF}">report</a> (pdf)`)
	if ("CONF" in e) arr.push(`<a target="_blank" href="${e.CONF}">conference</a>`)
	if ("LINK" in e) arr.push(`<a target="_blank" href="${e.LINK}">link</a>`)
	if ("SLIDES" in e) arr.push(`<a target="_blank" href="pdf/${e.SLIDES}">slides</a>`)
		
	if ("NOTE" in e) arr.push(`${e.NOTE}`)
	
	str += "<li>"+arr.join(', ')+"</li>\n"
}
//fs.writeFileSync("all.html", page)

// Make list on home:
let home = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
	.replace(/(<!--PUBLICATIONS-->).*(<!--PUBLICATIONS END-->)/s, '$1$2')

// Merge list in home:
home = home.replace(/(<!--PUBLICATIONS END-->)/, `${str}.\n${indent}$1`)

// Write home:
fs.writeFileSync(path.join(__dirname, './index.html'), home, 'utf8');

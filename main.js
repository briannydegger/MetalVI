var request = require('request');
const express = require('express')
const app = express()
var cheerio = require('cheerio');
var mysql = require('mysql');

var updating = 0;

var conMysql = mysql.createConnection({
    host     : 'sql01.michaelminelli.ch',
    user     : 'metalVI',
    password : 'vi2017',
    database : 'hesso_vi'
});

function getAllBands(countryCode, start, countries) {
    request('https://www.metal-archives.com/browse/ajax-country/c/' + countryCode + '/json/1?sEcho=1&iColumns=4&sColumns=&iDisplayStart=' + start + '&iDisplayLength=500&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&bSortable_0=true&bSortable_1=true&bSortable_2=true&bSortable_3=false&_=1512315355906', function(errorCountry, responseCountry, jsonCountry) {
        if (!errorCountry) {
            try {
                var data = JSON.parse(jsonCountry);

                if (start == 0) {
                    countries = data;
                } else {
                    countries.aaData = countries.aaData.concat(data.aaData);
                }

                if (countries.aaData.length < countries.iTotalRecords) {
                    getAllBands(countryCode, start + 500, countries)
                } else {
                    countries.aaData = countries.aaData.map(a => {
                        a[4] = a[0].match(/href='([^"]*)'/)[1];
                        a[0] = a[0].match(/<a[^>]*>([\s\S]*?)<\/a>/)[1];
                        a[3] = a[3].match(/class=\"([^"]*)\"/)[1];
                        a[5] = countryCode;
                        return a;
                    });

                    conMysql.connect(function(err) {
                        var sql = "INSERT INTO bands (name, genres, location, status, link, country) VALUES ?";
                        conMysql.query(sql, [countries.aaData], function (err, result) {
                        });
                    });
                }
            } catch(e) {
                console.log(e, countryCode, start);
            }
        }
    });
}

app.get('/update', function(req, res) {
    // Permet l'update toute les heures (évite plusieurs update en même temps)
    if (updating + 3600000 > new Date().getTime()) {
        res.write('Update already launched.');
        res.end();
        return;
    }
    updating = new Date().getTime();

    // On supprime toutes les données en premier lieux
    conMysql.connect(function(err) {
        var sql = "DELETE FROM bands;";
        conMysql.query(sql, function (err, result) {
        });
    });

    request('https://www.metal-archives.com/browse/country', function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            $('.countryCol a').each(function(i, el) {
                var href = $(this).attr('href').split('/');
                var countryCode = href[href.length - 1];

                getAllBands(countryCode, 0, null);
            })
        }
    });

    res.write('Updating.');
    res.end();
})


app.use(express.static('public'));

app.listen(8081, () => console.log('Example app listening on port 8081!'))
// metalVI
// vi2017d

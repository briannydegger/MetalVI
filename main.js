var request = require('request');
const express = require('express')
const app = express()
var cheerio = require('cheerio');
var mysql = require('mysql');

var synonyms = require('./synonyms.js');

var updating = 0;

var conMysql = mysql.createConnection({
    multipleStatements: true,
    host: 'sql01.michaelminelli.ch',
    user: 'metalVI',
    password: 'vi2017',
    database: 'hesso_vi'
});

function getAllBands(countryCode, start, countries) {
    request('https://www.metal-archives.com/browse/ajax-country/c/' + countryCode + '/json/1?sEcho=1&iColumns=4&sColumns=&iDisplayStart=' + start + '&iDisplayLength=500&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&bSortable_0=true&bSortable_1=true&bSortable_2=true&bSortable_3=false&_=1512315355906', function (errorCountry, responseCountry, jsonCountry) {
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

                    var genreIds = countries.aaData.map(a => {
                        var genresTemp = [];
                        Object.keys(synonyms).forEach(function (index) {
                            var value = synonyms[index];
                            if (value.id > -1) {
                                for (var i = 0; i < value.words.length; i++) {
                                    if (a[1].toLowerCase().includes(value.words[i])) {
                                        genresTemp.push(value.id);
                                    }
                                }
                            }
                        });
                        return genresTemp;
                    });

                    conMysql.connect(function (err) {
                        var sqlAll = "";
                        for (var i = 0; i < countries.aaData.length; i++) {
                            var b = countries.aaData[i];
                            var gids = "";
                            for (var j = 0; j < genreIds[i].length; j++) {
                                gids += "(LAST_INSERT_ID(), " + genreIds[i][j] + ")";
                                if (j < genreIds[i].length - 1)
                                    gids += ", ";
                            }
                            var sql = 'INSERT INTO bands(name, genres, location, status, link, country) VALUES("' + b[0] + '", "' + b[1] + '", "' + b[2] + '", "' + b[3] + '", "' + b[4] + '", "' + b[5] + '");';
                            if (gids != "")
                                sql += " INSERT INTO bands_genres_pivot(band_id, genre_id) VALUES" + gids + ";";

                            sqlAll += sql;
                        }
                        conMysql.query(sqlAll, function (err, result) {
                            console.log(sqlAll, err, result);
                        });

                    });
                }
            } catch (e) {
                console.log(e, countryCode, start);
            }
        }
    });
}

app.get('/update', function (req, res) {
    // Permet l'update toute les heures (évite plusieurs update en même temps)
    if (updating + 3600000 > new Date().getTime()) {
        res.write('Update already launched.');
        res.end();
        return;
    }
    updating = new Date().getTime();

    // On supprime toutes les données en premier lieux
    conMysql.connect(function (err) {
        var sql = "DELETE FROM bands_genres_pivot; DELETE FROM bands; DELETE FROM countries;";
        conMysql.query(sql, function (err, result) {
        });

        var sql = "SELECT * FROM genres;";
        conMysql.query(sql, function (err, result) {
            for (var i = 0; i < result.length; i++) {
                synonyms[result[i].genre].id = result[i].genre_id;
            }
        });
    });

    request('https://www.metal-archives.com/browse/country', function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            // Pour chaque lien, on récupère le code du pays
            $('.countryCol a').each(function (i, el) {
                var href = $(this).attr('href').split('/');
                var countryCode = href[href.length - 1].toLowerCase();

                // Récupère tous les groupes du pays
                getAllBands(countryCode, 0, null);
                // Récupère la population
                request('https://restcountries.eu/rest/v2/alpha/' + countryCode, function (errorPopulation, responsePopulation, jsonPopulation) {
                    if (!errorPopulation) {
                        try {
                            var data = JSON.parse(jsonPopulation);
                            conMysql.connect(function (err) {
                                var sql = "INSERT INTO countries (country, population) VALUES ('" + countryCode + "', " + data.population + ")";
                                conMysql.query(sql, function (err, result) {
                                });
                            });
                        } catch (e) {
                            console.log(e, countryCode);
                        }
                    }
                });

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

var request = require('request');
const express = require('express')
const app = express()
var cheerio = require('cheerio');
var mysql = require('mysql');
app.set('view engine', 'ejs');

var synonyms = require('./synonyms.js');

var updating = 0;

var conMysql = mysql.createConnection({
    multipleStatements: true,
    host: 'sql01.michaelminelli.ch',
    user: 'metalVI',
    password: 'vi2017',
    database: 'hesso_vi'
});

/**
 * Récupère tous les groupes par pays, 500 par 500
 * @param {*} countryCode Code du pays
 * @param {*} start Numéro des données à récupérer (doit commencer par 0)
 * @param {*} countries Stocks les groupes
 */
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
                    // Récursif
                    getAllBands(countryCode, start + 500, countries)
                } else {
                    // Parse les infos
                    countries.aaData = countries.aaData.map(a => {
                        a[4] = a[0].match(/href='([^"]*)'>/)[1];
                        a[0] = a[0].match(/<a[^>]*>([\s\S]*?)<\/a>/)[1];
                        a[3] = a[3].match(/class=\"([^"]*)\"/)[1];
                        a[5] = countryCode;
                        var idTemp = a[4].split("/");
                        a[6] = idTemp[idTemp.length - 1];
                        return a;
                    });

                    // Récupère les id en fonction du genre
                    var genreIds = [];
                    countries.aaData.map(a => {
                        Object.keys(synonyms).forEach(function (index) {
                            var value = synonyms[index];
                            if (value.id > -1) {
                                for (var i = 0; i < value.words.length; i++) {
                                    if (a[1].toLowerCase().includes(value.words[i])) {
                                        genreIds.push([a[6], value.id]);
                                    }
                                }
                            }
                        });
                    });

                    // Enregistre les groupes puis la liaison avec les genres
                    conMysql.connect(function (err) {
                        var sqlBand = 'INSERT INTO bands(name, genres, location, status, link, country, band_id) VALUES ?;';
                        conMysql.query(sqlBand, [countries.aaData], function (err, result) {
                            //console.log(sqlBand, err, result);
                        });
                        if (genreIds.length > 0) {
                            var sqlGenres = 'INSERT INTO bands_genres_pivot(band_id, genre_id) VALUES ?;';
                            conMysql.query(sqlGenres, [genreIds], function (err, result) {
                                //console.log(sqlGenres, err, result);
                            });
                        }

                    });
                }
            } catch (e) {
                console.log(e, countryCode, start);
            }
        }
    });
}

/**
 * Requête pour mettre à jour les données
 */
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

        // Récupère les ids des genres
        var sql = "SELECT * FROM genres;";
        conMysql.query(sql, function (err, result) {
            for (var i = 0; i < result.length; i++) {
                synonyms[result[i].genre].id = result[i].genre_id;
            }
        });
    });

    // Récupère la liste des pays
    request('https://www.metal-archives.com/browse/country', function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            // Pour chaque lien, on récupère le code du pays
            $('.countryCol a').each(function (i, el) {
                var href = $(this).attr('href').split('/');
                var countryCode = href[href.length - 1].toLowerCase();

                // Requêtes pour récupèrer tous les groupes du pays
                getAllBands(countryCode, 0, null);

                // Récupère la population
                request('https://restcountries.eu/rest/v2/alpha/' + countryCode, function (errorPopulation, responsePopulation, jsonPopulation) {
                    if (!errorPopulation) {
                        try {
                            var data = JSON.parse(jsonPopulation);
                            conMysql.connect(function (err) {
                                var sql = 'INSERT INTO countries (country, population, name) VALUES ("' + countryCode + '", ' + data.population + ', "' + data.name + '")';
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

app.get('/', function (req, res) {
    var bandsByCountry = {};
    var sql = "CALL getTopGenres();";
    conMysql.query(sql, function (err, result) {
        if (!err) {
            for (i in result[0]) {
                var row = result[0][i];
                if (row.country in bandsByCountry) {
                } else {
                    bandsByCountry[row.country] = {};
                    bandsByCountry[row.country].top = [];
                }
                bandsByCountry[row.country].top.push({
                    genre: row.genre,
                    number: row.number,
                });
                bandsByCountry[row.country].name = row.name;
                bandsByCountry[row.country].population = row.population;
            }
            var sqlNumber = "SELECT bands.country, COUNT(*) AS number_bands FROM bands WHERE status = 'active' GROUP BY country;";
            conMysql.query(sqlNumber, function (errNumber, resultNumber) {
                if (!errNumber) {
                    for (i in resultNumber) {
                        var row = resultNumber[i];
                        if (row.country in bandsByCountry)
                            bandsByCountry[row.country].number_bands = row.number_bands;
                    }

                    res.render('index', {
                        bandsByCountry: bandsByCountry
                    });
                }
            });
        }
    });
});

app.listen(8081, () => console.log('Metal VI app listening on port 8081!'))

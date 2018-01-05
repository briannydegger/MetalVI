var request = require('request');
const express = require('express')
const app = express()
var cheerio = require('cheerio');
var mysql = require('mysql');
app.set('view engine', 'ejs');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var synonyms = require('./synonyms.js');
var countriesInMap = require('./countries.js');
var fs = require('fs');

var updating = 0;
var updatingReviews = 0;

var conMysql = mysql.createConnection({
    multipleStatements: true,
    host: 'sql01.michaelminelli.ch',
    user: 'metalVI',
    password: 'vi2017',
    database: 'hesso_vi',
});

var countriesAbr = {
    'AT': 'Austria',
    'BU': 'Bulgaria',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'EE': 'Estonia',
    'FI': 'Finland',
    'FR': 'France',
    'DE': 'Germany',
    'HU': 'Hungary',
    'IE': 'Ireland',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'NO': 'Norway',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RM': 'Romania',
    'SI': 'Slovenia',
    'ES': 'Spain',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'TR': 'Turkey',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'MX': 'Mexico',
    'PR': 'Puerto Rico',
    'US': 'USA',
    'AR': 'Argentina',
    'BR': 'Brazil',
    'AU': 'Australia',
    'IN': 'India',
    'MY': 'Malaysia',
    'NZ': 'New Zealand',
    'CN': 'People\'s Republic of China',
    'SG': 'Singapore',
    'SK': 'South Korea',
    'TW': 'Taiwan',
    'UA': 'United Arab Emirates'
};

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;

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
                var data = JSON.parse(jsonCountry.replace('"sEcho": ,', '"sEcho": 1,'));

                if (start == 0) {
                    countries = data;
                } else {
                    countries.aaData = countries.aaData.concat(data.aaData);
                }

                var next = start + 500;
                if (next < countries.iTotalRecords) {
                    // Récursif
                    getAllBands(countryCode, next, countries)
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

                if (countriesInMap.indexOf(countryCode) > -1) {
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
                }
            })
        }
    });

    res.write('Updating.');
    res.end();
})


/**
 * Requête pour mettre à jour le nombre de reviews par groupes encore non définie (un par un)
 * Obsolète.
 */
app.get('/update-bands-reviews-null', function (req, res) {
    var sql = "SELECT * FROM bands WHERE number_review IS NULL LIMIT 10000;";
    conMysql.query(sql, function (err, result) {
        if (!err) {
            for (i in result) {
                var row = result[i];
                (function (id) {
                    request('https://www.metal-archives.com/band/discography/id/' + id + '/tab/all', function (errorDisc, responseDisc, htmlDisc) {
                        if (!errorDisc) {
                            var $ = cheerio.load(htmlDisc);
                            var number_review = 0;
                            $('tr td:last-child a').each(function (i, el) {
                                var split = $(el).html().split(" ");
                                if (split[0])
                                    number_review += parseInt(split[0]);
                            });

                            var sqlUpdate = 'UPDATE bands SET number_review = ' + number_review + ' WHERE band_id = ' + id + ';';
                            conMysql.query(sqlUpdate, function (err, result) {
                                console.log(sqlUpdate, result);
                            });
                        }
                    });
                })(row.band_id);
            }
        }
    });

    res.write('Updating.');
    res.end();
});

function getAllReviews(percent, start, reviews) {
    request('https://www.metal-archives.com/review/ajax-list-browse/by/rating/selection/' + percent + '?sEcho=2&iColumns=7&sColumns=&iDisplayStart=' + start + '&iDisplayLength=200&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&mDataProp_4=4&mDataProp_5=5&mDataProp_6=6&iSortCol_0=4&sSortDir_0=desc&iSortingCols=1&bSortable_0=true&bSortable_1=false&bSortable_2=true&bSortable_3=false&bSortable_4=true&bSortable_5=true&bSortable_6=true&_=1513770503213', function (error, response, html) {
        if (!error) {
            try {
                var data = JSON.parse(html.replace('"sEcho": ,', '"sEcho": 1,'));

                if (start == 0) {
                    reviews = data;
                } else {
                    reviews.aaData = reviews.aaData.concat(data.aaData);
                }

                var next = start + 200;
                if (next < reviews.iTotalRecords) {
                    // Récursif
                    getAllReviews(percent, next, reviews)
                } else {
                    // Parse les infos
                    var numberByBand = {};
                    for (var i in reviews.aaData) {
                        var id = reviews.aaData[i][2].split("/")[5].split('"')[0];
                        if (Number.isInteger(parseInt(id)))
                            numberByBand[id] = numberByBand[id] ? numberByBand[id] + 1 : 1;
                    }

                    var sqlUpdate = '';
                    Object.keys(numberByBand).map(function (id, i) {
                        sqlUpdate += "UPDATE bands SET number_review = number_review + " + numberByBand[id] + " WHERE band_id = " + id + "; ";
                    });

                    console.log('sql', percent);
                    //fs.writeFile("./sql" + percent, sqlUpdate, function (err) { });

                    conMysql.query(sqlUpdate, function (err, result) {
                        console.log('enddddddddddddddddd', percent, err)
                    });
                }
            } catch (e) {
                console.log(e, percent, start, html);
            }
        }
    });
}

/**
 * Requête pour mettre à jour le nombre de reviews par groupes
 */
app.get('/update-reviews', function (req, res) {
    // Permet l'update toute les heures (évite plusieurs update en même temps)
    if (updatingReviews + 3600000 > new Date().getTime()) {
        res.write('Update already launched.');
        res.end();
        return;
    }
    updatingReviews = new Date().getTime();

    var sql = "UPDATE bands SET number_review = 0;";
    conMysql.query(sql, function (err, result) { });
    for (var percent = 5; percent <= 100; percent += 5) {
        getAllReviews(percent, 0, null);
    }

    res.write('Updating.');
    res.end();
});

app.post('/get-bands-by-country-genre', function (req, res) {
    var genre = req.body.genre;
    var country = req.body.country;

    if (!(genre in synonyms))
        genre = '%';

    var sql = "SELECT * FROM bands\
    JOIN bands_genres_pivot ON bands_genres_pivot.band_id = bands.band_id JOIN genres ON genres.genre_id = bands_genres_pivot.genre_id\
    WHERE country = '" + country + "' AND genres.genre LIKE '" + genre + "' GROUP BY bands.band_id ORDER BY number_review DESC";
    conMysql.query(sql, function (err, result) {
        if (!err) {
            var data = [];

            var maxReview = 0;
            for (var i in result) {
                if (result[i].number_review > maxReview) 
                    maxReview = result[i].number_review;
            }
            
            for (var i in result) {
                var value = result[i];

                var badgeColor = "default";
                switch (value.status) {
                    case "active":
                        badgeColor = "success";
                        break;
                    case "split_up":
                        badgeColor = "danger";
                        break;
                    case "changed_name":
                        badgeColor = "info";
                        break;
                    case "on_hold":
                        badgeColor = "warning";
                        break;
                    default:
                        badgeColor = "default";
                        break;
                }

                var reviewPercent = value.number_review * 100 / maxReview;
                var reviewColor = "default";
                if (reviewPercent <= 16) 
                    reviewColor = "default";
                else if (reviewPercent <= 32) 
                    reviewColor = "danger";
                else if (reviewPercent <= 48) 
                    reviewColor = "warning";
                else if (reviewPercent <= 64) 
                    reviewColor = "info";
                else if (reviewPercent <= 80) 
                    reviewColor = "primary";
                else if (reviewPercent <= 100) 
                    reviewColor = "success";

                data.push([
                    '<a target="_blank" href="' + value.link + '">' + value.name + '</a>',
                    value.genres + " " + countriesAbr[country.toUpperCase()] + " " + country.toUpperCase(),
                    "<a title=\"<iframe width=350 src='https://www.google.com/maps/embed/v1/place?key=AIzaSyBpV42s6HuPSAElonTMt1ToDK5tbk0lSOY&q=" + encodeURI(value.location + "," + countriesAbr[country.toUpperCase()]) + "'/>\" data-html='true' rel='tooltip' target='_blank' href='https://www.google.com/maps/search/?api=1&query=" + encodeURI(value.location + "," + countriesAbr[country.toUpperCase()]) + "'><i class='fa fa-map-marker'></i></a> " + value.location,
                    "<span class='badge badge-" + badgeColor + "'>" + value.status + "</span>",
                    "<div class='progress'><div class='progress-bar bg-" + reviewColor + "' role='progressbar' style='width: " + reviewPercent + "%;' aria-valuenow='" + reviewPercent + "' aria-valuemin='0' aria-valuemax='100'>" + value.number_review + "</div></div>"
                ]);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        }
    });
});

app.use(express.static('public'));

// TODO Commenter
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

                    var numberBandsByGenre = {};
                    numberBandsByGenre['Relative'] = {};
                    numberBandsByGenre['Relative']['all'] = {};
                    numberBandsByGenre['Absolute'] = {};
                    numberBandsByGenre['Absolute']['all'] = {};
                    var colorsByGenre = {};
                    var maxByGenre = {};
                    // Aditionne le total de groupe
                    Object.keys(bandsByCountry).map(function (code, key) {
                        numberBandsByGenre['Absolute']['all'][code] = bandsByCountry[code].number_bands;
                        for (i in bandsByCountry[code].top) {
                            if (!(bandsByCountry[code].top[i].genre in numberBandsByGenre['Absolute'])) {
                                numberBandsByGenre['Absolute'][bandsByCountry[code].top[i].genre] = {};
                            }
                            if (numberBandsByGenre['Absolute'][bandsByCountry[code].top[i].genre][code]) {
                                numberBandsByGenre['Absolute'][bandsByCountry[code].top[i].genre][code] += bandsByCountry[code].top[i].number;
                            } else {
                                numberBandsByGenre['Absolute'][bandsByCountry[code].top[i].genre][code] = bandsByCountry[code].top[i].number;
                            }
                        }
                    });

                    // Calcule le nombre de groupe par mo d'habitant
                    Object.keys(numberBandsByGenre['Absolute']).map(function (genre, key) {
                        numberBandsByGenre['Relative'][genre] = {};
                        Object.keys(numberBandsByGenre['Absolute'][genre]).map(function (code, k) {
                            numberBandsByGenre['Relative'][genre][code] = Math.round(numberBandsByGenre['Absolute'][genre][code] / (bandsByCountry[code].population / 1000000) * 100) / 100;
                        });
                    });

                    // Calcule des couleurs Relative
                    Object.keys(numberBandsByGenre).map(function (mode) {
                        colorsByGenre[mode] = {};
                        maxByGenre[mode] = {};
                        Object.keys(numberBandsByGenre[mode]).map(function (genre) {
                            colorsByGenre[mode][genre] = {};
                            var max = Object.keys(numberBandsByGenre[mode][genre]).reduce(function (previous, code) {
                                return Math.max(previous, numberBandsByGenre[mode][genre][code]);
                            }, 0);
                            maxByGenre[mode][genre] = max;

                            // Définit les couleurs par défaut (blanc)
                            for (i in countriesInMap) {
                                colorsByGenre[mode][genre][countriesInMap[i]] = "#FFFFFF";
                            }

                            Object.keys(numberBandsByGenre[mode][genre]).map(function (code, k) {
                                if (max == numberBandsByGenre[mode][genre][code]) {
                                    colorsByGenre[mode][genre][code] = "#000f28";
                                } else {
                                    var temp = componentToHex(Math.ceil(255 - numberBandsByGenre[mode][genre][code] / max * 255));
                                    colorsByGenre[mode][genre][code] = "#" + temp + temp + temp;
                                }
                            });
                        });
                    });

                    res.render('index', {
                        bandsByCountry: bandsByCountry,
                        numberBandsByGenre: numberBandsByGenre,
                        colorsByGenre: colorsByGenre,
                        genres: Object.keys(synonyms),
                        maxByGenre: maxByGenre
                    });
                }
            });
        }
    });
});

app.listen(8081, () => console.log('Metal VI app listening on port 8081!'))

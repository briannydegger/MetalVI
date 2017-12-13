module.exports = {
    "up": " \
    CREATE PROCEDURE getTopGenres () \
    BEGIN \
        SELECT bands.country, genre, count(*) AS number, countries.name, countries.population\
        FROM genres\
        JOIN bands_genres_pivot ON bands_genres_pivot.genre_id = genres.genre_id\
        JOIN bands ON bands_genres_pivot.band_id = bands.band_id\
        JOIN countries ON countries.country = bands.country\
        WHERE bands.status = 'active'\
        GROUP BY country, genres.genre_id\
        ORDER BY country, number DESC;\
    END ;",
    "down": "DROP PROCEDURE getTopGenres;"
}
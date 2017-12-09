module.exports = {
    "up": "CREATE TABLE bands_genres_pivot(\
        band_id VARCHAR(10) NOT NULL,\
        genre_id int NOT NULL,\
        FOREIGN KEY (band_id) REFERENCES bands(band_id),\
        FOREIGN KEY (genre_id) REFERENCES genres(genre_id)\
    )",
    "down": "DROP TABLE bands_genres_pivot"
}

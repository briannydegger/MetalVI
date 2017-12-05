module.exports = {
    "up": "CREATE TABLE bands (\
        band_id INT NOT NULL AUTO_INCREMENT, UNIQUE KEY band_id (band_id),\
        name TEXT,\
        link TEXT,\
        country VARCHAR(10),\
        FOREIGN KEY (country) REFERENCES countries(country),\
        status TEXT,\
        location TEXT,\
        genres TEXT\
    )",
    "down": "DROP TABLE bands"
}

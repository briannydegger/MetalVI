module.exports = {
    "up": "CREATE TABLE countries (\
        country_id INT NOT NULL AUTO_INCREMENT, UNIQUE KEY (country_id),\
        country VARCHAR(10) UNIQUE KEY,\
        population INT,\
        name TEXT\
    )",
    "down": "DROP TABLE countries"
}

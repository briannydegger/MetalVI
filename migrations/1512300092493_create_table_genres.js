module.exports = {
    "up": "CREATE TABLE genres (\
        genre_id INT NOT NULL AUTO_INCREMENT, UNIQUE KEY (genre_id),\
        genre TEXT\
    )",
    "down": "DROP TABLE genres"
}

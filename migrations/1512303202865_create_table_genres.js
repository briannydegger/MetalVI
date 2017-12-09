module.exports = {
    "up": "INSERT INTO genres (genre)\
        VALUES\
            ('Black'),\
            ('Death'),\
            ('Doom/Stoner/Sludge'),\
            ('Electronic/Industrial'),\
            ('Experimental/Avant-garde'),\
            ('Folk/Viking/Pagan'),\
            ('Gothic'),\
            ('Grindcore'),\
            ('Groove'),\
            ('Heavy'),\
            ('Metalcore/Deathcore'),\
            ('Power'),\
            ('Progressive'),\
            ('Speed'),\
            ('Symphonic'),\
            ('Thrash')\
    ",
    "down": "SELECT * FROM genres;"
}

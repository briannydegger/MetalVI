module.exports = {
    "up": "ALTER TABLE bands\
        ADD number_review INT;",
    "down": "ALTER TABLE bands\
        DROP COLUMN number_review INT;",
}
module.exports = {
    "up": "ALTER TABLE bands\
        ADD number_review INT DEFAULT 0;",
    "down": "ALTER TABLE bands\
        DROP COLUMN number_review;",
}
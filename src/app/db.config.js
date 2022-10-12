require('dotenv').config();
const login = process.env['DB_NAME'];
const pw = process.env['DB_PASSWORD'];

module.exports = {
    url: `mongodb+srv://${login}:${pw}@cluster0.eyh8w5l.mongodb.net/?retryWrites=true&w=majority`
};
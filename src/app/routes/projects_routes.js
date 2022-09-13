const createError = require('http-errors');
const dbArticles = require('../db.connect').setColl('projects');



module.exports = function (app) {

    app.get('/projects', async (req, res, next) => {
        const query = {};
        const projects = await dbArticles.find({ query, findAll: true });
        res.json({ count: projects.length, items: projects });
    });
};
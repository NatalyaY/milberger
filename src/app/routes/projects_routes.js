const createError = require('http-errors');
const dbProjects = require('../db.connect').setColl('projects');


module.exports = function (app) {

    app.get('/projects', async (req, res, next) => {
        const query = {publish: 'true'};
        const projects = await dbProjects.find({ query, findAll: true });
        res.json({ count: projects.length, items: projects });
    });
};
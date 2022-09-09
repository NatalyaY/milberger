const createError = require('http-errors');
const dbArticles = require('../db.connect').setColl('articles');



module.exports = function (app) {

    app.post('/articles', async (req, res) => {
        const article = { text: req.body.body, title: req.body.title };
        const result = await dbArticles.insert({docs: [article]});
        res.send(result);
    });

    app.get('/article-:id', async (req, res, next) => {
        const query = { id: req.params.id };
        const article = await dbArticles.find({query});
        if (!article) return next(createError(400, `Article '${req.params.id}' not found`));
        res.render("article", { title: article.title, shortdescription: article.shortdesription, body: article.body });
    });
};
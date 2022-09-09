const articleRoutes = require('./articles_routes');
const formRoutes = require('./form_routes');
const authRoutes = require('./auth_routes');
const adminRoutes = require('./admin_routes');


const createError = require('http-errors');



module.exports = function (app) {
    articleRoutes(app);
    formRoutes(app);
    authRoutes(app);
    adminRoutes(app);

    app.use(function (req, res, next) {
        const err = createError(404, 'wtf');
        console.log(req.originalUrl + ' 404');
        next(err);
    });

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (err.status === 401) {
            console.log(req.url);
            console.log('Error: ', err.message);
            return res.cookie('page', req.url, {
                signed: true,
                maxAge: 3600 * 24,
                httpOnly: true,
            }).redirect('/login');
        };
        console.log('Error status: ', err.status + ', msg: ', err.message);
        res.json({
            message: err.message,
            error: err.status
        })
    })
};
const AuthService = require('../auth/authService');


module.exports = function (app) {

    app.get('/login', (req, res, next) => {
        if (req.signedCookies.token) {
            return res.redirect("/admin")
        };
        res.render('login', { user: "" });
    });

    app.post('/login', async (req, res, next) => {
        if (req.signedCookies.token) {
            return res.redirect("/admin")
        };
        let userRecord;
        try {
            userRecord = await AuthService.Login(req.body.data.email, req.body.data.password);
        } catch (error) {
            return next(error);
        };
        let page = '/admin';
        if (req.signedCookies?.page && req.signedCookies.page != req.url) {
            page = req.signedCookies.page;
        };
        res.cookie('token', userRecord.token, {
            signed: true,
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
        }).redirect(page);
    });

    app.get('/registration', (req, res, next) => {
        if ((req.signedCookies?.email) && (!req.signedCookies?.user)) {
            email = req.signedCookies.email;
            return res.render('register', { email, user: "" });
        };
        res.redirect('/login');
    });

    app.post('/registration', async (req, res, next) => {
        let userRecord;
        try {
            userRecord = await AuthService.SignUp(req.body.data.email, req.body.data.password);
        } catch (error) {
            return next(error);
        };
        return res.cookie('user', userRecord, {
            signed: true,
            maxAge: 3600 * 24,
            httpOnly: true,
        }).sendStatus(200);
    });

    app.post('/logout', async (req, res, next) => {
        if (req.signedCookies) {
            for (const cookie in req.signedCookies) {
                res.clearCookie(cookie);
            };
            res.sendStatus(200);
        };
    });

};
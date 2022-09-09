const jwt = require('jsonwebtoken');
const createError = require('http-errors');


module.exports = (req, res, next) => {
    try {
        req.token = jwt.verify(req.signedCookies.token, 'dHJgssGd3sd-Hhds7');
    } catch (error) {
        return next(createError(401, 'Invalid token'));
    };
    next();
}
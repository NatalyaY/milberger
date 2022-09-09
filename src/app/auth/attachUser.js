const createError = require('http-errors');
const db = require('../db.connect');


module.exports = async (req, res, next) => {
    const decodedToken = req.token;
    const userEmail = decodedToken.data.email;
    const currentUser = await db.find('users', { query: { email: userEmail } });
    if (!currentUser) {
        return next(createError(401, 'No such user'));
    } else {
        req.currentUser = currentUser;
        return next();
    }
}
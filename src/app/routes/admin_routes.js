const isAuth = require('../auth/isAuth');
const AuthService = require('../auth/authService');
const attachUser = require('../auth/attachUser');
const db = require('../db.connect');
const dbUsers = db.setColl('users');
const fs = require("fs");
const path = require('path');
const createError = require('http-errors');
const multer = require('multer');

function fileFilter(req, file, cb) {
    const type = file.mimetype.split('/')[0];

    if (type == 'image') {
        cb(null, true);
    } else {
        cb(null, false);
    };
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "dist/img/uploads")
    },
    filename: function (req, file, cb) {
        const blob = file.originalname.split('/');
        const ext = file.mimetype.split('/')[file.mimetype.split('/').length - 1];
        cb(null, `${blob[blob.length - 1]}__${Date.now()}.${ext}`);
    }
})

const upload = multer({
    storage,
    fileFilter,
});

var ObjectID = require('mongodb').ObjectId;

const findAllUsers = async () => {
    const adminsQuery = { role: 'admin' };
    const usersQuery = { role: { $ne: 'admin' } };
    const options = {
        projection: { password: 0 },
    };
    const admins = await dbUsers.find({ findAll: true, query: adminsQuery, options });
    const users = await dbUsers.find({ findAll: true, query: usersQuery, options });
    return { admins, users };
}

const updateDoc = async ({ req, collection, findFullDoc = false }) => {
    let data = req.data;

    if (findFullDoc) {
        const fulldoc = await db.setColl(collection).find({ query: { _id: new ObjectID(req._id) } });
        data = Object.assign(fulldoc, req.data);
        delete data._id;
        delete data.originid;
    };

    const options = { upsert: true };
    const upDateDoc = {
        $set: data,
    };
    const idToUpdate = (req.originid && (req.data.publish == 'true')) ? req.originid : req._id;
    try {
        await db.setColl(collection).update({ filter: { _id: new ObjectID(idToUpdate) }, upDateDoc, options });
        if (req.originid && (req.data.publish == 'true')) {
            await db.setColl(collection).delete({ filter: { _id: new ObjectID(req._id) } });
        };
    } catch (error) {
        throw error;
    };

    return;
}

module.exports = function (app) {

    app.get('/admin/:page?', isAuth, attachUser, async (req, res, next) => {
        const page = req.params.page ? req.params.page : 'main';
        const user = req.currentUser;

        if ((page === 'users') && (user.role != 'admin')) {
            return res.status(401).render('admin', { user, tab: "denied_tab" });
        };
        const data = {};

        if (page === 'users') {
            data.users = await findAllUsers();
        } else if (page === 'articles') {
            data.articles = await db.find('articles', { findAll: true, query: {} });
        } else if (page === 'projects') {
            data.projects = await db.find('projects', { findAll: true, query: {} });
        } else if (page === 'leads') {
            data.leads = await db.find('leads', { findAll: true, query: {} });
        };
        res.render('admin', { user, data, tab: `${page}_tab` });
    });
    //     (req, res, next) => {

    //         if (req.file) {
    //             const ext = path.extname(req.file.originalname).toLowerCase();
    //             const fileName = req.file.filename;
    //             const tempPath = req.file.path;
    //             const targetPath = path.join(__dirname, `../../../dist/img/uploads/${fileName}${ext}`);
    //             fs.rename(tempPath, targetPath, err => {
    //                 if (err) return next(createError(500, err));
    //                 const originalName = req.file.originalname;
    //                 const newName = `../img/uploads/${fileName}${ext}`;
    //                 const newFileName = {};
    //                 newFileName[originalName] = newName;
    //                 res
    //                     .status(200)
    //                     .json(newFileName);
    //             });
    //         } else {
    //             res
    //                 .status(403)
    //                 .json({
    //                     message: fileName
    //                 })
    //         };
    //     }
    // );

    app.post("/admin/upload", upload.fields([{ name: 'previewImg', maxCount: 1}, {name: 'body'}, {name: 'description'}]),
        (req, res, next) => {
            if (Object.keys(req.files).length) {
                const newFiles = Object.keys(req.files).reduce((acc, filename) => {
                    acc[filename] = req.files[filename].reduce((acc, file) => {
                        console.log(file);
                        const ext = path.extname(file.originalname).toLowerCase();
                        const fileName = file.filename;
                        const newName = `../img/uploads/${fileName}${ext}`;
                        acc[file.originalname] = newName;
                        return acc;
                    }, {});
                    return acc;
                }, {});
                res
                    .status(200)
                    .json(newFiles);
            } else {
                res
                    .status(403)
                    .json({
                        message: 'invalid extension'
                    })
            };
        }
    );

    app.get('/verify-:hash', async (req, res, next) => {
        const hash = req.params.hash;
        const email = req.query.email;
        const dbInstance = await db.setColl('verifyHashes').find({ query: { email } });
        if ((!dbInstance) || (dbInstance.verifyHash != hash)) {
            return res.status(401).redirect('/login');
        };
        return res.cookie('email', email, {
            signed: true,
            maxAge: 3600 * 24,
            httpOnly: true,
        }).redirect('/registration');
    });

    app.ws('/ws/admin*?', async function (ws, req) {
        const page = req.params['0'].slice(1);
        let watchCursor, collection;
        const host = req.protocol + '://' + req.hostname + ':3000';

        switch (page) {
            case 'users':
                watchCursor = await dbUsers.watch();
                collection = 'users';
                break;
            case 'articles':
                watchCursor = await db.setColl('articles').watch();
                collection = 'articles';
                break;
            case 'projects':
                watchCursor = await db.setColl('projects').watch();
                collection = 'projects';
                break;
            case 'leads':
                watchCursor = await db.setColl('leads').watch();
                collection = 'leads';
                break;
            default:
                break;
        }

        watchCursor.on('change', (change) => {
            ws.send(JSON.stringify(change));
        });

        ws.on('message', async (msg) => {
            const req = JSON.parse(msg);
            if (req._id) {
                if (req.op == 'delete') {
                    try {
                        if (page == 'users') {
                            const user = await dbUsers.find({ query: { _id: new ObjectID(req._id) } });
                            await db.setColl('verifyHashes').delete({ filter: { email: user.email } });
                        };
                        await db.setColl(collection).delete({ filter: { _id: new ObjectID(req._id) } });
                    } catch (err) {
                        ws.send(JSON.stringify({ caller: req.caller, err }));
                        return;
                    };
                };

                if (req.op == 'change publish') {
                    try {
                        const findFullDoc = req.originid ? true : false;
                        await updateDoc({ req, collection, findFullDoc });
                    } catch (err) {
                        ws.send(JSON.stringify({ caller: req.caller, err }));
                        return;
                    };
                };

                if (req.op == 'update') {
                    const item = await db.setColl(collection).find({ query: { _id: new ObjectID(req._id) } });

                    if ((req.data.hasOwnProperty('publish')) && (item.publish != req.data.publish) && (!req.originid) && (req.data.publish == 'false')) {
                        const doc = Object.assign({ originid: req._id, originUUID: item.UUID }, req.data);
                        try {
                            await db.setColl(collection).insert({ docs: [doc] });
                        } catch (err) {
                            ws.send(JSON.stringify({ caller: req.caller, err }));
                            return;
                        };
                    } else {
                        try {
                            if ((page == 'users') && (req.data.email != item.email)) {
                                await AuthService.createUser({ oldEmail: item.email, email: req.data.email, origin: host });
                            };
                            await updateDoc({ req, collection });
                        } catch (err) {
                            ws.send(JSON.stringify({ caller: req.caller, err }));
                            return;
                        };
                    };
                }

            } else if (req.op == 'insert') {
                try {
                    if (page == 'users') {
                        await AuthService.createUser({ email: req.data.email, origin: host });
                    };
                    await db.setColl(collection).insert({ docs: [req.data] });
                } catch (err) {
                    console.log(err.status + ': ' + err.message);
                    ws.send(JSON.stringify({ caller: req.caller, err }));
                    return;
                };

            };

            ws.send(JSON.stringify({ caller: req.caller }));
        });

        ws.on('close', async () => {
            await watchCursor.close();
            ws.close();
        });
    });
}
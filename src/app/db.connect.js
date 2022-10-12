const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./db.config');
const uri = config.url;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
let database;

function convertDateToUTC(date) {
    return Date.parse(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
};

const statusCodes = {
    'Новая': 0,
    'Взято в работу': 1.0,
    'Перезвонить': 1.1,
    'Обсуждение по почте': 1.2,
    'Отказ': 3.1,
    'Недозвон': 3.2,
    'Треш': 3.3,
    'Подтверждена': 2.0,
    'Ожидает заключения договора': 2.1,
    'Ожидает оплаты': 2.2,
}

const dbConnect = async () => {
    if (!database) {
        await client.connect();
        database = client.db("milberger");
    };
    return;
};

const dbClose = async () => {
    if (database) {
        await client.close();
        database = '';
    };
    return;
};

const dbWatchCollection = async (coll) => {
    if (!database) {
        await dbConnect();
    };
    const collection = database.collection(`${coll}`);
    return collection.watch([], { fullDocument: "updateLookup" });
}

const dbFind = async (coll, { findAll = false, query, options = {} }) => {
    if (!database) {
        await dbConnect();
    };
    const collection = database.collection(`${coll}`);
    const res = findAll ? await collection.find(query, options).toArray() : await collection.findOne(query, options);
    return res;
}

const dbInsert = async (coll, { insertMany = false, docs, options = {} }) => {
    if (!database) await dbConnect();
    docs.forEach((doc) => {
        if (doc.hasOwnProperty("status")) {
            doc['statusCode'] = statusCodes[doc.status];
            doc["statusCodes"] = statusCodes;
        };
        if (coll != 'users') {
            doc['date'] = convertDateToUTC(new Date);
            doc['UUID'] = parseInt(Math.random() * 1000000);
        };
    });
    const collection = database.collection(`${coll}`);
    const res = insertMany ? await collection.insertMany(docs, options) : await collection.insertOne(docs[0]);
    return res;
}

const dbUpdate = async (coll, { updateMany = false, filter, upDateDoc, options = {} }) => {
    if (!database) await dbConnect();
    for (const key in upDateDoc) {
        if (Object.hasOwnProperty.call(upDateDoc, key)) {
            upDateDoc[key]['date'] = convertDateToUTC(new Date);
            if (upDateDoc[key].hasOwnProperty("status")) {
                upDateDoc[key]['statusCode'] = statusCodes[upDateDoc[key].status];
            };
        };
    };
    const collection = database.collection(`${coll}`);
    const res = updateMany ? await collection.updateMany(filter, upDateDoc, options) : await collection.updateOne(filter, upDateDoc, options);
    return res;
};

const dbDelete = async (coll, { deleteMany = false, filter, options = {} }) => {
    if (!database) await dbConnect();
    const collection = database.collection(`${coll}`);
    const res = deleteMany ? await collection.deleteMany(filter, options) : await collection.deleteOne(filter, options);
    return res;
};

module.exports = {
    connect: dbConnect,

    close: dbClose,

    watch: dbWatchCollection,

    find: dbFind,

    insert: dbInsert,

    update: dbUpdate,

    delete: dbDelete,

    setColl: (coll) => {
        return {
            find: dbFind.bind(this, coll),

            insert: dbInsert.bind(this, coll),

            update: dbUpdate.bind(this, coll),

            delete: dbDelete.bind(this, coll),

            watch: dbWatchCollection.bind(this, coll),
        }
    },
}
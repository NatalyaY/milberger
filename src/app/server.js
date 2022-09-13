const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dist = path.join(__dirname, "../../dist/");
const app = express();
require('lodash-express')(app);
const cookieParser = require('cookie-parser');
const expressWs = require('express-ws')(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser('sdhshd6esj'));

app.use(express.static(dist));
app.set('view engine', 'html');
app.set('views', dist);

app.set('port', 3000);
require('./routes')(app);


app.listen(app.get('port'), function () {
    console.log('Node App Started');
});
const sendMail = require('../mailer/sendMail');
const db = require('../db.connect');

const formNames = {
    budget: 'Бюджет',
    checkout__messenger: 'Куда удобно получить ответ',
    date: 'В какой срок нужен ремонт',
    design: 'Есть ли дизайн-проект',
    height: 'Высота потолков',
    name: 'Имя',
    phone: 'Телефон',
    size: 'Площадь помещения',
    where: 'Тип объекта',
    form: 'Из какой формы отправлено'
};

module.exports = function (app) {
    app.post('/form', async (req, res) => {
        const body = Object.keys(req.body).reduce((acc, el) => {
            let text = formNames[el] || el;
            acc[el] = {
                text,
                value: req.body[el]||'не указано',
            };
            return acc;
        }, {});

        req.body['status'] = 'Новая';
        req.body['formNames'] = formNames;

        try {
            await sendMail({
                to: "fantasia18@mail.ru",
                subject: 'Новая заявка с сайта Milberger',
                body,
                heading: 'Новая заявка:',
            });
            await db.setColl('leads').insert({ docs: [req.body] });
            res.sendStatus(200);
        } catch (error) {
            console.log('err catched' + error);
            throw createError(500, "Ошибка при отправке письма с подтверждением");
        };
    });
};
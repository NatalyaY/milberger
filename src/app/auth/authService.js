const db = require('../db.connect');
const dbUsers = db.setColl('users');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const sendMail = require('../mailer/sendMail');
const validator = require("email-validator");


class AuthService {

    static createUser = async ({oldEmail = '', email, origin}) => {
        if (!validator.validate(email)) {
            throw createError(400, "Некорректный email");
        };
        const existingUser = await dbUsers.find({ query: { email: email } });
        if (existingUser) {
            throw createError(400, `Пользователь '${email}' уже существует`);
        };
        if (oldEmail) {
            await db.setColl('verifyHashes').delete({ filter: { email: oldEmail } });
        };
        const verifyHash = await this.createHash(email);
        await db.setColl('verifyHashes').insert({ docs: [{ verifyHash, email }] });
        const link = `${origin}/verify-${verifyHash}?email=${email}`;
        const htmlLink = `<a href="${link}" target="_blank" 
        style="padding:15px; background-color: rgba(57, 20, 132, 1); border-radius: 10px; display: inline-block; 
        text-align: center; margin-top: 45px; text-decoration: none; color: #ffffff ">
        Подтвердить email<br>и завершить регистрацию</a>`;

        try {
            await sendMail({
                to: email,
                subject: 'Подтверждение регистрации Milberger',
                body: {
                    about: {
                        text: `На ваш email ${email} был открыт доступ к администрированию контента сайта Milberger. Чтобы получить доступ в административную панель подтвердите ваш email:`,
                    },
                    link: {
                        text: `${htmlLink}`,
                    }
                },
                heading: 'Подтвердите регистрацию в CMS Milberger',
            });
        } catch (error) {
            console.log('err catched' + error);
            throw createError(500, "Ошибка при отправке письма с подтверждением");
        };
    }

    static SignUp = async (email, password) => {
        const passwordHashed = await argon2.hash(password);
        const upDateDoc = {
            $set: {
                password: passwordHashed,
            }
        };
        await dbUsers.update({ filter: { email }, upDateDoc })
        await db.setColl('verifyHashes').delete({ filter: { email } });

        return {
            user: {
                email,
            },
        };
    }

    static Login = async (email, password) => {
        const userRecord = await dbUsers.find({ query: { email: email } });
        if (!userRecord) {
            throw createError(400, `Пользователь '${email}' не найден`);
        } else {
            const correctPassword = await argon2.verify(userRecord.password, password);
            if (!correctPassword) {
                throw createError(400, `Неверный пароль`);
            };
        };
        return {
            user: {
                email: userRecord.email,
            },
            token: this.generateJWT(userRecord),
        }
    }

    static generateJWT(user) {

        const data = {
            _id: user._id,
            name: user.name,
            email: user.email
        };
        const signature = 'dHJgssGd3sd-Hhds7';
        const expiration = '24h';

        return jwt.sign({ data, }, signature, { expiresIn: expiration });

    }

    static createHash = async (str) => {
        const hashed = await argon2.hash(str, { raw: true });
        return hashed.toString('hex');
    };

}

module.exports = AuthService;
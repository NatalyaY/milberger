'use strict';
import './../scss/index.scss';
import { Form } from './form.js';
import { setSubmitFn } from './submitForm.js';



document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.register__container');
    new Form(form);

    const replyPass = document.getElementById('password_reply');
    const pass = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (replyPass.value != pass.value) {
            if (!replyPass.classList.contains('invalid')) {
                replyPass.classList.add('invalid');
            };
            const msg = form.querySelector('.err_msg');
            msg.innerText = 'Пароли не совпадают';
            msg.style.display = 'block';
        } else {
            function success() {
                window.history.replaceState(null, document.title, window.location.origin + '/login');
                location.reload();
            };

            setSubmitFn(e.target, '/registration', success)(e);
        }
    });

    function checkPassword () {
        if (replyPass.value != pass.value) {
            if (!replyPass.classList.contains('invalid')) {
                replyPass.classList.add('invalid');
            };

        } else {
            replyPass.classList.remove('invalid');
            const msg = form.querySelector('.err_msg');
            msg.style.display = 'none';
        };
    };

    [replyPass, pass].forEach((el) => {
        el.addEventListener('input', checkPassword);
        el.addEventListener('blur', checkPassword);
    });
})

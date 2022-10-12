'use strict';
import './../scss/index.scss';
import { Form } from './form.js';
import { setSubmitFn } from './submitForm.js';



document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.login__container');
    new Form(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const onSuccess = (res) => {
            if (res.redirected) {
                window.location.href = res.url;
            }
        };
        setSubmitFn(e.target, '/login', onSuccess, () => {})(e);
    });
})
'use strict';
import { openPopup } from './openPopup.js';

export function setSubmitFn(form, action, fnOnsuccess = '', fnOnError = '') {
    return async function onSubmit(e) {
        const layer = document.createElement('div');
        layer.className = 'layer';
        const loader = document.createElement('div');
        loader.className = 'loader';
        for (let i = 1; i <= 12; i++) {
            loader.appendChild(document.createElement('div'));
        };
        layer.appendChild(loader);
        document.body.appendChild(layer);

        const formValues = [...form.querySelectorAll('input:not([type="submit"])')].reduce((acc, el) => {
            if (el.name) {
                if (!acc['data']) acc['data'] = {};
                let value = el.dataset.add ? el.value + el.dataset.add : el.value;
                acc.data[el.name] = value;
            };
            return acc;
        }, {});

        if (form.dataset.name) {
            formValues.data['form'] = form.dataset.name;
        };

        const res = await fetch(action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formValues),
        });

        if (res.status === 200) {
            if (fnOnsuccess) {
                fnOnsuccess(res);
            } else {
                form.reset();
                const reqFields = form.querySelectorAll('input[data-not-empty]');
                [...reqFields].forEach(field => { field.dataset.notEmpty = '' });
                openPopup('Ваша заявка была', 'успешно отправлена!')();
            }
        } else {
            const error = await res.json();
            if (fnOnError) {
                layer.remove();
                fnOnError();
            } else {
                openPopup('Отправить', 'не удалось')({
                    err: {
                        message: error.message,
                    }
                });
            };
            const msg = form.querySelector('.err_msg');
            if (msg) {
                msg.innerText = `Ошибка. ${error.message}`;
                msg.style.display = 'block';
            };
        }
    }
}
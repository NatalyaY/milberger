'use strict';
import './../scss/index.scss';
import { RenderArticles } from "./renderItems.js";
import { createPlayer } from "./video.js";
import { Form } from './form.js';
import { setSubmitFn } from './submitForm.js';
import { showMoreText } from './showMoreText.js';



document.addEventListener('DOMContentLoaded', async () => {
    await new RenderArticles('js-articles').render();

    const showMoreTextBtn = document.querySelectorAll('.moreLink');
    [...showMoreTextBtn].forEach((btn) => btn.addEventListener("click", showMoreText));

    createPlayer({ containerId: "player", videoId: 'GVtwyuco3uc' });

    const forms = document.querySelectorAll('.form__container');

    [...forms].forEach((form) => {
        new Form(form);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            setSubmitFn(e.target, '/form')(e);
        });
    });

});

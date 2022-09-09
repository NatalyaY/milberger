'use strict';
import _ from 'lodash';


export function openPopup(msg, customState = "") {
    return (data="") => {
        let layer = document.querySelector('.layer');
        if (layer) layer.remove();
        const tmpl = _.template(require('../templates/popup.html'));
        let state, status;
        if (data?.err) {
            state = customState || 'не удалось';
            let reason = data.err.message ? data.err.message : 'Попробуйте позже';
            state = state + '.<br>' + reason;
            status = 'error';
        } else {
            state = customState || 'прошло успешно!';
            status = 'success';
        };
        const popup = tmpl({ msg, state, status });
        const wrap = document.createElement('div');
        wrap.innerHTML = popup;
        document.body.appendChild(...wrap.children);
        layer = document.querySelector('.layer');
        const closeBtn = layer.querySelector('.popup_close');
        [layer, closeBtn].forEach((el) => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if ((e.target != closeBtn) && (e.target.closest('.popup'))) {
                    return;
                };
                layer.remove();
            });
        });
    };
}
"use strict";
(self["webpackChunkmilberger"] = self["webpackChunkmilberger"] || []).push([["common~submitForm"],{

/***/ "./src/js/submitForm.js":
/*!******************************!*\
  !*** ./src/js/submitForm.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "setSubmitFn": () => (/* binding */ setSubmitFn)
/* harmony export */ });
/* harmony import */ var _openPopup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./openPopup.js */ "./src/js/openPopup.js");



function setSubmitFn(form, action, fnOnsuccess = '') {
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
                fnOnsuccess();
            } else {
                form.reset();
                const reqFields = form.querySelectorAll('input[data-not-empty]');
                [...reqFields].forEach(field => { field.dataset.notEmpty ='' });
                (0,_openPopup_js__WEBPACK_IMPORTED_MODULE_0__.openPopup)('Ваша заявка была', 'успешно отправлена!')();
            }
        } else {
            (0,_openPopup_js__WEBPACK_IMPORTED_MODULE_0__.openPopup)('Отправить заявку', 'не удалось')({err: {
                message: res.statusText,
            }});
            const msg = form.querySelector('.err_msg');
            msg.innerText = `Ошибка. ${res.statusText}`;
            msg.style.display = 'block';
        }
    }
}

/***/ })

}]);
//# sourceMappingURL=common~submitForm.js.map
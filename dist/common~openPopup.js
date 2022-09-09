"use strict";
(self["webpackChunkmilberger"] = self["webpackChunkmilberger"] || []).push([["common~openPopup"],{

/***/ "./src/js/openPopup.js":
/*!*****************************!*\
  !*** ./src/js/openPopup.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "openPopup": () => (/* binding */ openPopup)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);




function openPopup(msg, customState = "") {
    return (data="") => {
        let layer = document.querySelector('.layer');
        if (layer) layer.remove();
        const tmpl = lodash__WEBPACK_IMPORTED_MODULE_0___default().template(__webpack_require__(/*! ../templates/popup.html */ "./src/templates/popup.html"));
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

/***/ })

}]);
//# sourceMappingURL=common~openPopup.js.map
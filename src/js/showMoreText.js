'use strict';

export function showMoreText(e) {
    e.preventDefault();
    const parentElem = e.target.closest('.hiddenTextContainer');
    const ellipsedText = parentElem.querySelectorAll('.hidden__content')[0];
    ellipsedText.dataset.enabled = parseInt(ellipsedText.dataset.enabled) ? 0 : 1;
    e.currentTarget.classList.toggle('up');
};
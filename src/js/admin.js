'use strict';
import './../scss/index.scss';
import _ from 'lodash';
import { adminTab } from './adminTabs.js';
import { openPopup } from './openPopup.js';
import { EditableToolbar } from './editBtns';

const tab = document.querySelector('.admin__content__tab');
const page = window.location.pathname.slice(1).split('/')[1];
let tabHandler, socket;
const toolbars = {};
const callbaks = {};


const headers = {
    users: 'пользователя',
    articles: 'статьи',
    gallery: 'проекта в галерее',
    projects: 'проекта',
    add: 'Добавление',
    edit: 'Редактирование',
};

const radioBtns = {
    users: {
        name: 'role',
        btns: [
            {
                value: 'admin',
                text: 'Администратор',
                checked: isChecked,
            },
            {
                value: 'user',
                text: 'Пользователь',
                checked: isChecked,
            }
        ]
    },
    articles: {
        name: 'publish',
        btns: [
            {
                value: 'true',
                text: 'Сохранить и опубликовать',
                checked: isChecked,
            },
            {
                value: 'false',
                text: 'Сохранить и НЕ публиковать',
                checked: isChecked,
            },
        ],
    },
    projects: {
        name: 'publish',
        btns: [
            {
                value: 'true',
                text: 'Сохранить и опубликовать',
                checked: isChecked,
            },
            {
                value: 'false',
                text: 'Сохранить и НЕ публиковать',
                checked: isChecked,
            },
        ],
    }
};

const checkBtns = {
    projects: {
        name: 'gallery',
        btns: [
            {
                text: 'Выводить этот проект в галерее на первом экране',
                checked: isChecked,
            },
        ],
    }
};

function findValue(item, key) {
    if (!item) {
        let value = '';
        if (key === 'previewImg') {
            value = '../img/placeholder.png';
        } else if (key.split('-')[0] === 'addText') {
            let type = key.split('-')[2];
            switch (type) {
                case "square":
                    value = 'м<sup>2</sup>'
                    break;
                case "wallet":
                    value = 'млн р.'
                    break;
                case "calendar":
                    value = 'дней'
                    break;
            };
        };
        return value;
    };
    let field = item.querySelector(`.admin__content__item__field[data-type="${key}"]`);
    if (!field) {
        if (key.split('-')[0] === 'addText') {
            const character = item.querySelector(`[data-type="${key.slice(key.indexOf('-') + 1)}"]`);
            field = character.parentNode.querySelector('.character__input__addText');
        } else {
            return '';
        };
    };
    return field.tagName == 'IMG' ? field.src : field.innerHTML;
};

function isChecked(item, value, type = '') {
    if (!item) {
        return false;
    };
    let itemValue;
    switch (page) {
        case "users":
            itemValue = item.closest('[data-section]').dataset.section;
            break;
        case "articles":
            itemValue = '';
            break;
        case "projects":
            itemValue = type == 'checkbox' ? item.querySelector('.admin__content__item__checkbox').checked : '';
            return itemValue;
        default:
            break;
    }
    return itemValue == value;
}

const commonEditables = {
    users: {
        email: {
            type: "input",
            text: "email",
            value: findValue,
        },
    },
    articles: {
        group_title: 'Данные для превью:',
        previewImg: {
            type: "file",
            text: "Изображение",
            value: findValue,
        },
        title: {
            type: "input",
            text: "Название",
            group: 'start',
            value: findValue,
        },
        description: {
            type: "",
            text: "Описание",
            group: 'end',
            value: findValue,
        },
        body: {
            type: "",
            text: "Текст статьи",
            value: findValue,
        },
    },
    projects: {
        previewImg: {
            type: "file",
            text: "Изображение",
            value: findValue,
        },
        title: {
            type: "input",
            text: "Название",
            group: 'start',
            value: findValue,
        },
        group_title: 'Характеристики:',

        "character-square": {
            type: "character",
            icon: "square",
            text: "Площадь",
            value: findValue,
            group: 'start',
            addText: findValue,
        },

        "character-calendar": {
            type: "character",
            icon: "calendar",
            text: "Срок",
            value: findValue,
            addText: findValue,
        },

        "character-wallet": {
            type: "character",
            icon: "wallet",
            text: "Стоимость",
            value: findValue,
            addText: findValue,
            group: 'end',
        },
        video: {
            type: "input",
            text: "ID видео (Youtube)",
            value: findValue,
        },
        body: {
            type: "",
            text: "Описание",
            group: 'end outer',
            value: findValue,
        },
    }
}

const commonOptions = {
    radioBtns: radioBtns[page],
    checkBtns: checkBtns[page],
    editables: commonEditables[page],
    editBtns: _.template(require('../templates/admin/partials/editBtns.html')),
    page,
};


/**
 * If the browser supports the history API, use it to remove the hash from the URL. Otherwise, use the
 * location object to remove the hash from the URL
 */
function removeHash() {
    if ("pushState" in history)
        history.pushState('', document.title, window.location.pathname);
    else {
        window.location = window.location.origin + window.location.pathname;
    }
}

function handleHash() {
    if (window.location.hash) {
        const cleanedHash = window.location.hash.slice(1).split('-');
        const hashName = cleanedHash[0];
        const hashValue = cleanedHash[1];
        if ((hashName === 'edit') && hashValue) {
            openConstructor(hashValue);
        } else if (hashName === 'add') {
            openConstructor();
        } else removeHash();
    };
}

function handleLogOut() {
    const logout = document.querySelector('.admin__header__logout');

    logout.addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetch('/logout', {
            method: 'POST',
        });
        if (res.status === 200) {
            window.location.pathname = '/';
        };
    });
}

function tabListenChanges() {
    tabHandler = new adminTab(tab);
    handleTabBtns();
}

function handleTabBtns() {
    const delBtns = Array.from(document.querySelectorAll('.admin__content__item__btn[data-type="delete"]'));
    const editBtns = Array.from(document.querySelectorAll('.admin__content__item__btn[data-type="edit"]'));
    const addBtn = document.querySelector('.admin__content__header__addBtn');
    const publishBtns = Array.from(document.querySelectorAll('.admin__content__item__status__btn'));
    const galleryBtns = Array.from(document.querySelectorAll('.admin__content__item__checkbox'));


    /* Adding event listeners to the buttons that are added to the DOM. */
    let observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                const delBtn = node.querySelector('.admin__content__item__btn[data-type="delete"]');
                const editBtn = node.querySelector('.admin__content__item__btn[data-type="edit"]');
                const publishBtns = node.querySelectorAll('.admin__content__item__status__btn');
                const galleryBtns = node.querySelectorAll('.admin__content__item__checkbox');
                if (delBtn) delBtn.addEventListener('click', deleteItem);
                if (editBtn) editBtn.addEventListener('click', openConstructor);
                publishBtns.forEach((btn) => {
                    if (btn) {
                        btn.addEventListener('click', changePublishState);
                    };
                });
                galleryBtns.forEach((btn) => {
                    if (btn) {
                        btn.addEventListener('change', changeGalleryState);
                    };
                });

                if (page == 'leads') {
                    handleLeads([node]);
                };

            }
        };
    });

    const items = document.querySelectorAll('.admin__content__items_list');

    [...items].forEach((item) => {
        observer.observe(item, { childList: true, subtree: true });
    });

    delBtns.forEach((btn) => {
        btn.addEventListener('click', deleteItem);
    });

    editBtns.forEach((btn) => {
        btn.addEventListener('click', openConstructor);
    });

    function handleLeads(leads) {

        leads.forEach((item) => {
            item.addEventListener('click', (e) => {
                const hidden = e.currentTarget.querySelector('.admin__content__item__hidden');
                if (e.target.closest('.admin__content__item__hidden')) return;
                hidden.classList.toggle('visible');
            });
        });
        const selectableStatuses = [...leads].map(item => item.querySelectorAll('.admin__content__item__hidden__statuses li[data-code]:not([data-code=""])'));

        selectableStatuses.forEach((arr) => {
            arr.forEach((el) => {
                el.addEventListener('click', (e) => {
                    const value = e.currentTarget.querySelector('span').innerText;
                    const code = e.currentTarget.dataset.code;
                    const id = e.target.closest('.admin__content__item').dataset.id;
                    const req = {
                        data: {
                            status: value,
                            statusCode: code,
                        },
                        _id: id,
                    };
                    req.op = 'update';
                    wsSend(req, callbackWithPopup('Изменение статуса'));
                });
            });
        });
    }

    if (page == 'leads') {
        const leads = document.querySelectorAll('.admin__content__item');
        handleLeads(leads);
    };

    publishBtns.forEach((btn) => {
        btn.addEventListener('click', changePublishState);
    });

    galleryBtns.forEach((btn) => {
        btn.addEventListener('change', changeGalleryState);
    });

    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openConstructor();
        });
    };

}

function deleteItem(e) {
    e.preventDefault();
    const item = e.target.closest('.admin__content__item');
    wsSend({ _id: item.dataset.id, op: 'delete' }, callbackWithPopup('Удаление'));
}

/**
 * @param msg - The message to display in the popup
 * @returns A function that takes a single argument, data.
 */
function callbackWithPopup(msg) {
    return function (data) {
        openPopup(msg)(data);
        if (!data.err) {
            closeConstructor();
        };
    }
}

function changePublishState(e) {
    const stateValue = e.target.dataset.value;
    const id = e.target.closest('.admin__content__item').dataset.id;
    const originid = e.target.closest('.admin__content__item').dataset.originid;
    const req = {
        data: {
            publish: stateValue,
        },
        _id: id,
    };
    if (originid) {
        req.originid = originid;
    };
    req.op = 'change publish';
    wsSend(req, callbackWithPopup('Изменение статуса публикации'));
}

function changeGalleryState(e) {
    const stateValue = e.target.checked;
    const id = e.target.closest('.admin__content__item').dataset.id;
    const req = {
        data: {
            gallery: stateValue,
        },
        _id: id,
    };
    req.op = 'update';
    wsSend(req, callbackWithPopup('Изменение статуса вывода в галерее'));
}

function openConstructor(e) {
    let type = 'edit', item, id;
    if (!arguments.length) {
        type = 'add';
    } else if (e.currentTarget) {
        type = e.currentTarget.dataset.type;
        item = e.currentTarget.closest('.admin__content__item');
        id = item.dataset.id;
    } else if (e) {
        item = document.querySelector(`[data-id="${e}"]`);
        if (!item) {
            history.pushState('', document.title, window.location.pathname);
            return;
        };
        id = e;
    };

    const originId = item ? item.dataset.originid || '' : '';

    const tmpl = _.template(require('../templates/admin/partials/constructor.html'));

    const options = Object.assign({}, commonOptions, { item, id, header: headers[type] + " " + headers[page], originId });

    const compiled = tmpl(options);
    const wrap = document.createElement('div');
    wrap.innerHTML = compiled;

    const container = document.querySelector('.admin__container');
    tab.style.display = 'none';
    container.appendChild(...wrap.children);
    const constructor = document.querySelector('.constructor');
    const editToolbars = constructor.querySelectorAll('.editbtns');

    if (editToolbars.length) {
        editToolbars.forEach((toolbar) => {
            const type = toolbar.closest('.admin__CM__editableItem').dataset.type;
            toolbars[type] = new EditableToolbar(toolbar);
        });
    };

    handleConstructorBtns();
    window.location.hash = (type == 'edit') ? `edit-${id}` : 'add';
}

function closeConstructor() {
    if (!document.querySelector('.constructor')) {
        return;
    };
    tab.style.display = '';
    document.querySelector('.constructor').remove();
    removeHash();
}

function handleConstructorBtns() {
    const constructor = document.querySelector('.constructor');
    const savebtn = constructor.querySelector('.admin__CM__btn[data-type="save"]');
    const back = constructor.querySelector('.constructor__backBtn');
    const cancel = constructor.querySelector('.admin__CM__btn[data-type="cancel"]');
    const textFields = constructor.querySelectorAll('.admin__CM__editableItem__content:not([type="file"])');
    const fileField = constructor.querySelector('.admin__CM__editableItem__content[type="file"]');
    const radios = [...constructor.querySelectorAll('.admin__CM__radio')];
    const characterInput = constructor.querySelector('[data-id="character-calendar"]');

    if (characterInput) {
        characterInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const parent = e.target.parentNode;
            const addTextField = parent.querySelector('.character__input__addText');
            const words = ["день", "дня", "дней"];
            /* Selecting the correct  word variation. */
            const addText = words[(value % 100 > 4 && value % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(value % 10 < 5) ? Math.abs(value) % 10 : 5]] || 'дней';
            addTextField.innerText = addText;
        });
    }

    function change() {
        const nonEmpty = [...textFields].filter((item) => {
            if (item.tagName == 'INPUT') {
                return item.value.trim() != '';
            } else {
                return item.innerText.trim() != '';
            };
        });
        const checkedRadios = radios.find((radio) => radio.checked);

        if ((!nonEmpty.length) || (radios.length && !checkedRadios)) {
            savebtn.disabled = true;
            return;
        };
        savebtn.disabled = false;
    };

    [...textFields, ...radios, fileField].forEach((field) => {
        if (field) field.addEventListener('input', change);
    });

    if (fileField) {
        fileField.addEventListener('input', (e) => {
            const file = e.target.files[0];
            if (file.type.split('/')[0] != 'image') {
                openPopup('Загрузить файл')({
                    err: {
                        message: 'Пожалуйста, загрузите изображение.'
                    }
                });
                return;
            };
            const url = URL.createObjectURL(file);
            const img = e.target.parentNode.querySelector('.admin__CM__img');
            img.src = url;
        });
    }

    [back, cancel].forEach((btn) => {
        btn.addEventListener('click', () => {
            closeConstructor();
        });
    });

    savebtn.addEventListener('click', async (e) => {
        const radios = [...constructor.querySelectorAll('.admin__CM__radio')];
        const fields = constructor.querySelectorAll('.admin__CM__editableItem__content');
        const checkboxes = [...constructor.querySelectorAll('.admin__CM__checkbox')];

        const formData = new FormData();
        let files, removedFiles = [], uploads = [];

        if (fileField.files.length) {
            files = true;
            const previewFile = fileField.files[0];
            const previewImgBlob = fileField.parentNode.querySelector('.admin__CM__img').src;
            formData.append("previewImg", previewFile, previewImgBlob);
        };

        if (Object.keys(toolbars).length) {
            Object.keys(toolbars).forEach((key) => {
                Object.keys(toolbars[key].files).forEach((file) => {
                    files = true;
                    formData.append(key, toolbars[key].files[file], file);
                });
                removedFiles = removedFiles.concat(toolbars[key].removedFiles);
            });
        };

        if (files) {
            const res = await fetch('/admin/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.status === 200) {
                const json = await res.json();

                const images = document.querySelectorAll('.admin__CM__editableItem img[src^="blob"]');
                images.forEach((image) => {
                    const editableItem = image.closest('.admin__CM__editableItem');
                    if (editableItem) {
                        const fieldname = image.closest('.admin__CM__editableItem').dataset.type;
                        const filename = image.src.split('/')[image.src.split('/').length - 1];
                        if (json[fieldname] && json[fieldname][filename]) {
                            image.src = json[fieldname][filename];
                            if (fieldname == "previewImg") {
                                fileField.dataset.value = json[fieldname][filename];
                            }
                        } else {
                            let imgWrap = image.closest('.imgWrap');
                            if (imgWrap) {
                                imgWrap.remove();
                            } else {
                                image.remove();
                            };
                        };
                    };
                });
            } else {
                openPopup('Сохранить')({
                    err: {
                        message: res.statusText
                    }
                });
                return;
            };
        }

        const editables = [...fields].reduce((obj, cur) => {
            let value;

            if (cur.tagName == 'INPUT') {
                if (cur.type == 'file') {
                    value = cur.dataset.value;
                } else if (cur.classList.contains('character__input')) {
                    const addtext = cur.parentNode.querySelector('.character__input__addText');
                    value = {
                        value: cur.value,
                        icon: cur.dataset.id.split('-')[1],
                        addText: addtext.innerHTML,
                    };
                } else {
                    value = cur.value;
                };
            } else {
                const widgets = cur.querySelectorAll('.widget');
                if (widgets.length) {
                    [...widgets].forEach(widget => widget.remove());
                };
                const contenteditables = cur.querySelectorAll('[contenteditable]');
                if (contenteditables.length) {
                    [...contenteditables].forEach(contenteditable => contenteditable.removeAttribute('contenteditable'));
                };
                const floatImgBlocks = cur.querySelectorAll('.imageFloat');
                if (floatImgBlocks.length) {
                    [...floatImgBlocks].forEach((block) => {
                        const images = Array.from(block.querySelectorAll('.imgWrap[data-style="right"]'))
                            .concat(Array.from(block.querySelectorAll('.imgWrap[data-style="left"]')));
                        if (!images.length) {
                            block.classList.remove('.imageFloat');
                            return;
                        } else {
                            for (let i = 0; i < images.length; i++) {
                                const modifier = i == 0 ? 0 : 3;
                                const img = [...block.children].find(child => child === images[i]);
                                img.style.order = i + 2 + modifier;
                                const imgNextChild = img.nextElementSibling;
                                if (imgNextChild) {
                                    imgNextChild.style.order = i + 1 + modifier;
                                    let nextSibling = imgNextChild.nextElementSibling;
                                    while (nextSibling && !nextSibling.classList?.contains('imgWrap')) {
                                        nextSibling.style.order = i + 3 + modifier;
                                        nextSibling = nextSibling.nextElementSibling;
                                    };
                                };

                            }
                        };
                    });
                };
                value = cur.innerHTML;
            };


            if (cur.classList.contains('character__input')) {
                if (!obj.characters) {
                    obj.characters = {};
                    obj.characters[cur.dataset.id] = value;
                } else {
                    obj.characters[cur.dataset.id] = value;
                };
            } else {
                obj[cur.dataset.id] = value;
            };
            return obj;
        }, {});

        const images = document.querySelectorAll('.admin__CM__editableItem img');
        images.forEach(img => uploads.push(img.src));

        /**
         * It takes an array of inputs and returns an object with the name of each input as a key and
         * the value of the checked input as the value.
         * @param arr - the array of inputs to search through
         * @param type - 'radio' or 'checkbox'
         * @returns An object with the name of the input as the key and the value of the input as the
         * value.
         */
        function findCheckedInputs(arr, type) {
            return arr.reduce((obj, cur) => {
                let name = cur.name;
                if (!obj[name]) {
                    const checked = arr.find((el) => ((el.name == name) && (el.checked)));
                    let value = false;
                    if (checked) {
                        if (type == 'radio') {
                            value = checked.value;
                        } else {
                            value = true;
                        };
                    };
                    obj[name] = value;
                };
                return obj;
            }, {});
        };

        const checkedRadios = findCheckedInputs(radios, 'radio');
        const checkedCheckoxes = findCheckedInputs(checkboxes, 'checkbox');

        const req = {
            data: Object.assign(checkedRadios, editables, checkedCheckoxes, {uploads }, {removedFiles}),
        };

        let msg;

        if (constructor.dataset.id) {
            req._id = constructor.dataset.id;
            if (constructor.dataset.originid) {
                req.originid = constructor.dataset.originid;
            };
            req.op = 'update';
            msg = 'Редактирование';
        } else {
            req.op = 'insert';
            msg = 'Сохранение';
        };

        wsSend(req, callbackWithPopup(msg));
    });
}

function getUniqId() {
    return Date.now().toString() + '#' + Math.random().toString(36).slice(2, 9);
};

function wsSend(req, fn) {
    const layer = document.createElement('div');
    layer.className = 'layer';
    const loader = document.createElement('div');
    loader.className = 'loader';
    for (let i = 1; i <= 12; i++) {
        loader.appendChild(document.createElement('div'));
    };
    layer.appendChild(loader);
    document.body.appendChild(layer);
    const id = getUniqId();
    callbaks[id] = fn;
    socket.send(JSON.stringify(Object.assign(req, { caller: id })));
}

function getSocket() {
    const url = window.location.host + '/ws' + window.location.pathname;
    const protocol = (window.location.protocol === "https:") ? "wss://" : "ws://";

    socket = new WebSocket(`${protocol}${url}`);

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if (data.caller) {
            callbaks[data.caller](data);
            return;
        };
        tabHandler.handleChanges(data);
    };

    socket.onclose = function (e) {
        if (e.code === 1006) {
            getSocket();
        };
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    handleLogOut();

    if (!tab) return;

    handleHash();

    getSocket();
    tabListenChanges();

    window.onbeforeunload = () => {
        socket.close();
    };

})

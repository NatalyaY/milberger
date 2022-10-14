'use strict';
import _ from 'lodash';

export class adminTab {
    constructor(tab) {
        this.tab = tab;
        switch (this.tab.id) {
            case 'users':
                this.emptyText = 'Нет пользователей';
                this.tmpl = _.template(require('../templates/admin/partials/users_list.html'));
                this.section = {
                    field: 'role',
                    names:
                    {
                        admin: 'admin',
                        default: 'user',
                    },
                }
                break;
            case 'articles':
                this.emptyText = 'Нет статей';
                this.tmpl = _.template(require('../templates/admin/partials/articles_list.html'));
                break;
            case 'projects':
                this.emptyText = 'Нет проектов';
                this.tmpl = _.template(require('../templates/admin/partials/articles_list.html'));
                break;
            case 'leads':
                this.emptyText = 'Нет заявок';
                this.tmpl = _.template(require('../templates/admin/partials/leads_list.html'));
                break;
            default:
                break;
        }
    }

    update = (data) => {
        const updatedFields = data.updateDescription.updatedFields;

        if (this.section && updatedFields[this.section.field]) {
            this.delete(data);
            this.insert(data);
            return;
        };

        const id = data.documentKey._id;
        const elemToUpdate = this.tab.querySelector(`[data-id="${id}"]`);

        if (!elemToUpdate) {
            this.insert(data);
            return;
        };

        for (const key in updatedFields) {
            if (updatedFields.hasOwnProperty(key)) {
                if (key == 'publish') {
                    elemToUpdate.querySelector(`[data-type="${key}"]`).dataset.value = updatedFields[key];
                    continue;
                };
                if (key == 'statusCode') {
                    elemToUpdate.querySelector(".admin__content__item__status").dataset.statuscode = updatedFields[key];
                    continue;
                };
                if (key == 'previewImg') {
                    elemToUpdate.querySelector(`[data-type="${key}"]`).src = updatedFields[key];
                    continue;
                };
                if (key == 'gallery') {
                    if (updatedFields[key]) {
                        elemToUpdate.querySelector(`[data-type="${key}"]`).setAttribute("checked", true);
                    } else {
                        elemToUpdate.querySelector(`[data-type="${key}"]`).removeAttribute("checked");
                    };
                    continue;
                }
                if (elemToUpdate.querySelectorAll(`[data-type="${key}"]`).length) {
                    [...elemToUpdate.querySelectorAll(`[data-type="${key}"]`)].forEach(el => el.innerHTML = updatedFields[key])
                };
            };
        };
    }

    delete = (data) => {
        const id = data.documentKey._id;
        const elemToUpdate = this.tab.querySelector(`[data-id="${id}"]`);
        const parent = elemToUpdate.parentNode;
        if (elemToUpdate) elemToUpdate.remove();
        if (!parent.childElementCount) {
            const emptyText = document.createElement('span');
            emptyText.classList.add('admin__content__emptyText');
            emptyText.innerText = this.emptyText;
            parent.appendChild(emptyText);
        };
    }

    insert = (data) => {
        let section = this.tab;
        if (this.section) {
            const fieldValue = data.fullDocument[this.section.field];
            const sectionName = this.section.names[fieldValue] || this.section.names.default;
            section = document.querySelector(`[data-section="${sectionName}"]`);
        };
        const emptyText = section.querySelector('.admin__content__emptyText');
        if (emptyText) { emptyText.remove() };
        const itemsList = section.querySelector('.admin__content__items_list');
        const options = {};
        options[`${this.tab.id}`] = [data.fullDocument];
        const item = this.tmpl({ data: options });
        const wrap = document.createElement('div');
        wrap.innerHTML = item;
        itemsList.append(...wrap.children);
    }

    handleChanges = (data) => {
        this[data.operationType](data);
    }
}
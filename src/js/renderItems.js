'use strict';
import _ from 'lodash';

class RenderData {

    constructor(selector) {
        this.elem = document.getElementById(selector);
    }

    fetchData = async () => {
        const response = await fetch(this.__proto__.constructor.url);
        if (response.ok) {
            this.json = await response.json();
        } else {
            console.log("Ошибка HTTP: " + response.status);
            throw new Error(response.status);
        };
    }

    compile = () => {
        return this.__proto__.constructor.tmpl(this.json);
    }

    render = async () => {
        await this.fetchData();
        const compiled = this.compile();
        const wrap = document.createElement('div');
        wrap.innerHTML = compiled;
        this.elem.replaceWith(...wrap.children);
    }
}

export class RenderGallery extends RenderData {
    static url = "https://extendsclass.com/mock/rest/12adba4188b51b03a55647b0c9f508a6/gallery";
    static tmpl = _.template(require('../templates/gallery_items.html'));
}

export class RenderProjects extends RenderData {
    static url = "https://extendsclass.com/mock/rest/12adba4188b51b03a55647b0c9f508a6/projects";
    static tmpl = _.template(require('../templates/projects.html'));

    compile = () => {
        this.json.items.map((item) => {
            const description = item.description;
            const maxlength = 300;
            let splitted = description.split('.');
            let visible = "";
            let hidden = "";

            do {
                visible += splitted.shift() + '.';
            } while (visible.length <= maxlength);

            let diff = maxlength - visible.length;
            if (diff < 0) {
                while ((visible[visible.length + diff] != " ") && visible[visible.length + diff] != "<") {
                    diff--;
                };
                hidden = visible.slice([visible.length + diff]) + splitted.join('.');
                visible = visible.slice(0, [visible.length + diff]);
            } else {
                hidden = splitted.join('.');
            };
            item.visible = visible;
            item.hidden = hidden;
        })
        return RenderProjects.tmpl(this.json);
    }
}

export class RenderArticles extends RenderData {
    static url = "https://extendsclass.com/mock/rest/12adba4188b51b03a55647b0c9f508a6/articles";
    static tmpl = _.template(require('../templates/articles.html'));

    compile = () => {
        this.json.items.sort((a, b) => a.date - b.date);
        this.json.items = this.json.items.slice(0, 3);
        return RenderArticles.tmpl(this.json);
    }
}
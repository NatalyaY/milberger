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

export class RenderProjects extends RenderData {
    static url = "/projects";
    static tmpl = _.template(require('../templates/projects.html'));
    static json = '';

    compile = () => {
        return this.__proto__.constructor.tmpl(RenderProjects.json);
    }

    render = async () => {
        let compiled;
        if (!RenderProjects.json) {
            await this.fetchData();
            RenderProjects.json = this.json;
        };
        compiled = this.compile();
        const wrap = document.createElement('div');
        wrap.innerHTML = compiled;
        this.elem.replaceWith(...wrap.children);
    }
}

export class RenderGallery extends RenderProjects {
    static url = "/projects";
    static tmpl = _.template(require('../templates/gallery_items.html'));
}

export class RenderArticles extends RenderData {
    static url = "/articles";
    static tmpl = _.template(require('../templates/articles.html'));

    compile = () => {
        this.json.items.sort((a, b) => b.date - a.date);
        const dateNow = Date.parse(new Date());
        const dateNowUTC = Date.parse(new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds()));
        this.json.items.forEach((item) => {
            let date = item.date;
            date = new Date(date + dateNow - dateNowUTC);
            const dateString = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
            item.date = dateString;
        });
        return RenderArticles.tmpl(this.json);
    }
}
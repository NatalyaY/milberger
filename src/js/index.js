import '../scss/index.scss';
import { Gallery } from './gallery.js';
import { Range } from './range.js';
import { Form } from './form.js';
import { createPlayer } from "./video.js";
import { RenderGallery, RenderProjects, RenderArticles } from "./renderItems.js";
import { setSubmitFn } from './submitForm.js';
import { showMoreText } from './showMoreText.js';

import _ from 'lodash';


const forms = document.querySelectorAll('.form__container');

function slideToProject(e) {
    e.preventDefault();
    const project = e.currentTarget.closest('.home__gallery__item');
    const projectTitle = project.querySelector('.home__gallery__item__heading').innerText;
    const projectsFullGallery = document.querySelector('#projects .projects__content');
    const fullGalleryHeadings = projectsFullGallery.querySelectorAll('.project__text__heading');
    const sameProjectPos = [...fullGalleryHeadings].findIndex(el => el.textContent == projectTitle);
    const nextBtn = projectsFullGallery.querySelector('.btn--next');
    for (let index = 1; index <= sameProjectPos; index++) {
        nextBtn.click();
    };
    scrollTo("#projects");
}

function animate({ timing, draw, duration }) {

    let start = performance.now();

    requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;
        let progress = timing(timeFraction);
        draw(progress);
        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        };
    });
}

function scrollTo(selector) {
    const el = document.querySelector(`${selector}`);
    const scrollY = el.getBoundingClientRect().top + window.pageYOffset;
    const headerHeight = parseInt(getComputedStyle(document.querySelector('header.header')).height);
    animate({
        duration: 300,
        draw(progress) {
            const scroll = scrollY - headerHeight - window.pageYOffset;
            window.scrollBy(0, scroll * progress);
        },
        timing(timeFraction) {
            return Math.pow(timeFraction, 2);
        }
    })
}

function handleHash () {
    const hash = window.location.hash;
    if ("pushState" in history)
        history.pushState('', document.title, window.location.pathname);
    else {
        window.location = window.location.origin + window.location.pathname;
    };
    if (hash) {
        scrollTo(hash);
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    handleHash();
    await new RenderGallery('js-gallery__items').render();
    await new RenderProjects('js-projects').render();
    await new RenderArticles('js-articles').render();

    const showMoreTextBtn = document.querySelectorAll('.moreLink');
    const showProjectBtns = document.querySelectorAll('.home__gallery__item__link');
    const navLinks = document.querySelectorAll('.nav__item__link');
    const navHrefs = [...navLinks].map(link => link.getAttribute('href').slice(1));
    const costBtn = document.querySelector('.home__btn');
    const galleryBtn = document.querySelector('.home__gallery__link[href="#cost"]');

    [...navLinks].forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const activeLink = [...navLinks].find(link => link.classList.contains('active'));
            activeLink.classList.remove('active');
            e.target.classList.add('active');
            scrollTo(link.getAttribute('href').slice(1));
        })
    });

    [costBtn, galleryBtn].forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollTo(link.getAttribute('href'));
        })
    });

    [...showProjectBtns].forEach((el) => {
        el.addEventListener('click', slideToProject)
    });

    [...forms].forEach((form) => {
        new Form(form);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            setSubmitFn(e.target, '/form')(e);
        });
    });

    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target.id;
                const targetLink = [...navLinks].find(link => link.getAttribute('href').slice(1) == `#${target}`);
                const activeLink = [...navLinks].find(link => link.classList.contains('active'));
                if (activeLink) {
                    activeLink.classList.remove('active');
                };
                if (targetLink) {
                    targetLink.classList.add('active');
                };
            };
        });
    }, options)

    const navSections = navHrefs.map(href => document.querySelector(href));
    navSections.forEach(item => {
        observer.observe(item);
    });

    new Gallery({ buttons: true, autoplay: true, galery: '.home__gallery' });
    new Gallery({ buttons: true, autoplay: false, hidePrevAtEnd: true, progress: true, galery: '.cost__form' });
    new Gallery({ buttons: true, autoplay: false, progress: true, galery: '.projects__content', multipleItems: true });
    new Range(".form__item__rangeContainer.rangeSize");
    new Range(".form__item__rangeContainer.rangeHeight");
    createPlayer({ containerId: "player", videoId: 'GVtwyuco3uc' });
    [...showMoreTextBtn].forEach((btn) => btn.addEventListener("click", showMoreText));

    const videoBtns = document.querySelectorAll('.project__text__video');
    [...videoBtns].forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.closest('.gallery__item').dataset.id;
            let imgContainer = document.querySelector(`.project__img__Container[data-id="${id}"]`);
            let img = imgContainer.querySelector('.project__image');
            const tmpl = _.template(require('../templates/videoPopup.html'));
            const compiled = tmpl({ title: e.currentTarget.dataset.title, img: img.src});
            const wrap = document.createElement('div');
            wrap.innerHTML = compiled;
            document.body.append(...wrap.children);
            const layer = document.querySelector('.layer');
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
            createPlayer({ containerId: "video", videoId: e.currentTarget.dataset.video });
        });
    });
});


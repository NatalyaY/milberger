import '../scss/index.scss';
import { Gallery } from './gallery.js';
import { Range } from './range.js';
import { Form } from './form.js';
import { createPlayer } from "./video.js";
import { RenderGallery, RenderProjects, RenderArticles } from "./renderItems.js";
import { setSubmitFn } from './submitForm.js';
import _ from 'lodash';


const forms = document.querySelectorAll('.form__container');

function showMoreText (e) {
    e.preventDefault();
    const parentElem = e.target.closest('.hiddenTextContainer');
    const ellipsedText = parentElem.querySelectorAll('.hidden__content')[0];
    ellipsedText.dataset.enabled = parseInt(ellipsedText.dataset.enabled) ? 0 : 1;
    e.currentTarget.classList.toggle('up');
};

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

function scrollTo (selector) {
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

document.addEventListener('DOMContentLoaded', async () => {
    await new RenderGallery('js-gallery__items').render();
    await new RenderProjects('js-projects').render();
    await new RenderArticles('js-articles').render();

    const showMoreTextBtn = document.querySelectorAll('.moreLink');
    const showProjectBtns = document.querySelectorAll('.home__gallery__item__link');
    const navLinks = document.querySelectorAll('.nav__item__link');
    const navHrefs = [...navLinks].map(link => link.getAttribute('href'));

    [...navLinks].forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const activeLink = [...navLinks].find(link => link.classList.contains('active'));
            activeLink.classList.remove('active');
            e.target.classList.add('active');
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
                const targetLink = [...navLinks].find(link => link.getAttribute('href') == `#${target}`);
                const activeLink = [...navLinks].find(link => link.classList.contains('active'));
                activeLink.classList.remove('active');
                targetLink.classList.add('active');
            };
        });
    }, options)

    const navSections = navHrefs.map(href => document.querySelector(href));
    navSections.forEach(item => {
        observer.observe(item);
    });

    new Gallery({ buttons: true, autoplay: false, galery: '.home__gallery' });
    new Gallery({ buttons: true, autoplay: false, hidePrevAtEnd: true, progress: true, galery: '.cost__form' });
    new Gallery({ buttons: true, autoplay: false, progress: true, galery: '.projects__content', multipleItems: true });
    new Range(".form__item__rangeContainer.rangeSize");
    new Range(".form__item__rangeContainer.rangeHeight");
    createPlayer({ containerId: "player", videoId: 'GVtwyuco3uc' });
    [...showMoreTextBtn].forEach((btn) => btn.addEventListener("click", showMoreText ));
});

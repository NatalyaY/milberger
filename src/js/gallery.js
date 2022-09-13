'use strict';
/* It's a gallery that can be controlled by buttons, can be set to autoplay, can have multiple items
per slide, can have a progress bar, and can hide the previous button at the end of the gallery */

export class Gallery {
    constructor({ buttons = false, autoplay = false, galery = '.home__gallery', hidePrevAtEnd = false, progress = false, multipleItems = false} = {}) {
        this.gallery = document.querySelector(`${galery}`);
        this.galleryItems = Array.from(this.gallery.querySelectorAll('.gallery__item'));
        /* It's grouping the gallery items by their data-id attribute. */
        if (multipleItems) {
            this.multipleItems = Object.values(this.galleryItems.reduce((acc, item) => {
                if (!acc[item.dataset.id]) {
                    acc[item.dataset.id] = [item];
                } else acc[item.dataset.id].push(item);
                return acc;
            }, {}));
        };
        this.itemsQty = this.multipleItems ? this.multipleItems.length : this.galleryItems.length;
        this.current = 0;
        if (buttons) {
            this.buttons = Array.from(this.gallery.querySelectorAll('.gallery__nav-btn'));
            this.prevButton = this.buttons.find((el) => el.classList.contains("btn--prev"));
            this.nextButton = this.buttons.find((el) => el.classList.contains("btn--next"));
            this.nextButton.addEventListener('click', () => this.next(true));
            this.prevButton.addEventListener('click', () => this.prev(true));
        };
        if (progress) {
            this.progressContainer = this.gallery.querySelector('.gallery__progress');
            this.progressItems = Array.from(this.progressContainer.querySelectorAll(".gallery__progress__item"));
        };
        this.hidePrevAtEnd = hidePrevAtEnd;
        this.setState();
        if (autoplay) this.autoplay();
    }

    setState() {
        for (let i = 0; i < this.itemsQty; i++) {
            const items = this.multipleItems ? this.multipleItems[i] : [this.galleryItems[i]];
            if (i == this.current) {
                items.forEach((item) => {
                    item.dataset.position = 'current';
                    item.style.zIndex = i + 51;
                });
            } else if (i < this.current) {
                items.forEach((item) => {
                    item.dataset.position = 'prev';
                });
            } else {
                items.forEach((item) => {
                    item.dataset.position = 'next';
                    item.style.zIndex = this.itemsQty - i;
                });
            };
        };
        /* It's disabling the previous button at the beginning of the gallery and disabling the next
        button at the end of the gallery. */
        if (this.buttons) {
            switch (this.current) {
                case 0:
                    this.prevButton.disabled = true;
                    this.nextButton.disabled = false;
                    break;
                case this.itemsQty - 1:
                    this.nextButton.disabled = true;
                    this.prevButton.disabled = this.hidePrevAtEnd ? true : false;
                    break;
                default:
                    this.prevButton.disabled = false;
                    this.nextButton.disabled = false;
                    break;
            }
        };
        /* It's adding the class 'active' to the current progress item and removing it from the
        previous one. */
        if (this.progressItems) {
            const currentProgressItem = this.progressItems.find((item) => item.classList.contains('active'));
            if (currentProgressItem) currentProgressItem.classList.remove('active');
            this.progressItems[this.current].classList.add('active');
        };
        /* It's adding the class 'next' to the first slide when the last slide is the current slide. */
        if (this.current + 1 == this.itemsQty) {
            const items = this.multipleItems ? this.multipleItems[0] : [this.galleryItems[0]];
            items.forEach((item) => {
                item.classList.remove('current');
                item.classList.add('next');
            });
        };
    }

    next(isManual = false) {
        if (this.stop && !isManual) return;
        if (this.current + 1 < this.itemsQty) {
            this.current++;
            this.setState();
        };
    }

    prev(isManual = false) {
        if (this.stop && !isManual) return;
        if (this.current - 1 >= 0) {
            this.current--;
            this.setState();
        };
    }

    /**
     * If the current slide is not the last slide, then go to the next slide, otherwise go to the first
     * slide.
     */
    async autoplay() {
        this.setStopOnHover();

        const play = async () => {
            if (!this.stop) {
                if (this.current + 1 < this.itemsQty) {
                    this.next();
                } else {
                    this.current = 0;
                    this.setState();
                };
            };
            timer = setTimeout(play, 3000);
        };

        let timer = setTimeout(play, 1000);
    }

    /**
     * If the mouse is not hovering over the gallery, then the gallery will continue to slide. If the
     * mouse is hovering over the gallery, then the gallery will stop sliding.
     */
    setStopOnHover() {
        const mouseleave = (e) => {
            if ([...this.gallery.children].includes(e.relatedTarget)) return;
            if (this.stop) this.stop = 0;
            [...this.gallery.children].forEach((item) => {
                item.removeEventListener('mouseleave ', mouseleave);
            });
        };

        [...this.gallery.children].forEach((galleryItem) => {
            galleryItem.addEventListener('mouseenter', () => {
                if (!this.stop) {
                    this.stop = 1;
                    [...this.gallery.children].forEach((galleryItem) => {
                        galleryItem.addEventListener('mouseleave', mouseleave);
                    });
                };
            });
        });
    }
}

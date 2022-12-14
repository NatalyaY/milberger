'use strict';
import { openPopup } from './openPopup.js';

export class EditableToolbar {
    /**
     * @param el - the toolbar element
     * @returns The constructor returns the object that was created.
     */
    constructor(el) {
        this.toolbar = el;
        this.editable = el.parentNode.querySelector('.admin__CM__editableItem__content');
        this.actionBtns = Array.from(el.querySelectorAll('[data-command]'));
        this.dropdowns = Array.from(el.querySelectorAll('.btn_dropdown'));
        this.imgBtn = el.querySelector('[data-type="image"]');
        this.savedRange = null;
        this.selector = 'p';
        this.files = {};
        this.removedFiles = [];
        const images = this.editable.querySelectorAll('img');
        const blocks = this.editable.querySelectorAll('div:not(.col)');
        const uls = this.editable.querySelectorAll('ul');
        const ols = this.editable.querySelectorAll('ol');
        this.linkBtn = el.querySelector('[data-type="link"]');
        this.colorBtns = el.querySelectorAll('.colorPicker');
        this.marginBtn = el.querySelector('[data-type="margin"]');

        [...images].forEach((image) => {
            if (image) {
                this.imgAppendWidgetAndListeners(image.parentNode);
            }
        });

        [...blocks, ...uls, ...ols].forEach((block) => {
            if (block) {
                const btns = this.getWidgetBtns();
                block.append(...btns);
            }
        });

        this.editable.addEventListener('paste', (e) => {
            e.preventDefault();
            this.saveSel();
            this.selector = 'p';
            this.renderChangesInDropdown();
            this.restoreSel();
            let node = this.getCurrentNode();
            if (node.textContent) {
                node = '';
            };
            const data = e.clipboardData.getData('text/plain');
            const normalizedData = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const dataStrings = normalizedData.split('\n');
            dataStrings.forEach((string, i) => {
                if(string == '') return;
                if (i && node) {
                    node = '';
                };
                this.handleBlockTypes({ node, innerText: string });
            });
        });

        this.editable.addEventListener('focusout', this.saveSel);

        this.editable.addEventListener('focus', (e) => {
            const content = e.currentTarget.childNodes;
            if (!content.length) {
                const section = document.createElement('section');
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                section.appendChild(p);
                this.editable.appendChild(section);
                this.setCaretPos(p);
            };
        });

        this.editable.addEventListener('keydown', (e) => {
            /* Checking if the key pressed is the backspace or delete key. */
            if ((e.keyCode === 8) || (e.keyCode === 46)) {
                const curElem = this.getCurrentNode();
                const content = this.editable.childNodes;
                if (!curElem.textContent) {
                    /* Prevent removing block if there are no more blocks in container */
                    if ((content.length == 1) && (content[0].childElementCount == 1) && (content[0].firstChild == curElem)) {
                        e.preventDefault();
                    } else {
                        e.preventDefault();
                        let elem = curElem.parentNode;
                        if (curElem.classList.contains('imgWrap')) {
                            const img = curElem.querySelector("img");
                            delete this.files[img.src];
                            if (!~img.src.indexOf('blob')) {
                                this.removedFiles.push(img.src);
                            };
                        };
                        curElem.remove();

                        while (!elem.classList.contains('admin__CM__editableItem__content')) {
                            if ((elem.tagName != 'DIV') && (elem.tagName != 'SECTION') && (elem.textContent)) {
                                this.setCaretPos(elem);
                                break;
                            };

                            let childs = [];
                            if (elem.children.length) {
                                childs = [...elem.children].filter((child) => !child.classList.contains('widget'));
                            };

                            if (childs.length == 0) {
                                if (this.editable.firstChild == elem) {
                                    const p = document.createElement('p');
                                    p.innerHTML = '<br>';
                                    elem.appendChild(p);
                                    this.setCaretPos(p);
                                    break;
                                };
                                const parent = elem.parentNode;
                                elem.remove();
                                elem = parent;
                                if (elem.classList.contains('admin__CM__editableItem__content')) {
                                    this.setCaretPos(elem.lastChild);
                                    break;
                                };
                            } else {
                                this.setCaretPos(childs[childs.length - 1]);
                                break;
                            };
                        };
                        return;
                    };
                } else if (curElem.textContent.length == 1) {
                    if (![...curElem.children].includes('br')) {
                        curElem.innerHTML = '<br>';
                        e.preventDefault();
                    };
                };
            };
            if (e.keyCode === 13) {
                let curNode = this.getCurrentNode();
                e.preventDefault();
                this.selector = 'p';
                this.saveSel();
                this.renderChangesInDropdown();
                const nodes = curNode.childNodes;
                let endContainer = this.savedRange.endContainer;
                const endSelection = this.savedRange.endOffset;
                let text = endContainer.textContent ? endContainer.textContent.slice(endSelection) : '';
                endContainer.textContent = endContainer.textContent.slice(0, endContainer.textContent.length - text.length).trim();
                text = text.trim();
                let index = [...nodes].findIndex((node) => node == endContainer);

                if (index == -1) {
                    while (endContainer.parentNode != curNode) {
                        endContainer = endContainer.parentNode;
                    };
                    index = [...nodes].findIndex((node) => node == endContainer);
                };

                const p = (curNode.tagName == 'LI') ? document.createElement('li') : document.createElement('p');

                const nodesToInsert = [...nodes].slice(index);

                nodesToInsert.forEach((node) => {
                    if ((node != endContainer) && (node.tagName != 'BR') && (!node.classList?.contains('widget'))) {
                        p.append(node);
                    };
                });

                if (text) {
                    p.prepend(text);
                } else if (!p.childElementCount) {
                    p.append(document.createElement('br'));
                };

                curNode.after(p);
                this.setCaretPos(p);
            };
        });

        document.execCommand('defaultParagraphSeparator', false, 'p');
        this.handleSimpleCommands(this.actionBtns);
        this.handleDropdowns(this.dropdowns);
        this.imgBtn.addEventListener('input', this.addImg);
        this.linkBtn.addEventListener('click', this.addLink);
        this.marginBtn.addEventListener('click', this.addMargin);
        [...this.colorBtns].forEach((btn) => {
            btn.addEventListener('change', this.handleColorBtns);
        })

        return this;
    }

    saveSel = () => {
        if (window.getSelection) {
            this.savedRange = window.getSelection().getRangeAt(0);
        } else if (document.selection) {
            this.savedRange = document.selection.createRange();
        };
    }

    restoreSel = () => {
        const scroll = window.scrollY;
        this.editable.focus();
        window.scrollTo(0, scroll);
        if (!this.savedRange) {
            this.saveSel();
        };
        if (this.savedRange != null) {
            if (window.getSelection) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0)
                    selection.removeAllRanges();
                selection.addRange(this.savedRange);
            } else if (document.createRange) {
                window.getSelection().addRange(this.savedRange);
            } else if (document.selection) {
                this.savedRange.select();
            };
        }
    }

    handleSimpleCommands = (btns) => {
        btns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.restoreSel();
                e.currentTarget.classList.toggle('active');
                const command = e.currentTarget.dataset.command;
                const curElem = this.getCurrentNode();
                if ((command == 'insertUnorderedList') || (command == 'insertOrderedList')) {
                    if (curElem.tagName == 'LI') {
                        return;
                    } else {
                        e.currentTarget.classList.add('active');
                        if ((curElem.previousSibling?.tagName == 'UL') || (curElem.previousSibling?.tagName == 'OL')||
                            (curElem.nextSibling?.tagName == 'UL') || (curElem.nextSibling?.tagName == 'OL')) {
                            document.execCommand(command, false, null);
                            return;
                        };
                        document.execCommand(command, false, null);
                        const list = curElem.querySelector('ul') || curElem.querySelector('ol');
                        curElem.replaceWith(list);
                        btns = this.getWidgetBtns();
                        list.append(...btns);
                        this.setCaretPos(list);
                        return;
                    };
                };
                if ((e.currentTarget.dataset.type == "align") && (curElem.classList?.contains('imgWrap'))) {
                    switch (command) {
                        case "justifyLeft":
                            curElem.style.marginRight = 'auto';
                            curElem.style.marginLeft = 'unset';
                            break;
                        case "justifyCenter":
                            curElem.style.marginRight = 'auto';
                            curElem.style.marginLeft = 'auto';
                            break;
                        case "justifyRight":
                            curElem.style.marginLeft = 'auto';
                            curElem.style.marginRight = 'unset';
                            break;
                        case "justifyFull":
                            curElem.style.width = '100%';
                            break;
                    };
                    return;
                };
                document.execCommand(command, false, null);
            });
        });
    }

    handleDropdowns = (btns) => {
        btns.forEach((btn) => {
            const openDropdownBtn = btn.querySelector('.openDropdownBtn');
            const dropdownList = btn.querySelector('.btn_dropdown_list');
            const dropdownBtns = [...dropdownList.querySelectorAll('button')];

            dropdownBtns.forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const curElem = this.getCurrentNode();
                    if ((e.currentTarget.dataset.type == this.selector) && (curElem.tagName.toLowerCase() == this.selector)) {
                        dropdownList.classList.toggle('visible');
                        return;
                    };
                    dropdownList.classList.toggle('visible');
                    switch (openDropdownBtn.dataset.type) {
                        case 'selector':
                            this.handleSelectorBtns(e);
                            break;
                        case 'columns':
                            this.handleColumnsBtns(e);
                            break;
                        case 'fz':
                            this.handleFontBtns(e);
                            break;
                        default:
                            break;
                    };
                    this.renderChangesInDropdown();
                });
            });

            openDropdownBtn.addEventListener('click', (e) => {
                dropdownList.classList.toggle('visible');
                function closeDropdown(e) {
                    if (e.target.closest('.openDropdownBtn') == openDropdownBtn) {
                        return;
                    };
                    dropdownList.classList.remove('visible');
                    document.removeEventListener('click', closeDropdown);
                };
                document.addEventListener('click', closeDropdown);
            });
        });
    }

    renderChangesInDropdown = () => {
        const dropdownResult = this.toolbar.querySelector('.dropdown_result');
        const dropdownList = this.toolbar.querySelector('.btn_dropdown_list');
        const btnToSetActive = dropdownList.querySelector(`[data-type="${this.selector}"]`);

        dropdownResult.innerText = btnToSetActive.innerHTML;
        const curretActiveBtn = dropdownList.querySelector('.active');
        if (curretActiveBtn) {
            curretActiveBtn.closest('li').classList.remove('active');
        };
        btnToSetActive.closest('li').classList.add('active');
    }

    getCurrentNode = () => {
        let node;
        if ((window.getSelection().getRangeAt(0).startContainer.nodeType == 3) ||
            (window.getSelection().getRangeAt(0).startContainer.tagName == 'BR') ||
            (window.getSelection().getRangeAt(0).startContainer.tagName == 'IMG')) {
            node = window.getSelection().getRangeAt(0).startContainer.parentNode;
        } else {
            node = window.getSelection().getRangeAt(0).startContainer;
        };

        if ((node.tagName != 'P') && (node.tagName != 'LI') && (node.tagName != 'H1') && (node.tagName != 'H2') && (node.tagName != 'H3') && (!node.classList?.contains('imgWrap'))) {
            node = node.closest('p') || node.closest('li') || node.closest('h1') || node.closest('h2') || node.closest('h3');
        };
        return node;
    }

    handleSelectorBtns = (e) => {
        this.selector = e.currentTarget.dataset.type;
        this.restoreSel();
        let node = this.getCurrentNode();
        let childs = [];
        if (node.parentNode.children.length) {
            childs = [...node.parentNode.children].filter((child) => !child.classList.contains('widget'));
        };
        if ((node.tagName == 'P') && (childs.length == 1) && (node.parentNode.tagName != 'SECTION') && (!node.parentNode.classList.contains('col')) && (this.selector != 'div')) {
            node = node.parentNode;
        };
        let content = [...node.children].find(child => child.tagName == 'P') ? node.textContent : node.textContent ? node.innerHTML : '';
        this.handleBlockTypes({ node, innerText: content });
    }

    handleColumnsBtns = (e) => {
        const colQty = e.currentTarget.dataset.type;
        this.restoreSel();
        let node = this.getCurrentNode();
        const parentChilds = [...node.parentNode.childNodes].filter((child) => !child.classList.contains('widget'));
        if ((node.tagName == 'P') && (node.parentNode.tagName != 'SECTION') && (parentChilds.length == 1) && (node.textContent.trim() == '') && (!node.parentNode.classList.contains('col'))) {
            const parent = node.parentNode;
            node.remove();
            node = parent;
        };
        if ((node.tagName != 'SECTION') && (node.tagName != 'DIV')) {
            const container = document.createElement('div');
            const btns = this.getWidgetBtns();
            container.append(...btns);
            node.parentNode.appendChild(container);
            if (node.innerText.trim() == '') {
                node.remove();
            };
            node = container;
        };
        node.classList.add('d-flex', 'article-cols');
        for (let i = 1; i <= colQty; i++) {
            const col = document.createElement('div');
            col.classList.add('col');
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            col.appendChild(p);
            node.appendChild(col);
            if (i == 1) {
                this.setCaretPos(p);
            };
        };

    }

    handleFontBtns = (e) => {
        const size = e.currentTarget.dataset.type + 'px';
        this.restoreSel();
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('fontSize', false, size);
        document.execCommand('styleWithCSS', false, false);
        const styledElems = Array.from(this.editable.querySelectorAll('[style*="font-size"]'));
        if (styledElems.length) {
            styledElems.forEach((elem) => {
                elem.style.fontSize = '';
                elem.className = `fz-${e.currentTarget.dataset.type}`;
            });
        };
    }

    handleColorBtns = (e) => {
        const type = e.currentTarget.dataset.type;
        const command = type === 'font' ? 'foreColor' : 'hiliteColor';
        const color = e.currentTarget.value;
        this.restoreSel();
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, color);
        document.execCommand('styleWithCSS', false, false);
    }

    addImg = (e) => {
        this.restoreSel();
        const file = e.currentTarget.files[0];
        if (file.type.split('/')[0] != 'image') {
            openPopup('?????????????????? ????????')({
                err: {
                    message: '????????????????????, ?????????????????? ??????????????????????.'
                }
            });
            return;
        };
        const url = URL.createObjectURL(file);
        e.currentTarget.type = '';
        e.currentTarget.type = "file";
        this.files[url] = file;

        let curElem = this.getCurrentNode();
        let imgWrap;

        if ((window.getSelection().getRangeAt(0).startContainer.tagName === 'BR') && (!window.getSelection().getRangeAt(0).startContainer.parentNode.textContent)) {
            imgWrap = document.createElement('figure');
            imgWrap.dataset.style = 'block';
            window.getSelection().getRangeAt(0).startContainer.parentNode.replaceWith(imgWrap);
            curElem = imgWrap;
        } else {
            imgWrap = document.createElement('span');
            imgWrap.dataset.style = 'inline';
            window.getSelection().getRangeAt(0).insertNode(imgWrap);
        };

        imgWrap.classList.add('imgWrap');
        imgWrap.innerHTML = '<br>';

        this.setCaretPos(imgWrap);
        document.execCommand('insertImage', false, url);

        if (!imgWrap.querySelector("img")) {
            const img = curElem.querySelector("img");
            imgWrap.prepend(img);
        }

        this.setCaretPos(curElem);
        this.imgAppendWidgetAndListeners(imgWrap);
    }

    removeActiveClass = (e) => {
        const activeImgs = e.currentTarget.querySelectorAll('.imgWrap.active');
        if (activeImgs.length) {
            [...activeImgs].forEach((el) => el.classList.remove('active'));
            e.currentTarget.removeEventListener('click', this.removeActiveClass);
        };
    };

    imgAppendWidgetAndListeners = (imgWrap) => {
        const btns = this.getWidgetBtns();
        imgWrap.append(...btns);
        imgWrap.append(this.getWidgetResizer());
        imgWrap.append(this.getWidgetImgStylesBtns());
        imgWrap.setAttribute('contenteditable', 'false');

        const img = imgWrap.querySelector("img");

        img.addEventListener('dragstart', (e) => {
            this.prevImgEl = e.currentTarget.parentNode.parentNode;
            e.currentTarget.parentNode.classList.add('hiddenUI');
            return false;
        });
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            e.currentTarget.parentNode.classList.add('active');
            this.setCaretPos(e.currentTarget.parentNode);
            this.editable.addEventListener('click', this.removeActiveClass);
        });
        img.addEventListener('dragend', (e) => {
            e.preventDefault();
            this.saveSel();
            const curEl = this.getCurrentNode();
            const rangeStartContainer = window.getSelection().getRangeAt(0).startContainer;
            if ((rangeStartContainer.parentNode.classList?.contains('imgWrap')) || (rangeStartContainer.classList?.contains('imgWrap'))) {
                e.currentTarget.parentNode.classList.remove('hiddenUI');
                return;
            };
            window.getSelection().getRangeAt(0).deleteContents();
            const span = [...curEl.childNodes].find((child) => child.nodeName == 'SPAN');
            if (span) {
                const textContent = span.textContent;
                span.replaceWith(textContent);
            };

            const prevImgEl = e.currentTarget.parentNode.parentNode;

            if (e.currentTarget.parentNode.dataset.style != 'inline') {
                curEl.before(e.currentTarget.parentNode);
            } else {
                window.getSelection().getRangeAt(0).insertNode(e.currentTarget.parentNode);
            };

            if (prevImgEl != this.prevImgEl) {
                if (prevImgEl.childNodes?.length) {
                    this.prevImgEl.append(...prevImgEl.childNodes);
                };
                prevImgEl.remove();
            } else if ((prevImgEl.tagName != 'SECTION') && (prevImgEl.tagName != 'DIV') && (prevImgEl.tagName != 'UL')&&(prevImgEl.tagName != 'OL')) {
                prevImgEl.textContent = prevImgEl.textContent;
            };

            e.currentTarget.parentNode.classList.remove('hiddenUI');
            this.setCaretPos(e.currentTarget.parentNode);
            this.saveSel();
        });
    }

    addLink = () => {
        const layer = document.createElement('div');
        layer.classList.add('layer');

        const popup = document.createElement('div');
        popup.classList.add('popup');

        const closeBtn = document.createElement('img');
        closeBtn.src = "../img/icons/close.png";
        closeBtn.classList.add('popup_close');

        const heading = document.createElement('h2');
        heading.textContent = '?????????????? ?????????? ????????????';

        const form = document.createElement('form');
        form.classList.add('normal');

        const inputWrap = document.createElement('div');
        inputWrap.classList.add('checkout__inputWrap');

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.placeholder = 'url';
        urlInput.setAttribute('required', 'true');
        urlInput.classList.add('checkout__inputWrap__input');

        inputWrap.appendChild(urlInput);

        const submitWrap = document.createElement('div');
        submitWrap.classList.add('checkout__btnWrap', 'btn--accent');

        const submit = document.createElement('input');
        submit.type = 'submit';
        submit.value = '????????????????';
        submit.classList.add('btn--checkout');

        submitWrap.appendChild(submit);

        form.append(inputWrap, submitWrap);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = urlInput.value;
            this.restoreSel();
            document.execCommand('CreateLink', false, url);
            layer.remove();
        });
        popup.append(closeBtn, heading, form);
        layer.append(popup);
        [layer, closeBtn].forEach((el) => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if ((e.target != closeBtn) && (e.target.closest('.popup'))) {
                    return;
                };
                layer.remove();
            });
        });
        document.body.appendChild(layer);
    }

    addMargin = () => {
        const curNode = this.getCurrentNode();
        if (curNode.style.marginTop) {
            curNode.style.marginTop = '';
            return;
        };
        curNode.style.marginTop = "20px";
    }

    handleBlockTypes = ({ node = '', innerText }) => {
        const elem = document.createElement(this.selector);
        let p, btns;
        const content = innerText ? innerText : "<br>";

        switch (this.selector) {
            case "section":
            case "div":
                p = document.createElement('p');
                p.innerHTML = `${content}`;
                elem.appendChild(p);

                if (this.selector == 'div') {
                    btns = this.getWidgetBtns();
                    elem.append(...btns);
                };
                break;

            default:
                elem.innerHTML = `${content}`;
                break;
        };

        if (this.selector == 'section') {
            if (node) {
                if (node.parentNode.childElementCount == 1) {
                    const p = document.createElement('p');
                    p.innerHTML = "<br>";
                    node.parentNode.replaceChild(p, node)
                } else {
                    node.remove();
                }
            }
            this.editable.appendChild(elem);
        } else if (!node) {
            this.restoreSel();
            const currentNode = this.getCurrentNode();
            let prevSibling = currentNode.closest(this.selector);
            if (!prevSibling || prevSibling.classList.contains('admin__CM__editableItem__content')) {
                prevSibling = currentNode;
            };
            prevSibling.after(elem);
        } else {
            node.parentNode.replaceChild(elem, node);
        };

        this.setCaretPos(p || elem);
    }

    setCaretPos = (node) => {
        const range = document.createRange();
        const selection = window.getSelection();
        let child, length;
        try {
            child = node.firstChild || node;
            length = child.textContent ? child.textContent.length : 0;
        } catch (error) {
            console.log(child);
            console.log(node);
        };


        if (length && child.nodeType != 3) {
            function findTextNode(el) {
                if (el.nodeType == 3) {
                    return el;
                } else {
                    const elWithText = [...el.childNodes].find((child) => child.textContent);
                    return findTextNode(elWithText);
                }
            };
            const textChild = findTextNode(child);
            if (textChild) {
                child = textChild;
                length = child.textContent.length;
            } else {
                length = 0;
            };
        };

        let img = node.nodeType == 3 ? null : node.querySelector('.imgWrap');
        let index;
        if (img) {
            index = [...node.childNodes].findIndex(el => el == img);
            if (index == -1) {
                node = img.parentNode;
                index = [...node.childNodes].findIndex(el => el == img);
            };
            child = node.childNodes[index - 1] ? node.childNodes[index - 1] : node.childNodes[index];
            length = child.textContent ? child.textContent.length : 0;
        };
        try {
            range.setStart(child, length);
        } catch (error) {
            console.log(`error: ${error}, index: ${index}, child: ${child.outerHTML}, node: ${node.outerHTML},`)
        };
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        this.editable.focus();
        this.saveSel();
    }

    getWidgetBtns = () => {
        const addBeforeBtn = document.createElement('div');
        addBeforeBtn.classList.add('add-before', 'widget', 'fa-solid', 'fa-circle-plus');
        addBeforeBtn.dataset.type = 'before';
        const addAfterBtn = document.createElement('div');
        addAfterBtn.classList.add('add-after', 'widget', 'fa-solid', 'fa-circle-plus');
        addAfterBtn.dataset.type = 'after';

        [addBeforeBtn, addAfterBtn].forEach((btn) => {
            btn.addEventListener('click', this.widgetInsertParagraph);
        });
        return [addBeforeBtn, addAfterBtn];
    }

    widgetInsertParagraph = (e) => {
        e.stopPropagation();
        const type = e.currentTarget.dataset.type;
        let div = e.currentTarget.parentNode;
        if ((div.parentNode.tagName != 'DIV') && (div.parentNode.tagName != 'SECTION') && (div.parentNode.tagName != 'UL') && (div.parentNode.tagName != 'OL')) {
            div = div.parentNode;
        };
        let p = (div.closest('li') || div.closest('ul') || div.closest('ol'))&&(div.classList?.contains('imgWrap')) ? document.createElement('li') : document.createElement('p');
        p.innerHTML = '<br>';
        const ulBtn = this.toolbar.querySelector('[data-command="insertUnorderedList"]');
        const olBtn = this.toolbar.querySelector('[data-command="insertOrderedList"]');
        [ulBtn, olBtn].forEach(btn => btn.classList?.remove('active'));
        div[type](p);
        this.setCaretPos(p);
    }

    getWidgetResizer = () => {

        const btnEl = document.createElement('div');
        btnEl.classList.add('widget', 'resize-btn', 'fa-solid', 'fa-up-right-and-down-left-from-center');

        btnEl.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            const img = e.currentTarget.closest('.imgWrap');
            const imgParent = img.parentNode;

            const left = e.clientX;
            const imgX = img.getBoundingClientRect().left;
            const diffX = left - imgX;
            const imgWidth = img.getBoundingClientRect().width;

            img.classList.add('active');

            function resize(e) {
                const left = e.clientX;
                const resizeX = -1 * (imgX - (left - diffX));
                const width = imgWidth + resizeX > 50 ? imgWidth + resizeX : 50;
                let widthPercent = ((width) / imgParent.clientWidth) * 100;
                widthPercent = widthPercent > 100 ? 100 : widthPercent;
                img.style.width = widthPercent + '%';
            };

            document.addEventListener('pointermove', resize);
            function endResize() {
                document.removeEventListener('pointermove', resize);
                img.classList.remove('active');
                document.removeEventListener('pointerup', endResize);
            };
            document.addEventListener('pointerup', endResize);
        });

        return btnEl;
    }

    getWidgetImgStylesBtns = () => {
        const wrap = document.createElement('div');
        wrap.classList.add('widget', 'widget-style', 'd-flex');

        const styleBtn = document.createElement('div');
        styleBtn.classList.add('styleBtn', 'd-flex--col', 'widget');

        let fakeimg, fakeLine, fakeFlexContainer;
        fakeimg = document.createElement('div');
        fakeLine = document.createElement('div');
        fakeFlexContainer = document.createElement('div');

        fakeimg.classList.add('widgetFakeImg', 'widget');
        fakeLine.classList.add('widgetFakeLine', 'widget');
        fakeFlexContainer.classList.add('widgetFakeFlex', 'd-flex', 'widget');

        const btns = ['inline', 'block', 'left', 'right'].map((type) => {
            const btn = styleBtn.cloneNode(true);
            btn.dataset.type = type;
            let topLine, lastLine;

            topLine = fakeLine.cloneNode(true);
            lastLine = fakeLine.cloneNode(true);
            const flex = fakeFlexContainer.cloneNode(true);
            flex.classList.add(type);

            switch (type) {
                case 'inline':
                    flex.append(fakeimg.cloneNode(true), fakeLine.cloneNode(true));
                    btn.setAttribute('title', '???????????????? ?? ????????????');
                    break;
                case 'block':
                    flex.append(fakeimg.cloneNode(true));
                    btn.setAttribute('title', '???????????????? ???? ????????????');
                    break;
                case 'left':
                case 'right':
                    let firstLine, secondLine, thirdLine
                    firstLine = fakeLine.cloneNode(true);
                    secondLine = fakeLine.cloneNode(true);
                    thirdLine = fakeLine.cloneNode(true);
                    const linesWrap = document.createElement('div');
                    linesWrap.classList.add('linesWrap', 'd-flex--col', 'widget');
                    linesWrap.append(firstLine, secondLine, thirdLine);
                    flex.append(linesWrap, fakeimg.cloneNode(true));
                    btn.setAttribute('title', '???????????????? ??????????');
                    break;
                default:
                    break;
            }
            btn.append(topLine, flex, lastLine);
            return btn;
        });

        wrap.append(...btns);

        btns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                let img = e.currentTarget.closest('.imgWrap');
                this.setCaretPos(img);
                if (e.currentTarget.dataset.type != img.dataset.style) {
                    if ((img.dataset.style == 'inline') || (e.currentTarget.dataset.type == 'inline')) {
                        let imgWrap = (e.currentTarget.dataset.type == 'inline') ? document.createElement('span') : document.createElement('figure');
                        imgWrap.classList.add('imgWrap');
                        imgWrap.append(...img.children);
                        imgWrap.setAttribute('contenteditable', 'false');
                        const parent = img.closest('p') || img.closest('li') || img.closest('h1') || img.closest('h2') || img.closest('h3');
                        if (parent && (parent.tagName != 'DIV') && (parent.tagName != 'SECTION')) {
                            if (parent.textContent.trim() == '') {
                                parent.replaceWith(imgWrap);
                            } else {
                                parent.before(imgWrap);
                            };
                            img.remove();
                        } else {
                            img.replaceWith(imgWrap);
                        };
                        img = imgWrap;
                        this.setCaretPos(img);
                    };
                    if ((e.currentTarget.dataset.type == 'left') || (e.currentTarget.dataset.type == 'right')) {
                        const parent = img.parentNode;
                        parent.classList.add('imageFloat', 'clearfix');
                    } else {
                        if (img.parentNode.classList?.contains('imageFloat')) {
                            img.parentNode.classList.remove('imageFloat');
                        };
                        if (img.parentNode.classList?.contains('clearfix')) {
                            img.parentNode.classList.remove('clearfix');
                        };
                    };
                };
                img.dataset.style = e.currentTarget.dataset.type;
                img.classList.add('active');
                this.editable.addEventListener('click', this.removeActiveClass);
            });
        });

        return wrap;
    }
}
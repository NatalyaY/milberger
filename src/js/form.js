'use strict';

export class Form {
    /**
     * This function is a constructor that takes a form container as an argument and then adds event
     * listeners to the form's inputs and buttons.
     * @param formContainer - the container of the form
     */
    constructor(formContainer) {
        this.formContainer = formContainer;
        this.form = this.formContainer.querySelector("form");
        this.formSubmitBtn = this.form.querySelector('input[type="submit"]');
        this.requiredInputs = {};
        if (this.form.querySelector('fieldset')) {
            this.fieldsetNextBtn = this.formContainer.querySelector('.btn--next');
            this.fieldsets = this.form.querySelectorAll('fieldset');
            this.requiredInputs = [...this.fieldsets].reduce((acc, fieldset) => {
                acc[fieldset.dataset.name] = [...fieldset.querySelectorAll('input[required]')];
                return acc;
            }, this.requiredInputs);
        } else {
            this.requiredInputs['main'] = [...this.form.querySelectorAll('input[required]')]
        };
        this.emptyRequiredInputs = [];

        Object.values(this.requiredInputs).forEach((inputs) => {
            inputs.forEach((input) => {
                input.addEventListener('change', this.watchInput);
                if (input.dataset.mask) {
                    input.addEventListener('focus', this.watchMaskedInput);
                    input.addEventListener('input', this.watchMaskedInput);
                    input.addEventListener('blur', this.watchInput);

                };
            });
        });

        [this.formSubmitBtn, this.fieldsetNextBtn].forEach((btn) => {
            if (btn) btn.addEventListener('click', this.validateOnSubmit);
        });
    }

    /* A function that is called when the input is changed. It checks if the input is empty and if it
    is, it adds a class to it. */
    watchInput = (e) => {
        let value = e.target.value;

        if (((e.target.type == 'checkbox') || (e.target.type == 'radio')) && (!e.target.checked)) {
            value = '';
        } else if (e.target.dataset.mask && (e.target.dataset.mask.length != e.target.value.length)) {
            value = '';
            e.target.value = '';
        };

        const requiredInputs = this.getRequiredInputs();
        const allInputsWithSameName = requiredInputs.filter(input => input.name == e.target.name);

        allInputsWithSameName.forEach((input) => {
            if (value != '') {
                input.dataset.notEmpty = 1;
                this.removeInvalidClasses(input);
            } else {
                input.dataset.notEmpty = '';
                if (this.emptyRequiredInputs.includes(input)) this.setInvalidClasses(input);
            }
        });
    }

    watchMaskedInput = (e) => {
        const input = e.target;
        const mask = input.dataset.mask;
        const maskFirstEditable = mask.indexOf("_");
        const inputValueDigits = input.value.slice(maskFirstEditable).match(/\d/g) || [];
        let selectionStart = input.selectionStart;
        let selectionEnd = input.selectionEnd;

        if (!inputValueDigits.length) {
            input.value = mask.slice(0, maskFirstEditable);
            return;
        };

        const maskedValue = inputValueDigits.reduce((mask, value) => {
            return mask.replace('_', value);
        }, mask);

        const lastDigit = inputValueDigits[inputValueDigits.length - 1];
        input.value = maskedValue.slice(0, maskedValue.lastIndexOf(lastDigit) + 1);

        setSelection();

        function setSelection() {
            if (input.selectionEnd != selectionEnd) {
                while (input.selectionEnd != selectionEnd) {
                    if (!/\d|s/.test(input.value[selectionEnd - 1])) {
                        if (input.selectionEnd < selectionEnd) {
                            selectionEnd--;
                            selectionStart--;
                        } else {
                            selectionEnd++;
                            selectionStart++;
                        };
                    } else {
                        input.selectionEnd = selectionEnd;
                        input.selectionStart = selectionStart;
                        return;
                    };
                };
            };
            input.selectionEnd = selectionEnd;
            input.selectionStart = selectionStart;
        }
    }

    /* A function that returns an array of required inputs. It is used in the `validateOnSubmit`
    function. */
    getRequiredInputs = () => {
        const name = this.fieldsets ? this.form.querySelector('fieldset[data-position="current"]').dataset.name : 'main';
        return this.requiredInputs[name];
    }

    setInvalidClasses = (input) => {
        input.classList.add("invalid");
    }

    removeInvalidClasses = (input) => {
        input.classList.remove("invalid");
    }

    /* A function that is called when the form is submitted. It checks if there are any empty required
    inputs and if there are, it prevents the form from being submitted. */
    validateOnSubmit = (e) => {
        const requiredInputs = this.getRequiredInputs();
        this.emptyRequiredInputs = requiredInputs.filter((input) => {
            if (!input.dataset.notEmpty) {
                this.setInvalidClasses(input);
                return input;
            };
        });
        if (this.emptyRequiredInputs.length) {
            e.stopImmediatePropagation();
            e.preventDefault();
        };
    }
}
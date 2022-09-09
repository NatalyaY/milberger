export class Range {
    constructor(selector) {
        this.rangeContainer = document.querySelector(`${selector}`);
        this.range = this.rangeContainer.querySelector('input[type="range"]');
        this.valueContainer = this.rangeContainer.querySelector('.range__value');
        this.inputToAddMinValue = this.rangeContainer.querySelector('.js-range__min');
        this.inputToAddMaxValue = this.rangeContainer.querySelector('.js-range__max');
        this.inputToAddValue = this.valueContainer.querySelector('.js-range__value');
        this.value = parseInt(this.range.value);
        this.maxValue = parseInt(this.range.max);
        this.minValue = parseInt(this.range.min);
        this.setInitialState();
        this.setEventListeners();
    }

    setInitialState() {
        this.inputToAddMaxValue.innerText = this.maxValue;
        this.inputToAddMinValue.innerText = this.minValue;
        this.inputToAddValue.innerText = this.value;
        this.shiftRangeValueInput();
    }

    setEventListeners() {
        this.range.addEventListener('input', (e) => {
            this.inputToAddValue.innerText = e.target.value;
            this.shiftRangeValueInput();
        });
    }

    shiftRangeValueInput() {
        this.value = this.range.value;
        let diff = ((this.value - this.minValue) / (this.maxValue - this.minValue)) * 100;
        const shift = (diff / 100) * 36 - 36 / 2;
        let left = `calc(${diff}% - ${shift}px)`;

        this.valueContainer.style.left = left;
    }
}
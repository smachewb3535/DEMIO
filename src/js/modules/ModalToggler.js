import {
    Observe
} from "./_/observe";
import {
    Modal
} from "./Modal";
import {
    html
} from '@/utils/environment';

const CLASS = {
    OPEN: `has-modal-open`,
}

export class ModalToggler extends Observe {
    constructor(element) {
        super(element);

        element.onclick = () => this.openModal();
        this.modal = new Modal(document.querySelector('.modal-w'));
    }

    init() {}

    openModal() {
        if (!html.classList.contains(CLASS.OPEN)) {
            this.modal.open();
        }

    }
}
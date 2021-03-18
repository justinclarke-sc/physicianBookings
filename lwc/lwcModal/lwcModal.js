import { LightningElement, api } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { isEmpty } from 'c/lwcUtils';

// css class to remove from slots that have been filled in
const CSS_CLASS = 'modal-hidden';

export default class lwcModal extends LightningElement {

    // constructors/lifecycle callbacks

        // constructor() {
            // super();
            // console.log('lwcModal.constructor: called');
        // }
    
        // for methods that need to run after public variables have been instantiated
        // connectedCallback() {

            // console.log('lwcModal.connectedCallback: start');

            // console.log('lwcModal.connectedCallback: end');
        // }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('lwcModal.renderedCallback: start');

            // console.log('lwcModal.renderedCallback: end');
        // }
    
    // public variables


    // public methods

        // tracked variable on whether to display the modal
        showModal = false;

        // display the modal
        @api show() {
            // console.log('lwcModal.show: start');
            this.showModal = true;
        }

        // hide the modal
        @api hide() {
            // console.log('lwcModal.hide: start');
            this.showModal = false;
        }

    // private variables/getters/handlers

        // if a tagline is provided, show it
        handleSlotTaglineChange() {
            // console.log('lwcModal.handleSlotTaglineChange: start');
            this.makeElementVisible('.tagline');
        }

        // if a footer is provided, show it
        handleSlotContentChange() {
            // console.log('lwcModal.handleSlotContentChange: start');
            this.makeElementVisible('.content');
        }

        // if a footer is provided, show it
        handleSlotFooterChange() {
            // console.log('lwcModal.handleSlotFooterChange: start');
            this.makeElementVisible('footer');
        }

    // button handlers

        // if the close button is clicked, notify the parent
        handleClose() {
            // console.log('lwcModal.handleClose: start');
            //Let parent know that dialog is closed (mainly by that cross button) so it can set proper variables if needed
            this.dispatchEvent(new CustomEvent(
                'closedialog',
                {
                    detail : null
                }
            ));
            this.hide();
        }

    // helper methods

        // finds the element matching the provied selector and makes it visible, by removing the CSS class that was hiding it
        makeElementVisible(selector) {
            // console.log('lwcModal.makeElementVisible: start');
            // console.log('lwcModal.makeElementVisible: selector: ' + selector);
            const element = this.template.querySelector(selector);
            if (!isEmpty(element)) {
                // console.log('lwcModal.makeElementVisible: removing class that makes it');
                element.classList.remove(CSS_CLASS);
            }
        }

}
import { LightningElement, api, wire } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { errorMessage, isEmpty, toastSuccess, toastError, toastInfo, toastWarning } from 'c/lwcUtils';

export default class bookTimeLabel extends LightningElement {

    // constructors/lifecycle callbacks

        // constructor() {
            // super();
            // console.log('bookTimeLabel.constructor: called');
        // }
    
        // for methods that need to run after public variables have been instantiated
        // connectedCallback() {

            // console.log('bookTimeLabel.connectedCallback: start');

            // console.log('bookTimeLabel.connectedCallback: end');
        // }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('bookTimeLabel.renderedCallback: start');

            // console.log('bookTimeLabel.renderedCallback: end');
        // }
    
    // public variables

        // the date/time of the time slot
        @api timeSlotDateTime;

    // public methods



    // private variables/getters/handlers

        // return a label for this time slot
        get timeLabel() {

            // console.log('bookTimeLabel.timeLabel: timeSlotDateTime: ' + JSON.stringify(this.timeSlotDateTime));
            // console.log('bookTimeLabel.timeLabel: timeSlotDateTime: ' + this.timeSlotDateTime);

            // get time
            let hours = this.timeSlotDateTime.getHours();
            let minutes = this.timeSlotDateTime.getMinutes();
            // console.log('bookTimeLabel.timeLabel: hours: ' + hours);
            // console.log('bookTimeLabel.timeLabel: minutes: ' + minutes);

            let ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            
            let timeLabel = hours + ':' + minutes + ' ' + ampm;
            // console.log('bookTimeLabel.timeLabel: timeLabel: ' + timeLabel);

            return timeLabel;
        }

    // button handlers



    // helper methods



}
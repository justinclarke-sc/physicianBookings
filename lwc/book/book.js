import { LightningElement, api, wire } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { errorMessage, isEmpty, toastSuccess, toastError, toastInfo, toastWarning, currentLocalDateTime, dateFromDateTime } from 'c/lwcUtils';

// apex methods
import getSpecialties from '@salesforce/apex/BookController.getSpecialties';

export default class book extends LightningElement {

    // constructors/lifecycle callbacks

        constructor() {
            super();
            // console.log('book.constructor: called');
        }
    
        // for methods that need to run after public variables have been instantiated
        // connectedCallback() {

            // console.log('book.connectedCallback: start');

            // console.log('book.connectedCallback: end');
        // }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('book.renderedCallback: start');

            // console.log('book.renderedCallback: end');
        // }
    
    // public variables

        // the record id of the page this is embedded on
        @api recordId;

    // public methods



    // private variables/getters/handlers

        // list of specialties to display
        specialtyOptions;
        specialtyData;

        @wire(getSpecialties, {
            recordId: '$recordId'
        }) wiregetSpecialties({error, data}) {
        
            // console.log('book.getSpecialties wire method called');
            
            try {
            
                if (error) {
            
                    // console.log('book.getSpecialties: error: ', JSON.stringify(error));
            
                    toastError(this, 'Error', errorMessage(error));
            
                } else if (data !== undefined && data !== null) {
            
                    // console.log('book.getSpecialties: data: ', JSON.stringify(data));

                    // initialize list of options and records
                    this.specialtyOptions = [];
                    this.specialtyData = [];

                    // add each to the dropdown and records array
                    for (let i = 0; i < data.length; i++) { 
                        this.specialtyOptions.push({ label: data[i].Name, value: data[i].Id});
                        this.specialtyData[data[i].Id] = data[i];
                    }

                }
                
            } catch (error) {
                toastError(this, 'Error', errorMessage(error));
            }
        }

        // the selected specialty
        specialtyId;
        specialtyPrice;
        specialtyName;
        specialtyRecord;

        // when user chooses a specialty, set values and let the calendar know that the specialty has changed
        handleSpecialty(event) {
        
            // console.log('book.handleSpecialty event received');
        
            // var value = event.detail; // for captured events
            var value = event.target.value; // for field values
            // console.log('book.handleSpecialty: value: ', JSON.stringify(value));

            this.specialtyId = value;
            this.specialtyRecord = this.specialtyData[value];

            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
              });

            this.specialtyPrice = formatter.format(parseFloat(this.specialtyRecord.Price__c));
            this.specialtyName = this.specialtyRecord.Name;

            // update specialty which will refresh the physician list and reset the calendar start date
            let element = this.template.querySelector('c-book-calendar');
            if (!isEmpty(element)) {
                // console.log('book.handleSpecialty: element: ', JSON.stringify(element));
                element.refreshSpecialty(this.specialtyId, this.getFirstMonday());
            }
        }

        // get the current Monday of the week (if a weekday) or the next Monday (if a weekend)
        get startDateTime() {
        
            // console.log('book.startDateTime: start');

            return this.getFirstMonday();

        }

    // button handlers



    // helper methods

        // get the current Monday of the week (if a weekday) or the next Monday (if a weekend)
        getFirstMonday() {

            // current date in UTC time
            let utcDateTime = new Date();
            // console.log('book.getFirstMonday: current utcDateTime: ' + JSON.stringify(utcDateTime));
            // console.log('book.getFirstMonday: current utcDateTime: ' + utcDateTime);
            // console.log('book.getFirstMonday: current utcDateTime.getDay(): ' + utcDateTime.getDay());

            // if Saturday/Sunday, increment to get to Monday
            if (utcDateTime.getDay() == 0 || utcDateTime.getDay() == 6) {

                // console.log('book.getFirstMonday: utcDateTime.getDay(): ' + JSON.stringify(utcDateTime.getDay()));

                while (utcDateTime.getDay() != 1) {
                    // increment +1 day
                    // console.log('book.getFirstMonday: incrmenting +1 day');
                    utcDateTime.setDate(utcDateTime.getDate() + 1);
                }

            // if Tues-Fri, decrement to get to Monday
            } else if (utcDateTime.getDay() <= 5) {

                // console.log('book.getFirstMonday: utcDateTime.getDay(): ' + JSON.stringify(utcDateTime.getDay()));

                while (utcDateTime.getDay() != 1) {
                    // increment -1 day
                    // console.log('book.getFirstMonday: incrmenting -1 day');
                    utcDateTime.setDate(utcDateTime.getDate() - 1);
                }

            }
            // console.log('book.getFirstMonday: monday utcDateTime: ' + JSON.stringify(utcDateTime));
            // console.log('book.getFirstMonday: monday utcDateTime: ' + utcDateTime);
            // console.log('book.getFirstMonday: monday utcDateTime.getDay(): ' + utcDateTime.getDay());

            // change to 9:00AM local time
            let year = utcDateTime.getFullYear();
            let monthIndex = utcDateTime.getMonth();
            let day = utcDateTime.getDate();
            // console.log('book.getFirstMonday: monday year: ' + year);
            // console.log('book.getFirstMonday: monday monthIndex: ' + monthIndex);
            // console.log('book.getFirstMonday: monday day: ' + day);

            let getFirstMonday = new Date(year, monthIndex, day, 9, 0, 0);
            // console.log('book.startDate: monday getFirstMonday: ' + JSON.stringify(getFirstMonday));
            // console.log('book.startDate: monday getFirstMonday: ' + getFirstMonday);

            return getFirstMonday;
        }

}
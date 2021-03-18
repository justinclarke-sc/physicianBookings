import { LightningElement, api, wire } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { errorMessage, isEmpty, toastSuccess, toastError, toastInfo, toastWarning } from 'c/lwcUtils';

// apex methods
import getPhysiciansList from '@salesforce/apex/BookController.getPhysiciansList';

// define the columns for the lightning data table
const DATABLE_COLUMNS = [
    { label: 'Name', fieldName: 'Full_Name__c' },
    { label: 'Booked', fieldName: 'Booked_Colour__c', type:'colorBox', fixedWidth: 100 },
    { label: 'Busy', fieldName: 'Busy_Colour__c', type:'colorBox', typeAttributes: { alternate: true }, fixedWidth: 100 },
    { label: 'Calendar Access', fieldName: 'Has_GAPI_Access_Token__c', type: 'boolean', cellAttributes: { alignment: 'center' } }
];

export default class bookPhysicianList extends LightningElement {

    // constructors/lifecycle callbacks

        // constructor() {
            // super();
            // console.log('bookPhysicianList.constructor: called');
        // }
    
        // for methods that need to run after public variables have been instantiated
        // connectedCallback() {

            // console.log('bookPhysicianList.connectedCallback: start');

            // console.log('bookPhysicianList.connectedCallback: end');
        // }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('bookPhysicianList.renderedCallback: start');

            // console.log('bookPhysicianList.renderedCallback: end');
        // }
    
    // public variables

        // the record id of the specialty that has been selected
        @api specialtyId;

    // public methods



    // private variables/getters/handlers

        get hasPhysicians() {
            return !isEmpty(this.physicians);
        }
        
        // list of physicians to display
        physicians;
        columns = DATABLE_COLUMNS;

        @wire(getPhysiciansList, {
            specialtyId: '$specialtyId'
        }) wiregetPhysiciansList({error, data}) {
        
            // console.log('bookPhysiciansList.getPhysiciansList wire method called');
            
            try {
            
                if (error) {
            
                    // console.log('bookPhysiciansList.getPhysiciansList: error: ', JSON.stringify(error));
            
                    toastError(this, 'Error', errorMessage(error));
            
                } else if (data !== undefined && data !== null) {
            
                    // console.log('bookPhysiciansList.getPhysiciansList: data: ', JSON.stringify(data));

                    // initialize list of options and records
                    this.physicians = [];

                    // add each to the dropdown and records array
                    for (let i = 0; i < data.length; i++) { 

                        // clone record so we can edit it
                        let physician = Object.assign({}, data[i]);

                        // append booked/busy colour together for the colorbox
                        physician.Busy_Colour__c = physician.Booked_Colour__c + '|' + physician.Busy_Colour__c;

                        // add to list
                        this.physicians.push(physician);
                    }
                    
                }
                
            } catch (error) {
                toastError(this, 'Error', errorMessage(error));
            }
        }

    // button handlers



    // helper methods



}
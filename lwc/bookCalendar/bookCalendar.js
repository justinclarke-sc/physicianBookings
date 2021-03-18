import { LightningElement, api, wire } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { errorMessage, isEmpty, toastSuccess, toastError, toastInfo, toastWarning, utcDateFromString } from 'c/lwcUtils';

// apex methods
import getPhysiciansList from '@salesforce/apex/BookController.getPhysiciansList';
import getAppointments from '@salesforce/apex/BookController.getAppointments';
import getGoogleEvents from '@salesforce/apex/BookController.getGoogleEvents';
import createAppointment from '@salesforce/apex/BookController.createAppointment';

// navigation methods
import { NavigationMixin } from 'lightning/navigation';

// the number of time slots to display
const NUM_TIME_SLOTS = 16;

// the number of days to display
const NUM_DAYS_TO_DISPLAY = 5;

const DURATION = 30;

export default class bookCalendar extends NavigationMixin(LightningElement) {

    // constructors/lifecycle callbacks

        constructor() {
            super();
            // console.log('bookCalendar.constructor: called');
        }
    
        // for methods that need to run after public variables have been instantiated
        connectedCallback() {

            // console.log('bookCalendar.connectedCallback: start');

            // console.log('bookCalendar.connectedCallback: specialtyId: ' + this.specialtyId);

            // set the dates and headers
            this.refreshDates();
            this.refreshHeaders();
            this.refreshTimeSlots();

            // refresh the calendar data
            this.refreshData();

            // console.log('bookCalendar.connectedCallback: end');
        }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('bookCalendar.renderedCallback: start');

            // console.log('bookCalendar.renderedCallback: end');
        // }
    
    // public variables

        // the record we are booking for
        @api patientId;

        // the specialty that has been selected
        @api specialtyId;
        @api specialtyName;

        // the starting date/time for the week
        @api startDateTime;

    // public methods

        // method for updating specialtyid when it changes
        // and reset the calendar to the startdatetime and refresh the data
        @api refreshSpecialty(specialtyId, startDateTime) {
            
            // console.log('bookCalendar.refreshSpecialty start');
            // console.log('bookCalendar.refreshSpecialty specialtyId: ' + specialtyId);
            // console.log('bookCalendar.refreshSpecialty startDateTime: ' + startDateTime);

            this.specialtyId = specialtyId;
            this.startDateTime = startDateTime;

            // refresh dates
            this.refreshDates();
            // console.log('bookCalendar.handlePreviousWeek: dates: ', JSON.stringify(this.dates));

            // refresh headers
            this.refreshHeaders();
            // console.log('bookCalendar.handlePreviousWeek: headers: ', JSON.stringify(this.headers));

            // refresh headers
            this.refreshTimeSlots();
            // console.log('bookCalendar.handlePreviousWeek: timeSlots: ', JSON.stringify(this.timeSlots));

            // refresh the calendar data
            this.refreshData();
        }

    // private variables/getters/handlers

        // the date/time time slots for each row (the start of the time slot)
        timeSlots;

        refreshTimeSlots() {
            // console.log('bookCalendar.refreshTimeSlots start');

            // console.log('bookCalendar.refreshTimeSlots: startDateTime: ' + JSON.stringify(this.startDateTime));
            // console.log('bookCalendar.refreshTimeSlots: startDateTime: ' + this.startDateTime);

            this.timeSlots = [];

            let timeSlotDateTime = new Date(this.startDateTime);
            
            for (let i = 0; i < NUM_TIME_SLOTS; i++) {

                // console.log('bookCalendar.refreshTimeSlots: timeSlotDateTime: ' + JSON.stringify(timeSlotDateTime));
                // console.log('bookCalendar.refreshTimeSlots: timeSlotDateTime: ' + timeSlotDateTime);

                let tempDateTime = new Date(timeSlotDateTime);

                // add to list
                this.timeSlots.push(tempDateTime);

                // increment DURATION minutes
                timeSlotDateTime.setTime(timeSlotDateTime.getTime() + ((DURATION / 60) * 60 * 60 * 1000));
            }

            // console.log('bookCalendar.refreshTimeSlots: timeSlots: ' + JSON.stringify(this.timeSlots));

        }

        // the list of dates to display in each column
        dates;

        refreshDates() {

            // console.log('bookCalendar.refreshDates: start');
            
            // console.log('bookCalendar.refreshDates: startDateTime: ' + JSON.stringify(this.startDateTime));

            this.dates = [];
            
            // get the start date
            let currentDate = new Date(this.startDateTime);

            // loop through each day to display on the calendar
            for (let i = 0; i < NUM_DAYS_TO_DISPLAY; i++) {

                // convert to a local memory object
                let dateTemp = new Date(currentDate);
                // console.log('bookCalendar.refreshDates: dateTemp: ' + JSON.stringify(dateTemp));

                // add to array
                this.dates.push(dateTemp);

                // increment the date by 1 day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // console.log('bookCalendar.refreshDates: dates: ', this.dates);
        }

        // the column headers for each date to display
        headers;

        refreshHeaders() {

            // console.log('bookCalendar.refreshHeaders: start');

            this.headers = [];
            
            // options for date formatting
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };

            let dates = this.dates;
            // console.log('bookCalendar.refreshHeaders: dates: ' + JSON.stringify(dates));

            for (let i = 0; i < NUM_DAYS_TO_DISPLAY; i++) {

                let currentDate = dates[i];
                // console.log('bookCalendar.refreshHeaders: currentDate: ', JSON.stringify(currentDate));

                let headerString = currentDate.toLocaleDateString('en-US', options);
                // console.log('bookCalendar.refreshHeaders: headerString: ', headerString);

                this.headers.push(headerString);
            }

            // console.log('bookCalendar.refreshHeaders: headers: ', this.headers);
        }

        // show the calendar once the appointments/google events have been loaded
        get showCalendar() {
            return !isEmpty(this.dates) && !isEmpty(this.headers) && !isEmpty(this.physicians) && this.physiciansLoaded && this.appointmentsLoaded && this.googleEventsLoaded;
        }

        // get the name of the selected physician
        get selectedPhysicianName() {

            let result = null;

            if (!isEmpty(this.selectedPhysicianId)) {
                if (!isEmpty(this.physicians)) {
                    for (let i = 0; i < this.physicians.length; i++) {
                        let physician = this.physicians[i];
                        if (this.selectedPhysicianId == physician.Id) {
                            result = physician.Full_Name__c;
                        }
                    }
                }
            }

            return result;
        }

        // get the formatted version of the selected appointment date/time
        get formattedSelectedDateTime() {
            // options for date formatting
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour12 : true, hour: "2-digit", minute: "2-digit", timeZone: 'America/Toronto' };

            let dateTime;

            if (!isEmpty(this.selectedDateTime)) {
                dateTime = this.selectedDateTime.toLocaleString('en-US', options);
            }
            
            return dateTime;
        }

    // button handlers

        // the physician that was preselected for the booking form
        selectedPhysicianId;

        // the date/time that was preselected for the booking form
        selectedDateTime;

        handleNewAppointment(event) {
        
            // console.log('bookCalendar.handleNewAppointment event received');
        
            var settings = event.detail; // for captured events
            // console.log('bookCalendar.handleNewAppointment: settings: ', JSON.stringify(settings));

            this.selectedPhysicianId = settings.physicianId;
            // console.log('bookCalendar.handleNewAppointment: selectedPhysicianId: ', JSON.stringify(this.selectedPhysicianId));

            this.selectedDateTime = settings.dateTime;
            // console.log('bookCalendar.handleNewAppointment: selectedDateTime: ', JSON.stringify(this.selectedDateTime));

            // launch modal
            this.template.querySelector('c-lwc-modal.modal').show();
        }

        handleCancel(event) {
        
            // console.log('bookCalendar.handleCancel event received');
        
            // var value = event.detail; // for captured events
            // var value = event.target.value; // for field values
            // console.log('bookCalendar.handleCancel: value: ', JSON.stringify(value));
        
            // hide modal
            this.template.querySelector('c-lwc-modal.modal').hide();
        }

        // when the user clicks save
        handleSave(/*event*/) {

            // console.log('bookCalendar.handleSave event received');

            // console.log('bookCalendar.handleSave: patientId: ', JSON.stringify(this.patientId));
            // console.log('bookCalendar.handleSave: selectedPhysicianId: ', JSON.stringify(this.selectedPhysicianId));
            // console.log('bookCalendar.handleSave: specialtyId: ', JSON.stringify(this.specialtyId));
            // console.log('bookCalendar.handleSave: selectedDateTime: ', JSON.stringify(this.selectedDateTime));

            // convert the date/time to SF format
            let sfDateTime = this.selectedDateTime.toISOString();
            // console.log('bookCalendar.handleSave: sfDateTime: ', JSON.stringify(sfDateTime));

            // hide modal
            this.template.querySelector('c-lwc-modal.modal').hide();

            // call apex method bookCalendar and process result   
            createAppointment({patientId : this.patientId, physicianId : this.selectedPhysicianId, specialtyId : this.specialtyId, apptDateTime : sfDateTime, duration: DURATION})
                .then(newAppointmentString => {
            
                    // console.log('bookCalendar.createAppointment: newAppointmentString: ', JSON.stringify(newAppointmentString));

                    // turn result into json object
                    let newAppointment = JSON.parse(newAppointmentString);
                    // console.log('bookCalendar.createAppointment: newAppointment: ', JSON.stringify(newAppointment));
            
                    // show success toast
                    this.handleSuccess(newAppointment);
                    
                })
                .catch(error => {
            
                    // console.log('bookCalendar.createAppointment: error: ', JSON.stringify(errorMessage(error)));
            
                    // show error toast
                    this.handleError(errorMessage(error));
                });

        }

        // if opportunity is created successfully
        handleSuccess(newAppointment) {
        
            // console.log('bookCalendar.handleSuccess event received');

            // console.log('bookCalendar.handleSuccess: newAppointment: ', JSON.stringify(newAppointment));

            let newAppointmentId = newAppointment.appointmentId;
            // console.log('bookCalendar.handleSuccess: newAppointmentId: ', JSON.stringify(newAppointmentId));

            let googleEventCreated = newAppointment.googleEventCreated;
            // console.log('bookCalendar.handleSuccess: googleEventCreated: ', JSON.stringify(googleEventCreated));

            // refresh appointment data
            this.refreshData();

            // generate a URL to the case
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: newAppointmentId,
                    actionName: 'view',
                },
            }).then(url => {
            
                // console.log('bookCalendar.handleSave: url: ', JSON.stringify(url));

                // define the message data for the toast
                let messageData = [
                    'Salesforce',
                    {
                        url,
                        label: 'New Appointment'
                    }
                ];
                // console.log('bookCalendar.handleSave: messageData: ', JSON.stringify(messageData));

                // show success toast
                if (googleEventCreated == "true") {
                    toastSuccess(this, 'Success!', 'New appointment has been created: {1}', messageData);
                } else {
                    toastWarning(this, 'Warning!', 'New appointment has been created: {1}, but unable to add to Physician\'s calendar. Please ask Physician to re-authorize their calendar.', messageData);
                }

            }).catch(error => {
                this.handleError(errorMessage(error));
            });
        }

        // if opportunity creation has errors
        handleError(error) {
        
            // console.log('bookCalendar.handleError event received');
            // console.log('bookCalendar.handleError: error: ', JSON.stringify(error));
    
            toastError(this, 'Error', error);

        }

    // helper methods

        handleRefresh(event) {
        
            // console.log('className.handleRefresh event received');
        
            // var value = event.detail; // for captured events
            // var value = event.target.value; // for field values
            // console.log('className.handleRefresh: value: ', JSON.stringify(value));

            try {
                    
                this.refreshData();

            } catch (error) {
                toastError(this, 'Error', errorMessage(error));
            }
        }
    
        // increment to the next week
        handleNextWeek(event) {
        
            // console.log('className.handleNextWeek event received');
        
            // var value = event.detail; // for captured events
            // var value = event.target.value; // for field values
            // console.log('className.handleNextWeek: value: ', JSON.stringify(value));

            try {

                // console.log('bookCalendar.handleNextWeek: startDateTime: ', JSON.stringify(this.startDateTime));

                // change the start date
                this.startDateTime.setDate(this.startDateTime.getDate() + 7);

                // refresh dates
                this.refreshDates();
                // console.log('bookCalendar.handleNextWeek: dates: ', JSON.stringify(this.dates));

                // refresh headers
                this.refreshHeaders();
                // console.log('bookCalendar.handleNextWeek: headers: ', JSON.stringify(this.headers));

                // refresh headers
                this.refreshTimeSlots();
                // console.log('bookCalendar.handleNextWeek: timeSlots: ', JSON.stringify(this.timeSlots));

                // refresh data
                this.refreshData();

            } catch (error) {
                toastError(this, 'Error', errorMessage(error));
            }
        }
    
        // increment to the next week
        handlePreviousWeek(event) {
        
            // console.log('className.handlePreviousWeek event received');
        
            // var value = event.detail; // for captured events
            // var value = event.target.value; // for field values
            // console.log('className.handlePreviousWeek: value: ', JSON.stringify(value));

            try {

                // console.log('bookCalendar.handlePreviousWeek: startDateTime: ', JSON.stringify(this.startDateTime));

                // change the start date
                this.startDateTime.setDate(this.startDateTime.getDate() - 7);

                // refresh dates
                this.refreshDates();
                // console.log('bookCalendar.handlePreviousWeek: dates: ', JSON.stringify(this.dates));

                // refresh headers
                this.refreshHeaders();
                // console.log('bookCalendar.handlePreviousWeek: headers: ', JSON.stringify(this.headers));

                // refresh headers
                this.refreshTimeSlots();
                // console.log('bookCalendar.handlePreviousWeek: timeSlots: ', JSON.stringify(this.timeSlots));

                // refresh physicians list based on specialtyId
                // this will trigger an appointment/google event data refresh
                this.refreshData();

            } catch (error) {
                toastError(this, 'Error', errorMessage(error));
            }
        }

        // helper methods

        // refresh the physicians, appointment, and google calendar data based on the calendar's day and time slots
        refreshData() {

            // console.log('bookCalendar.refreshData: start');
            // console.log('bookCalendar.refreshData: specialtyId: ' + this.specialtyId);
            // console.log('bookCalendar.refreshData: startDateTime: ' + this.startDateTime);

            // clear the data so the calendar disappears while loading
            // these values will be filled after the data is loaded and the calendar will display again
            this.physicians = undefined;
            this.appointments = undefined;
            this.appointmentsLoaded = false;
            this.googleEvents = undefined;
            this.googleEventsLoaded = false;

            // refresh physicians which will also trigger a refresh of appointments/google events
            this.refreshPhysicians();
            
            // not necessary
            // this.refreshAppointments();
            // this.refreshGoogleEvents();

        }

        // stores the Physician__c records that match the specialty
        physicians;

        // indicates whether the results for physicians have been loaded
        physiciansLoaded;

        refreshPhysicians() {

            // console.log('bookCalendar.refreshPhysicians: start');
            // console.log('bookCalendar.refreshPhysicians: this.specialtyId: ', JSON.stringify(this.specialtyId));
            // console.log('bookCalendar.refreshPhysicians: this.startDateTime: ', JSON.stringify(this.startDateTime));

            // initialize list
            this.physicians = [];

            // call apex method getPhysiciansList and process result   
            getPhysiciansList({specialtyId : this.specialtyId})
                .then(result => {
            
                    // console.log('bookCalendar.getPhysiciansList: result: ', JSON.stringify(result));
                    // console.log('bookCalendar.getPhysiciansList: this.startDateTime: ', JSON.stringify(this.startDateTime));
            
                    try {

                        this.physicians = result;

                        // find all the day components and refresh their data
                        // console.log('bookCalendar.getPhysiciansList: Find the elements for each calendar day, if rendered');
                        let elements = this.template.querySelectorAll('c-book-day');
                        // console.log('bookCalendar.getPhysiciansList: elements: ', JSON.stringify(elements));

                        // loop through the elements and refresh their data
                        if (!isEmpty(elements)) {
                            // console.log('bookCalendar.getPhysiciansList: refreshing day elements');
                            elements.forEach(element => {
                                // console.log('bookCalendar.getPhysiciansList: refreshing day: ', JSON.stringify(element));
                                element.refreshPhysicians(this.physicians);
                            });
                        }

                        this.physiciansLoaded = true;

                        // console.log('bookCalendar.getPhysiciansList: this.startDateTime: ', JSON.stringify(this.startDateTime));

                        // now that physicians list has changed, refresh appointments/google events
                        this.refreshAppointments();
                        this.refreshGoogleEvents();

                    } catch (error) {
                        toastError(this, 'Error', errorMessage(error));
                    }
                    
                })
                .catch(error => {
            
                    // console.log('bookCalendar.getPhysiciansList: error: ', JSON.stringify(error));
            
                    toastError(this, 'Error', errorMessage(error));
                });

        }

        // stores the Appointment__c records
        appointments;

        // indicates whether the results for appointments have been loaded
        appointmentsLoaded;

        refreshAppointments() {

            // console.log('bookCalendar.refreshAppointments: start');

            this.refreshDates();
            let startDateTime = new Date(this.dates[0]); // start date
            let endDateTime = new Date(this.dates[this.dates.length - 1]); // end date

            // increment the end date by 1 day to make sure to get all the appointments beyond midnight of the end date
            endDateTime.setDate(endDateTime.getDate() + 1);

            // console.log('bookCalendar.refreshAppointments: startDateTime: ', JSON.stringify(startDateTime));
            // console.log('bookCalendar.refreshAppointments: startDateTime: ', startDateTime);
            // console.log('bookCalendar.refreshAppointments: endDateTime: ', JSON.stringify(endDateTime));
            // console.log('bookCalendar.refreshAppointments: endDateTime: ', endDateTime);

            // build list of physicians to check
            let physicianIds = [];
            if (!isEmpty(this.physicians)) {
                for (let i = 0; i < this.physicians.length; i++) {
                    let p = this.physicians[i];
                    physicianIds.push(p.Id);
                }
            }
            // console.log('bookCalendar.refreshAppointments: physicianIds: ', physicianIds);

            // initialize list
            this.appointments = [];

            // call apex method getAppointments and process result   
            getAppointments({physicianIds : physicianIds, startDateTime : startDateTime, endDateTime : endDateTime})
                .then(result => {
            
                    // console.log('bookCalendar.getAppointments: result: ', JSON.stringify(result));
            
                    try {

                        // put the appointment data into a keyed array where the physician is the key
                        this.appointments = result;

                        // find all the day components and refresh their data
                        // console.log('bookCalendar.getAppointments: Find the elements for each calendar day, if rendered');
                        let elements = this.template.querySelectorAll('c-book-day');
                        // console.log('bookCalendar.getAppointments: elements: ', JSON.stringify(elements));

                        // loop through the elements and refresh their data
                        if (!isEmpty(elements)) {
                            // console.log('bookCalendar.getAppointments: refreshing day elements');
                            elements.forEach(element => {
                                // console.log('bookCalendar.getAppointments: refreshing day: ', JSON.stringify(element));
                                element.refreshAppointments(this.appointments);
                            });
                        }

                        this.appointmentsLoaded = true;

                    } catch (error) {
                        toastError(this, 'Error', errorMessage(error));
                    }
                    
                })
                .catch(error => {
            
                    // console.log('bookCalendar.getAppointments: error: ', JSON.stringify(error));
            
                    toastError(this, 'Error', errorMessage(error));
                });

        }

        // stores the google calendar event data
        googleEvents;

        // indicates the google calendar event data has been loaded
        googleEventsLoaded;

        refreshGoogleEvents() {

            // console.log('bookCalendar.refreshGoogleEvents: start');
            // console.log('bookCalendar.refreshGoogleEvents: startDateTime: ' + this.startDateTime);

            this.refreshDates();
            let startDateTime = new Date(this.dates[0]); // start date
            let endDateTime = new Date(this.dates[this.dates.length - 1]); // end date

            // increment the end date by 1 day to make sure to get all the google events beyond midnight of the end date
            endDateTime.setDate(endDateTime.getDate() + 1);

            // console.log('bookCalendar.refreshGoogleEvents: startDateTime: ', JSON.stringify(startDateTime));
            // console.log('bookCalendar.refreshGoogleEvents: startDateTime: ', startDateTime);
            // console.log('bookCalendar.refreshGoogleEvents: endDateTime: ', JSON.stringify(endDateTime));
            // console.log('bookCalendar.refreshGoogleEvents: endDateTime: ', endDateTime);

            // build list of physicians to check
            let physicianIds = [];
            if (!isEmpty(this.physicians)) {
                for (let i = 0; i < this.physicians.length; i++) {
                    let p = this.physicians[i];
                    physicianIds.push(p.Id);
                }
            }
            // console.log('bookCalendar.refreshGoogleEvents: physicianIds: ', physicianIds);

            // initialize list
            this.googleEvents = [];

            // call apex method getGoogleEvents and process result   
            getGoogleEvents({physicianIds : physicianIds, startDateTime : startDateTime, endDateTime : endDateTime})
                .then(result => {
            
                    // console.log('bookCalendar.getGoogleEvents: result: ', JSON.stringify(result));
            
                    try {

                        this.googleEvents = [];

                        if (!isEmpty(result)) {
                            for (let i = 0; i < result.length; i++) {
                                // console.log('bookCalendar.getGoogleEvents: result[' + i + ']: ' + JSON.stringify(result[i]));

                                let googleEvent = JSON.parse(result[i]);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.id: ', googleEvent.id);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.startTime.datetime_x: ', googleEvent.startTime.datetime_x);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.endTime.datetime_x: ', googleEvent.endTime.datetime_x);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.physicianName: ', googleEvent.physicianName);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.busyColour: ', googleEvent.busyColour);
                                // console.log('bookCalendar.getGoogleEvents: googleEvent.status: ', googleEvent.status);

                                // add to list
                                this.googleEvents.push(googleEvent);
                            }
                        }

                        // find all the day components and refresh their data
                        // console.log('bookCalendar.getGoogleEvents: Find the elements for each calendar day, if rendered');
                        let elements = this.template.querySelectorAll('c-book-day');
                        // console.log('bookCalendar.getGoogleEvents: elements: ', JSON.stringify(elements));

                        // loop through the elements and refresh their data
                        if (!isEmpty(elements)) {
                            // console.log('bookCalendar.getGoogleEvents: refreshing day elements');
                            elements.forEach(element => {
                                // console.log('bookCalendar.getGoogleEvents: refreshing day: ', JSON.stringify(element));
                                element.refreshGoogleEvents(this.googleEvents);
                            });
                        }

                        this.googleEventsLoaded = true;

                    } catch (error) {
                        toastError(this, 'Error', errorMessage(error));
                    }
                    
                })
                .catch(error => {
            
                    // console.log('bookCalendar.getGoogleEvents: error: ', JSON.stringify(error));
            
                    toastError(this, 'Error', errorMessage(error));
                });

        }

}
import { LightningElement, api, wire } from 'lwc';

/* eslint-disable no-console */
/* eslint-disable vars-on-top */

// utility methods
import { errorMessage, isEmpty, toastSuccess, toastError, toastInfo, toastWarning, dateFromDateTime, currentLocalDateTime } from 'c/lwcUtils';

export default class bookDay extends LightningElement {

    // constructors/lifecycle callbacks

        // constructor() {
            // super();
            // console.log('bookDay.constructor: called');
        // }
    
        // for methods that need to run after public variables have been instantiated
        connectedCallback() {

            // console.log('bookDay.connectedCallback: start');
            // console.log('bookDay.connectedCallback: date: ' + JSON.stringify(this.date));
            // console.log('bookDay.connectedCallback: time: ' + JSON.stringify(this.time));
            // console.log('bookDay.connectedCallback: duration: ' + JSON.stringify(this.duration));
            // console.log('bookDay.connectedCallback: appointments: ' + JSON.stringify(this.appointments));
            // console.log('bookDay.connectedCallback: googleEvents: ' + JSON.stringify(this.googleEvents));

            // console.log('bookDay.connectedCallback: end');
        }
    
        // for methods that need to run after other methods have completed
        // runs at the end of the component lifecycle
        // renderedCallback() {

            // console.log('bookDay.renderedCallback: start');

            // console.log('bookDay.renderedCallback: end');
        // }
    
    // public variables

        // the date being displayed
        @api date;

        // the time being displayed
        @api time;

        // the duration (in minutes) of this time slot
        @api duration;

        // the physicians being displayed on the calendar
        @api physicians;

        // appointment data to check if busy
        @api appointments;

        // google events data to check if busy
        @api googleEvents;

    // public methods

        @api refreshAppointments(appointments) {

            // console.log('bookDay.refreshAppointments: start');
            this.appointments = appointments;
            
            // console.log('bookDay.refreshAppointments: this.appointments: ' + JSON.stringify(this.appointments));
        }

        @api refreshGoogleEvents(googleEvents) {

            // console.log('bookDay.refreshGoogleEvents: start');
            this.googleEvents = googleEvents;
            
            // console.log('bookDay.refreshGoogleEvents: this.googleEvents: ' + JSON.stringify(this.googleEvents));
        }

        @api refreshPhysicians(physicians) {

            // console.log('bookDay.refreshPhysicians: start');

            this.physicians = physicians;
            
            // console.log('bookDay.refreshPhysicians: this.physicians: ' + JSON.stringify(this.physicians));
        }

    // private variables/getters/handlers

        // return a printable start date/time
        get startDateTime() {

            // options for date formatting
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour12 : true, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: 'America/Toronto' };

            let dateTime = this.getStartDateTime().toLocaleString('en-US', options);

            return dateTime;
        }

        // combine the provided date and time into the start date/time for this time slot
        getStartDateTime() {
            // console.log('bookDay.getStartDateTime: this.date: ' + JSON.stringify(this.date));
            // console.log('bookDay.getStartDateTime: this.date: ' + this.date);
            // console.log('bookDay.getStartDateTime: this.time: ' + JSON.stringify(this.time));
            // console.log('bookDay.getStartDateTime: this.time: ' + this.time);

            let year = this.date.getFullYear();
            let monthIndex = this.date.getMonth();
            let day = this.date.getDate();
            // console.log('bookDay.getStartDateTime: year: ' + JSON.stringify(year));
            // console.log('bookDay.getStartDateTime: monthIndex: ' + JSON.stringify(monthIndex));
            // console.log('bookDay.getStartDateTime: day: ' + JSON.stringify(day));

            let hours = this.time.getHours();
            let minutes = this.time.getMinutes();
            let seconds = this.time.getSeconds();
            // console.log('bookDay.getStartDateTime: hours: ' + JSON.stringify(hours));
            // console.log('bookDay.getStartDateTime: minutes: ' + JSON.stringify(minutes));
            // console.log('bookDay.getStartDateTime: seconds: ' + JSON.stringify(seconds));

            let dateTime = new Date(year, monthIndex, day, hours, minutes, seconds);
            // console.log('bookDay.getStartDateTime: dateTime: ' + JSON.stringify(dateTime));
            // console.log('bookDay.getStartDateTime: dateTime: ' + dateTime);
            
            return dateTime;
        }

        // return a printable end date/time
        get endDateTime() {

            // options for date formatting
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour12 : true, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: 'America/Toronto' };

            let dateTime = this.getEndDateTime().toLocaleString('en-US', options);

            return dateTime;
        }

        // set the end time for this time slot by adding duration to start datetime
        getEndDateTime() {
            
            let startDateTime = this.getStartDateTime();
            // console.log('bookDay.getEndDateTime: startDateTime: ' + JSON.stringify(startDateTime));
            // console.log('bookDay.getEndDateTime: startDateTime: ' + startDateTime);

            let duration = this.duration;
            // console.log('bookDay.getEndDateTime: duration: ' + duration);

            // increment [duration] minutes
            let endDateTime = new Date(startDateTime);
            endDateTime.setTime(endDateTime.getTime() + ((duration / 60) * 60 * 60 * 1000));
            // console.log('bookDay.getEndDateTime: endDateTime: ' + JSON.stringify(endDateTime));
            // console.log('bookDay.getEndDateTime: endDateTime: ' + endDateTime);

            return endDateTime;

        }

        // allowed to book if date is in the future
        get allowBook() {

            let currentDateTime = currentLocalDateTime();
            // console.log('bookDay.allowBook: ------');
            // console.log('bookDay.allowBook: currentDateTime: ' + JSON.stringify(currentDateTime));
            // console.log('bookDay.allowBook: currentDateTime: ' + (currentDateTime));
            // console.log('bookDay.allowBook: this.getStartDateTime(): ' + JSON.stringify(this.getStartDateTime()));
            // console.log('bookDay.allowBook: this.getStartDateTime(): ' + (this.getStartDateTime()));

            return this.getStartDateTime() > currentDateTime;
        }

        // return the list of physicians to display
        // calculate whether the physician is Booked, Busy, or Available
        // if Booked, show the Booked background colour
        // if Busy, show the Busy background colour
        // if Available, show the Book button
        get physicianList() {

            // console.log('bookDay.physicianList: start');

            // calculate the time slot's start/end time
            let startDateTime = this.getStartDateTime();
            let endDateTime = this.getEndDateTime();

            // console.log('bookDay.physicianList: appointments: ' + this.appointments.length);
            // console.log('bookDay.physicianList: googleEvents: ' + this.googleEvents.length);

            // initialize the list of physicians to return
            let physicians = [];

            if (!isEmpty(this.physicians)) {
                for (let i = 0; i < this.physicians.length; i++) {

                    let physician = this.physicians[i];
                    // console.log('bookDay.physicianList: physician: ' + JSON.stringify(physician));
                    // console.log('bookDay.physicianList: physician.Id: ' + JSON.stringify(physician.Id));
                    // console.log('bookDay.physicianList: physician.Full_Name__c: ' + JSON.stringify(physician.Full_Name__c));
                    // console.log('bookDay.physicianList: physician.Booked_Colour__c: ' + JSON.stringify(physician.Booked_Colour__c));
                    // console.log('bookDay.physicianList: physician.Busy_Colour__c: ' + JSON.stringify(physician.Busy_Colour__c));
                    // console.log('bookDay.physicianList: physician.GAPI_Access_Token__c: ' + JSON.stringify(physician.GAPI_Access_Token__c));

                    // define object to return
                    let physicianObj = {
                        'id' : physician.Id,
                        'physicianName' : physician.Full_Name__c,
                        'status' : 'Available',
                        'showBooked' : false
                    };

                    // check if this physician is booked in this time slot
                    if (!isEmpty(this.appointments)) {

                        // console.log('bookDay.physicianList: checking for matching appointments');

                        for (let i = 0; i < this.appointments.length; i++) {
        
                            let apptData = this.appointments[i];
                            // console.log('bookDay.physicianList: apptData: ' + JSON.stringify(apptData));
                            // console.log('bookDay.physicianList: apptData.Id: ' + JSON.stringify(apptData.Id));
                            // console.log('bookDay.physicianList: apptData.Physician__c: ' + JSON.stringify(apptData.Physician__c));
                            // console.log('bookDay.physicianList: apptData.Physician__r.Full_Name__c: ' + JSON.stringify(apptData.Physician__r.Full_Name__c));
                            // console.log('bookDay.physicianList: apptData.Physician__r.Booked_Colour__c: ' + JSON.stringify(apptData.Physician__r.Booked_Colour__c));
                            // console.log('bookDay.physicianList: apptData.Date_Time__c: ' + JSON.stringify(apptData.Date_Time__c));

                            // if physician matches
                            if (physician.Id == apptData.Physician__c) {

                                // console.log('bookDay.physicianList: physician matches, checking appointment');
            
                                // convert Date/Time to javascript object
                                let apptDateTime = new Date(apptData.Date_Time__c);
                                // console.log('bookDay.physicianList: apptDateTime: ' + JSON.stringify(apptDateTime));
            
                                // if the physician matches AND
                                // check if appointment falls within this time slot
                                if (apptDateTime >= startDateTime && apptDateTime < endDateTime) {
            
                                    // console.log('bookDay.physicianList: appointment falls within time slot, setting status');

                                    // set appointment URL
                                    physicianObj.url = '/' + apptData.Id;

                                    // set status
                                    physicianObj.status = 'Booked';
                                    
                                    // set booked background colour
                                    physicianObj.style = 'background-color: ' + apptData.Physician__r.Booked_Colour__c + ';';
            
                                }

                            }
                            
                            // console.log('bookDay.physicianList: ------ NEXT APPT ------');

                        }
                    }

                    // if physician is still available, check if this physician is busy in google events
                    if (physicianObj.status == 'Available' && !isEmpty(this.googleEvents)) {
                        for (let i = 0; i < this.googleEvents.length; i++) {
        
                            let googleEventData = this.googleEvents[i];
                            // console.log('bookDay.physicianList: googleEventData: ' + JSON.stringify(googleEventData));
                            // console.log('bookDay.physicianList: googleEventData.id: ' + JSON.stringify(googleEventData.id));
                            // console.log('bookDay.physicianList: googleEventData.physicianId: ' + JSON.stringify(googleEventData.physicianId));
                            // console.log('bookDay.physicianList: googleEventData.physicianName: ' + JSON.stringify(googleEventData.physicianName));
                            // console.log('bookDay.physicianList: googleEventData.bookedColour: ' + JSON.stringify(googleEventData.bookedColour));
                            // console.log('bookDay.physicianList: googleEventData.busyColour: ' + JSON.stringify(googleEventData.busyColour));
                            // console.log('bookDay.physicianList: googleEventData.startTime.datetime_x: ' + JSON.stringify(googleEventData.startTime.datetime_x));
                            // console.log('bookDay.physicianList: googleEventData.endTime.datetime_x: ' + JSON.stringify(googleEventData.endTime.datetime_x));
        
                            // if physician matches
                            if (physician.Id == googleEventData.physicianId) {

                                // console.log('bookDay.physicianList: physician matches, checking event');

                                // flag to indicate whether the time slot is a match to the event
                                let matches = false;

                                // all-day event, check if day matches
                                if (!isEmpty(googleEventData.startTime.date_x) || !isEmpty(googleEventData.endTime.date_x)) {

                                    // convert Date/Time to javascript object
                                    let eventStartDate = new Date(googleEventData.startTime.date_x);
                                    // console.log('bookDay.physicianList: googleEventData.eventStartDate: ' + JSON.stringify(eventStartDate));
                
                                    // convert Date/Time to javascript object
                                    let eventEndDate = new Date(googleEventData.endTime.date_x);
                                    // console.log('bookDay.physicianList: googleEventData.eventEndDate: ' + JSON.stringify(eventEndDate));
                                    
                                    // check if event falls within this time slot
                                    if (startDateTime >= eventStartDate && startDateTime < eventEndDate) {
                                        matches = true;
                                    }

                                // not all-day event, check date/time
                                } else {
            
                                    // convert Date/Time to javascript object
                                    let eventStartTime = new Date(googleEventData.startTime.datetime_x);
                                    // console.log('bookDay.physicianList: googleEventData.eventStartTime: ' + JSON.stringify(eventStartTime));
                
                                    // convert Date/Time to javascript object
                                    let eventEndTime = new Date(googleEventData.endTime.datetime_x);
                                    // console.log('bookDay.physicianList: googleEventData.eventEndTime: ' + JSON.stringify(eventEndTime));

                                    // check if event falls within this time slot
                                    if (startDateTime >= eventStartTime && startDateTime < eventEndTime) {
                                        matches = true;
                                    }

                                }

                                if (matches) {
            
                                    // console.log('bookDay.physicianList: event falls within time slot, setting status');

                                    // set status
                                    physicianObj.status = 'Busy';
                                    
                                    // set booked background colour alternating between booked/busy colour
                                    physicianObj.style = 'background: repeating-linear-gradient( 45deg, ' + googleEventData.bookedColour + ', ' + googleEventData.bookedColour + ' 5px, ' + googleEventData.busyColour + ' 5px, ' + googleEventData.busyColour + ' 10px);';

                                }

                            }
                            
                            // console.log('bookDay.physicianList: ------ NEXT EVENT ------');
                        }
                    }

                    // if the time slot is available for this physician, show the booked button
                    if (physicianObj.status == 'Available') {
                        physicianObj.showBooked = true;
                        physicianObj.bookLabel = 'Book ' + physician.Full_Name__c;
                    }

                    // add to list
                    physicians.push(physicianObj);

                    // console.log('bookDay.physicianList: ------ NEXT PHYSICIAN ------');
                }
            }

            // console.log('bookDay.physicianList: physicians.length: ' + JSON.stringify(physicians.length));

            return physicians;
        }

    // button handlers

        handleBook(event) {
        
            // console.log('bookDay.handleBook event received');
        
            // get the physician id from the class name
            let physicianId = event.target.className;
            // console.log('bookDay.handleBook: className: ', event.target.className);

            // get the start time
            let startDateTime = new Date(this.getStartDateTime());
            // console.log('bookDay.handleBook: startDateTime: ', JSON.stringify(startDateTime));

            // define the settings to pass
            let settings = {
                'dateTime' : startDateTime,
                'physicianId' : physicianId
            };

            // console.log('bookDay.handleBook: settings: ', JSON.stringify(settings));
        
            // notify the parent component to show the new booking
            this.dispatchEvent(new CustomEvent(
                'appointment',
                {
                    detail : settings
                }
            ));  

        }

    // helper methods



}
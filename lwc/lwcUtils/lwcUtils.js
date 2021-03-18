export default {errorMessage, isEmpty, utcDateFromString, localDate, currentLocalDate, currentLocalDateTime, dateFromDateTime, timeFromDateTime, toastSuccess, toastError, toastInfo, toastWarning}

/* eslint-disable no-console */

// extracts the error message from LWC errors
export function errorMessage(errors) {

    var result = '';

    if (!isEmpty(errors)) {

        if (!Array.isArray(errors)) {
            errors = [errors];
        }

        errors =
            errors
                // Remove null/undefined items
                .filter(error => !!error)
                // Extract an error message
                .map(error => {

                    // UI API read errors
                    if (Array.isArray(error.body)) {
                        return error.body.map(e => e.message);
                    }
                    // UI API DML, Apex and network errors
                    else if (error.body && typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                    // Event detail message
                    else if (error.detail && typeof error.detail.message === 'string') {
                        return error.detail.message;
                    }
                    // JS errors
                    else if (typeof error.message === 'string') {
                        // NOTE: do not comment this line
                        console.log('Exception caught: ', error.stack);
                        return error.message;
                    }
                    // Unknown error shape so try HTTP status text
                    return error.statusText;
                })
                // Flatten
                .reduce((prev, curr) => prev.concat(curr), [])
                // Remove empty strings
                .filter(message => !!message)
        ;

        for (let i = 0; i < errors.length; i++) {
            if (i > 0) {
                result += ', ';
            }
            result += errors[i];
        }

        // character substitutions
        result = result.replace(/&quot;/gi, '"');
        result = result.replace(/&apos;/gi, "'");
        result = result.replace(/&lt;/gi, '<');
        result = result.replace(/&gt;/gi, '>');

    }

    return result;
}

// returns true if the variable is empty
export function isEmpty(val) {
    var result;
    if (Array.isArray(val) && val.length === 0) {
        result = true;
    } else if (val === null || val === undefined || val === '') {
        result = true;
    } else {
        result = false;
    }
    return result;
}

// creates a javascript date object in utc time based on a YYYY-MM-DD string
export function utcDateFromString(yyyymmdd) {
    let utcDate = new Date(Date.parse(yyyymmdd + ' 00:00:00 UTC'));

    return utcDate;
}

// converts a javascript date object in UTC time to a javascript date object in Local Time
export function localDate(utcDate) {
    var localDateCalc = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return localDateCalc;
}

// returns the current date in YYYY-MM-DD format in local time
export function currentLocalDate() {
    var utcDate = new Date();    
    var localDateCalc = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    var localYYYYMMDD = localDateCalc.toISOString().split('T')[0]; 
    return localYYYYMMDD;
}

// returns a javascript date object of the current time in Local Time
export function currentLocalDateTime() {
    var utcDate = new Date();    
    var localDateCalc = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return localDateCalc;
}

// returns the YYYY-MM-DD date from a Javascript date object
export function dateFromDateTime(jsDate) {
    var localYYYYMMDD = jsDate.toISOString().split('T')[0]; 
    return localYYYYMMDD;
}

// returns the HH:MM AM/PM (in 12 hour format) from a Javascript date object
export function timeFromDateTime(jsDate) {

    console.log('jsDate: ' + jsDate.toISOString());
    
    let hours = jsDate.getUTCHours();
    
    let ampm;
    if (hours >= 12) {
        ampm = 'PM';
    } else {
        ampm = 'AM';
    }

    // change 24-hour format to 12-hour format
    if (hours > 12) {
        hours = hours - 12;
    }

    let minutes = ('0' + jsDate.getUTCMinutes()).slice(-2);

    let time = hours + ':' + minutes + ' ' + ampm;
    return time;
}

// used for toast events
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// shows a success toast message
export function toastSuccess(component, title, message, messageData, mode) {

    // if message data is empty, initialize it
    if (isEmpty(messageData)) {
        messageData = [];
    }

    if (isEmpty(mode)) {
        mode = 'dismissable';
    }
    
    // build the event
    let toastEvent = new ShowToastEvent({
        title: title,
        message: message,
        messageData : messageData,
        variant: 'success',
        duration: 3,
        mode: mode
    });

    // dispatch the event
    component.dispatchEvent(toastEvent);
}

// shows an error toast message
export function toastError(component, title, message, messageData, mode) {

    // if message data is empty, initialize it
    if (isEmpty(messageData)) {
        messageData = [];
    }

    if (isEmpty(mode)) {
        mode = 'pester';
    }
    
    // build the event
    let toastEvent = new ShowToastEvent({
        title: title,
        message: message,
        messageData : messageData,
        variant: 'error',
        mode: mode
    });

    // dispatch the event
    component.dispatchEvent(toastEvent);
}

// shows an info toast message
export function toastInfo(component, title, message, messageData, mode) {

    // if message data is empty, initialize it
    if (isEmpty(messageData)) {
        messageData = [];
    }

    if (isEmpty(mode)) {
        mode = 'dismissable';
    }
    
    // build the event
    let toastEvent = new ShowToastEvent({
        title: title,
        message: message,
        messageData : messageData,
        variant: 'info',
        duration: 3,
        mode: mode
    });

    // dispatch the event
    component.dispatchEvent(toastEvent);
}

// shows a warning toast message
export function toastWarning(component, title, message, messageData, mode) {

    // if message data is empty, initialize it
    if (isEmpty(messageData)) {
        messageData = [];
    }

    if (isEmpty(mode)) {
        mode = 'dismissable';
    }
    
    // build the event
    let toastEvent = new ShowToastEvent({
        title: title,
        message: 'Warning: ' + message,
        messageData : messageData,
        variant: 'warning',
        duration: 3,
        mode: mode
    });

    // dispatch the event
    component.dispatchEvent(toastEvent);
}
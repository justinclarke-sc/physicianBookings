public without sharing class BookController {

    // class name for debugging
    @TestVisible private static String className = 'BookController';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // return list of specialties to display
    // recordId exists only as a reactive property to trigger the wire callout
    @AuraEnabled(cacheable=true)
    public static List<Specialty__c> getSpecialties(Id recordid) {

        String methodName = 'getSpecialties';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': recordId: ' + recordId);

        List<Specialty__c> specialties;

        try {

            specialties = [SELECT Id, Name, Price__c FROM Specialty__c];
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': specialties: ' + specialties.size());

        } catch (Exception e) {
            hasErrors = true;
            String errorMessage = Exception_Helper.userReadableError(e.getMessage());
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);
            throw new Lightning_Exception(errorMessage);
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': specialties: ' + specialties);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return specialties;
    }

    // return list of specialties to display
    // recordId exists only as a reactive property to trigger the wire callout
    @AuraEnabled(cacheable=true)
    public static List<Physician__c> getPhysiciansList(Id specialtyId) {

        String methodName = 'getPhysiciansList';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': specialtyId: ' + specialtyId);

        List<Physician__c> physicians;

        try {

            physicians = [SELECT Id, Full_Name__c, Booked_Colour__c, Busy_Colour__c, GAPI_Access_Token__c FROM Physician__c WHERE Id IN (SELECT Physician__c FROM Physician_Specialty__c WHERE Specialty__c = :specialtyId)];

            for (Physician__c p : physicians) {
                
                // set Has_GAPI_Access_Token__c based on GAPI_Access_Token__c
                p.Has_GAPI_Access_Token__c = p.GAPI_Access_Token__c != null ? true : false;

                // clear the access token since we don't need it in the return response
                p.GAPI_Access_Token__c = null;
            }

        } catch (Exception e) {
            hasErrors = true;
            String errorMessage = Exception_Helper.userReadableError(e.getMessage());
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);
            throw new Lightning_Exception(errorMessage);
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicians: ' + physicians.size());
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return physicians;
    }

    // return list of appointments within the specified date/time range
    @AuraEnabled
    public static List<Appointment__c> getAppointments(List<Id> physicianIds, Datetime startDateTime, Datetime endDateTime) {

        String methodName = 'getAppointments';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicianIds: ' + physicianIds);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': startDateTime: ' + startDateTime);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': endDateTime: ' + endDateTime);

        List<Appointment__c> appointments;

        try {

            appointments = [SELECT Id, Name, Patient__c, Physician__c, Specialty__c, Price__c, Date_Time__c, Physician__r.Full_Name__c, Physician__r.Booked_Colour__c, Physician__r.Busy_Colour__c FROM Appointment__c WHERE Physician__c IN :physicianIds AND Date_Time__c >= :startDateTime AND Date_Time__c <= :endDateTime];

        } catch (Exception e) {
            hasErrors = true;
            String errorMessage = Exception_Helper.userReadableError(e.getMessage());
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);
            throw new Lightning_Exception(errorMessage);
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': appointments: ' + appointments.size());
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return appointments;
    }

    // return list of google events within the specified date/time range for the specified physician
    @AuraEnabled
    public static List<String> getGoogleEvents(List<Id> physicianIds, Datetime startDateTime, Datetime endDateTime) {

        String methodName = 'getGoogleEvents';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicianIds: ' + physicianIds);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': startDateTime: ' + startDateTime);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': endDateTime: ' + endDateTime);

        List<String> calendarEvents = new List<String>();

        if (physicianIds.isEmpty() == false) {

            for (Id physicianId : physicianIds) {

                // get the physician
                Physician__c p = Physician.getPhysician(physicianId);
                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': p: ' + p);

                try {
        
                    // initialize google helper for this physician
                    Google_API_Helper googleAPI = new Google_API_Helper(p.Id);
                    
                    // get the calendar events for the physician's primary calendar within the specified timeframe
                    Google_Events_Response calendarEventsResponse = googleAPI.getCalendarEvents('primary', startDateTime, endDateTime);

                    // loop through events, append information, and add to list to return
                    if (calendarEventsResponse.items != null) {
                        for (Google_Event_Response event : calendarEventsResponse.items) {

                            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': event.status: ' + event.status);

                            // check event status isn't cancelled
                            if (event.status !='cancelled') {

                                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Event is not cancelled, checking attendees');

                                Boolean isDeclined = false;

                                // check if this user has not declined the invite
                                if (event.attendees != null && event.attendees.isEmpty() == false) {
                                    for (Google_Event_Attendee attendee : event.attendees) {
                                        if (attendee.self == true && attendee.responseStatus == 'declined') {
                                            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': This user has declined the event, don\'t count it');
                                            isDeclined = true;
                                            break;
                                        }
                                    }
                                }

                                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': isDeclined: ' + isDeclined);

                                // if user hasn't declined the invite, add to list
                                if (isDeclined == false) {

                                    // append physician id/name
                                    event.physicianId = p.Id;
                                    event.physicianName = p.Full_Name__c;

                                    // append the physician's colours
                                    event.busyColour = p.Busy_Colour__c;
                                    event.bookedColour = p.Booked_Colour__c;

                                    if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': event: ' + event);
                                    if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': event.startTime: ' + event.startTime);
                                    if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': event.endTime: ' + event.endTime);

                                    // add event to list
                                    calendarEvents.add(JSON.serialize(event));

                                }

                            }
                        }
                    }

                } catch (Exception e) {
                    hasErrors = true;
                    String errorMessage = Exception_Helper.userReadableError(e.getMessage());
                    if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);
        
                    // if NOT an auth/token error, throw an exception
                    if (e.getMessage().contains(Google_API_Helper.INVALID_AUTH_MESSAGE) == false &&
                        e.getMessage().contains(Google_API_Helper.MISSING_TOKEN_MESSAGE) == false &&
                        e.getMessage().contains(Google_API_Helper.MISSING_PHYSICIAN_MESSAGE) == false) {
                        throw new Lightning_Exception(errorMessage);
                    }
                }

            }

            // if access tokens were refreshed, update SF physician record
            if (Physician.physiciansChanged) {
                update Physician.getPhysicians().values();
            }
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarEvents: ' + calendarEvents.size());
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return calendarEvents;
    }

    // create an appointment for the specified contact, physician, specialty, and date/time
    @AuraEnabled
    public static String createAppointment(Id patientId, Id physicianId, Id specialtyId, Datetime apptDateTime, Integer duration) {

        String methodName = 'createAppointment';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': patientId: ' + patientId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicianId: ' + physicianId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': specialtyId: ' + specialtyId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': apptDateTime: ' + apptDateTime);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': duration: ' + duration);

        // make a database savepoint
        System.Savepoint sp;

        // initialize result to return
        Map<String, String> resultMap = new Map<String, String>();

        // flag to indicate whether google event was successfully created
        Boolean googleEventCreated = false;

        try {

            // look up specialty
            List<Specialty__c> specialties = [SELECT Id, Name, Price__c FROM Specialty__c WHERE Id = :specialtyId];
            String specialtyName = specialties[0].Name;
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': specialtyName: ' + specialtyName);

            // look up patient
            List<Contact> patients = [SELECT Id, Name FROM Contact WHERE Id = :patientId];
            String patientName = patients[0].Name;
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': patientName: ' + patientName);

            // define start/end times
            Datetime startDateTime = apptDateTime;
            Datetime endDateTime = apptDateTime.addMinutes(duration);
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': startDateTime: ' + startDateTime);
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': endDateTime: ' + endDateTime);

            // define event summary
            String summary = specialtyName + ' Appointment';
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': summary: ' + summary);

            // define event description
            String description = 'Patient: ' + patientName;
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': description: ' + description);

            // get timezone
            String timeZone = String.valueOf(UserInfo.getTimeZone());
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': timeZone: ' + timeZone);

            // create google event, if an auth/token error occurs, it's OK to continue to create the appointment
            try {

                // create google event for the physician
                Google_API_Helper googleAPI = new Google_API_Helper(physicianId);

                // define the new event
                Google_Event_Response newCalendarEvent = new Google_Event_Response(startDateTime, endDateTime, timeZone, summary, description);
                
                // create google calendar entry
                Google_Event_Response resultCalendarEvent = googleAPI.addCalendarEvent('primary', newCalendarEvent);

                // google event created successfully
                googleEventCreated = true;

            } catch (Google_API_Exception e) {

                hasErrors = true;
                String errorMessage = Exception_Helper.userReadableError(e.getMessage());
                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);

                // if NOT an auth/token error, throw an exception
                if (e.getMessage().contains(Google_API_Helper.INVALID_AUTH_MESSAGE) == false &&
                    e.getMessage().contains(Google_API_Helper.MISSING_TOKEN_MESSAGE) == false &&
                    e.getMessage().contains(Google_API_Helper.MISSING_PHYSICIAN_MESSAGE) == false) {
                    throw new Lightning_Exception(errorMessage);
                }
            }
            
            // insert appointment
            Appointment__c appt = new Appointment__c(
                Patient__c = patientId,
                Physician__c = physicianId,
                Specialty__c = specialtyId,
                Date_Time__c = apptDateTime,
                Price__c = specialties[0].Price__c
            );

            insert appt;

            // if successfully created, add id / flag to result to return
            resultMap.put('appointmentId', appt.Id);
            resultMap.put('googleEventCreated', String.valueOf(googleEventCreated));

        } catch (Exception e) {

            hasErrors = true;
            String errorMessage = Exception_Helper.userReadableError(e.getMessage());
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);
            throw new Lightning_Exception(errorMessage);
        }

        // if access tokens were refreshed, update SF physician record
        if (Physician.physiciansChanged) {
            update Physician.getPhysicians().values();
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': resultMap: ' + resultMap);

        // serialize the response
        String resultString = JSON.serialize(resultMap);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': resultString: ' + resultString);
        
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return resultString;
    }
    
}
public without sharing class Google_API_Helper {

    // class name for debugging
    @TestVisible private static String className = 'Google_API_Helper';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // Client ID and API key from the Developer Console
    public static String CLIENT_ID = '924568179120-skls3h3napka25kj1b6tri2hbl3etn38.apps.googleusercontent.com';
    public static String CLIENT_SECRET = 'cObarfP2Q7Aafq1Yq1VttqsZ';
    public static String API_KEY = 'AIzaSyD9fTvO24koAQqJNze2TQLmoloMq4z70QU';
    public static String REDIRECT_URI = 'https://toptal-surgery-test-developer-edition.na156.force.com';

    // Array of API discovery doc URLs for APIs used by the quickstart
    public static String DISCOVERY_DOCS = '["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]';

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    public static String SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
  
    // Google API url endpoints
    private static String tokenURL = 'https://oauth2.googleapis.com/token';

    private static String calendarListURL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList/';

    private static String calendarEventsURLPrefix = 'https://www.googleapis.com/calendar/v3/calendars/';
    private static String getCalendarEventsURL(String calendarId) {
        return calendarEventsURLPrefix + calendarId + '/events';
    }

    // message returned when the auth token is invalid/expired
    public static String INVALID_AUTH_MESSAGE = 'Request had invalid authentication credentials';
    public static String MISSING_TOKEN_MESSAGE = 'does not have an access token specified';
    public static String MISSING_PHYSICIAN_MESSAGE = 'could not be found';

    // set timeout for API callouts
    public static Integer calloutTimeout = 60*1000;

    // CONSTRUCTOR

    @TestVisible private Physician__c currentPhysician = null;

    // constructor that gets the auth/refresh token from the specified physician record
    public Google_API_Helper(Id physicianId) {

        String methodName = 'constructor';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicianId: ' + physicianId);

        // get the physician record
        currentPhysician = Physician.getPhysician(physicianId);

        // couldn't find physician
        if (currentPhysician == null) {
            throw new Google_API_Exception('The physician with id: ' + physicianId + ' ' + MISSING_PHYSICIAN_MESSAGE);
        
        // physician doesn't have a token
        } else if (currentPhysician.GAPI_Access_Token__c == null) {
            throw new Google_API_Exception('The physician with id: ' + physicianId + ' ' + MISSING_TOKEN_MESSAGE);
        }

    }

    // helper method to process GET/POST requests, refresh access token if expired, and return the response
    // throws a Google_API_Exception if an error is returned

    @TestVisible private String apiRequest(String requestType, String requestPath) {
        return apiRequest(requestType, requestPath, null, null, true);
    }

    @TestVisible private String apiRequest(String requestType, String requestPath, Map<String, object> params, String contentType) {
        return apiRequest(requestType, requestPath, params, contentType, true);
    }

    @TestVisible private String apiRequest(String requestType, String requestPath, Map<String, object> params, String contentType, Boolean retry) {

        String methodName = 'apiRequest';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestType: ' + requestType);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestPath: ' + requestPath);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': params: ' + params);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': retry: ' + retry);

        // If there is no token, try refreshing
        if (currentPhysician.GAPI_Access_Token__c == null) {
            refreshAccessToken();
        }

        try {

            // build the http request to send
            HttpRequest req = buildRequest(requestType, requestPath, params, contentType, currentPhysician.GAPI_Access_Token__c);

            // perform the callout and return result
            return calloutHelper(req);

        // catch excseptions
        } catch (Google_API_Exception e) {

            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': e.errorCode: ' + e.errorCode);
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': e.getMessage(): ' + e.getMessage());

            // if an invalid API token response is received and retry=true, blank the auth token and retry
            if((e.errorCode == 401 || e.getMessage().contains(INVALID_AUTH_MESSAGE)) && retry) {

                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Invalid/expired token, clearing access token and retrying');

                // the access token isn't valid, blank it to try to force a token refresh
                currentPhysician.GAPI_Access_Token__c = null;

                // mark physician as updated
                Physician.setPhysician(currentPhysician);

                // call again, forcing a token refresh, but won't retry again if fails again
                return this.apiRequest(requestType, requestPath, params, contentType, false);

            // any other error, throw exception
            } else {
                hasErrors = true;
                throw e;
            }
        }
    }
        
    // get the access token based on the refresh token
    public Google_Token_Response refreshAccessToken(){

        String methodName = 'refreshAccessToken';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Refreshing API Token');

        Map<String, String> messageBody = new Map<String, String>();
        messageBody.put('client_id', CLIENT_ID);
        messageBody.put('client_secret', CLIENT_SECRET);
        messageBody.put('grant_type', 'refresh_token');
        messageBody.put('refresh_token', currentPhysician.GAPI_Refresh_Token__c);

        // Getting access token from google based on the refresh token
        HttpRequest req = buildRequest('POST', tokenURL, messageBody, 'application/x-www-form-urlencoded', null);

        // perform the callout and return result
        String responseBody = calloutHelper(req);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': responseBody: ' + responseBody);

        // deserialize response
        Google_Token_Response response = (Google_Token_Response) JSON.deserialize(responseBody, Google_Token_Response.class);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': response: ' + response);

        // put the refresh token back in the response
        response.refresh_token = currentPhysician.GAPI_Refresh_Token__c;

        // update physician with new token
        currentPhysician.GAPI_Access_Token__c = response.access_token;
        currentPhysician.GAPI_Refresh_Token__c = response.refresh_token;
        
        // update the physician in the map cache and mark for DML update later
        Physician.setPhysician(currentPhysician);

        return response;
    }

    // get primary calendar id for a given physician
    public String getPrimaryCalendarId(){

        String methodName = 'getPrimaryCalendarId';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        String responseText = apiRequest('GET', calendarListURL);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': responseText: ' + responseText);

        // deserialize response
        Google_Calendars_Response calendars = (Google_Calendars_Response) JSON.deserialize(responseText, Google_Calendars_Response.class);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendars: ' + calendars);

        // initialize response
        Google_Calendar_Response calendar;

        // find the primary calendar
        if (calendars != null && calendars.items != null && calendars.items.isEmpty() == false) {
            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Looping through calendars');
            for (Google_Calendar_Response c : calendars.items) {
                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': c: ' + c);
                if (c.primary != null && c.primary == true) {
                    calendar = c;
                }
            }
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendar: ' + calendar);

        // get the calendar's id
        String calendarId = null;

        if (calendar != null) {
            calendarId = calendar.id;
        }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarId: ' + calendarId);

        return calendarId;
    }

    // get the calendar events for a given timeframe for specified physician and calendar
    // set calendarId = primary if you want to return the events for the user's primary calendar
    public Google_Events_Response getCalendarEvents(String calendarId, Datetime startTime, Datetime endTime){

        String methodName = 'getCalendarEvents';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarId: ' + calendarId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': startTime: ' + startTime);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': endTime: ' + endTime);

        // get the calendar events url endpoint
        String calendarEventsURL = getCalendarEventsURL(calendarId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarEventsURL: ' + calendarEventsURL);

        // convert date/time to America/Toronto string
        String startTimeString = startTime.format('yyyy-MM-dd\'T\'hh:mm:ssZ', 'America/Toronto');
        String endTimeString = endTime.format('yyyy-MM-dd\'T\'hh:mm:ssZ', 'America/Toronto');

        Map<String, Object> messageBody = new Map<String, Object>();
        messageBody.put('calendarId', calendarId);
        messageBody.put('maxResults', 2500);
        messageBody.put('singleEvents', true);
        messageBody.put('timeMin', startTimeString);
        messageBody.put('timeMax', endTimeString);
        messageBody.put('timeZone', 'America/Toronto');
        messageBody.put('orderBy', 'startTime');

        // Get list of events for the calendar
        String responseBody = apiRequest('GET', calendarEventsURL, messageBody, 'application/x-www-form-urlencoded');
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': responseBody: ' + responseBody);

        // Build a map of key replacements for reserved words
        Map<String, String> replacements = new Map<String, String>();
        replacements.put('start', 'startTime');
        replacements.put('end', 'endTime');
        replacements.put('date', 'date_x');
        replacements.put('dateTime', 'datetime_x');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Replacing reserved key words in JSON response');
        String replacedBody = JSON_Helper.replaceKeys(responseBody, replacements);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': replacedBody: ' + replacedBody);

        // deserialize and parse response
        Google_Events_Response events = (Google_Events_Response) JSON.deserialize(replacedBody, Google_Events_Response.class);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': events: ' + events);

        return events;
    }

    // add a calendar event to the specified calendar
    // params defines the request body parameters
    public Google_Event_Response addCalendarEvent(String calendarId, Google_Event_Response newEvent){

        String methodName = 'getCalendarEvents';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarId: ' + calendarId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': newEvent: ' + newEvent);

        // get the calendar events url endpoint
        String calendarEventsURL = getCalendarEventsURL(calendarId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': calendarEventsURL: ' + calendarEventsURL);

        // serialize the new event to be created
        // suppress null values
        String newEventJSON = JSON.serialize(newEvent, true);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': newEventJSON: ' + newEventJSON);
        
        // Build a map of key replacements for reserved words
        Map<String, String> replacements = new Map<String, String>();
        replacements.put('startTime', 'start');
        replacements.put('endTime', 'end');
        replacements.put('date_x', 'date');
        replacements.put('datetime_x', 'dateTime');

        // put back the reserved words
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Replacing reserved key words in JSON');
        String newEventJSONReplaced = JSON_Helper.replaceKeys(newEventJSON, replacements);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': newEventJSONReplaced: ' + newEventJSONReplaced);

        Map<String, Object> messageBody = (Map<String, Object>) JSON.deserializeUntyped(newEventJSONReplaced);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': messageBody: ' + messageBody);

        // Get list of events for the calendar
        String responseBody = apiRequest('POST', calendarEventsURL, messageBody, 'application/json');
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': responseBody: ' + responseBody);

        // Build a map of key replacements for reserved words
        replacements = new Map<String, String>();
        replacements.put('start', 'startTime');
        replacements.put('end', 'endTime');
        replacements.put('date', 'date_x');
        replacements.put('dateTime', 'datetime_x');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Replacing reserved key words in JSON response');
        String replacedBody = JSON_Helper.replaceKeys(responseBody, replacements);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': replacedBody: ' + replacedBody);

        // deserialize and parse response
        Google_Event_Response event = (Google_Event_Response) JSON.deserialize(replacedBody, Google_Event_Response.class);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': event: ' + event);

        return event;
    }

    // STATIC HELPER METHODS

    // build an HTTP request
    // requestType: GET or POST
    // requestPath: the URI to send the request to
    // params: the data to encode an add to either the URI (GET) or Body (POST)
    // token: the authorization bearer token to add to the request (if specified)
    public static HttpRequest buildRequest(String requestType, String requestPath, Map<String, Object> params, String contentType) {
        return buildRequest(requestType, requestPath, params, contentType, null);
    }

    public static HttpRequest buildRequest(String requestType, String requestPath, Map<String, Object> params, String contentType, String token) {

        String methodName = 'buildRequest';
        
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestType: ' + requestType);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestPath: ' + requestPath);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': params: ' + params);

        // build the request content (query string or json body) based on request type)
        String requestContent = requestContentBuilder(requestType, params, contentType);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestContent: ' + requestContent);

        // if performing a GET request, add the content to the request path
        if (requestType == 'GET' && String.isBlank(requestContent) == false) {
            requestPath += '?' + requestContent;
        }
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestPath: ' + requestPath);

        // build request
        HttpRequest req = new HttpRequest();
        req.setMethod(requestType);
        req.setEndpoint(requestPath);

        if (requestType == 'POST' && String.isBlank(requestContent) == false) {
            req.setHeader('Content-Type', contentType);
            req.setBody(requestContent);
            req.setHeader('Content-Length', String.valueOf(requestContent.length()));
        }

        if (token != null) {
            // add authorization string to append to request
            String authorizationHeader = 'Bearer ' + token;
            // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': authorizationHeader: ' + authorizationHeader);
            req.setHeader('Authorization', authorizationHeader);
        }

        // return the request that is ready to be sent
        return req;

    }

    // helper method to build a url-encoded content for the query string or body of the message
    private static String requestContentBuilder(String requestType, Map<String, Object> params, String contentType) {

        String methodName = 'requestContentBuilder';

        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': requestType: ' + requestType);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': params: ' + params);

        // initialize result to empty string
        String content = null;

        // if parameters specified
        if (params != null) {

            if (contentType == 'application/x-www-form-urlencoded') {
                    
                // initialize content
                content = '';

                // iterate through the parametrs, separating with &
                Iterator<String> iter = params.keySet().iterator();

                // initialize iterator variables
                String currentParameter;
                String currentValue;

                while(iter.hasNext()) {

                    // get the next parameter
                    currentParameter = iter.next();
                    // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': currentParameter: ' + currentParameter);

                    // get the value
                    currentValue = String.valueOf(params.get(currentParameter));
                    // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': currentValue: ' + currentValue);

                    // encode key / value pair to url-safe
                    // todo: check if only need to encode for GET and not for POST
                    content += EncodingUtil.urlEncode(currentParameter, 'UTF-8');
                    content += '=';

                    if(currentValue != null) {
                        content += EncodingUtil.urlEncode(currentValue, 'UTF-8');
                    }

                    // add & separator if there are more parameters
                    if (iter.hasNext()) content += '&';
                }

            } else if (contentType == 'application/json') {
                // serialize into JSON format, stripping any null values
                content = JSON.serialize(params, true);
            }
        }

        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': content: ' + content);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return content;
    }

    // helper method to perform an API callout
    // throws a Google_API_Exception if an error is returned
    private static String calloutHelper(HttpRequest req) {

        String methodName = 'calloutHelper';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': req.getBody(): ' + req.getBody());
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': req.getEndpoint(): ' + req.getEndpoint());

        Http http = new Http();

        // set timeout
        req.setTimeout(calloutTimeout);

        // send request
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Sending request');
        HttpResponse res = http.send(req);

        // get httpd status from response
        Integer httpStatus = res.getStatusCode();
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': httpStatus: ' + httpStatus);

        // get body from response

            String body = res.getBody();
            // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': res.body: ' + body);

            // initialize response
            Map<String, Object> apiResponse = new Map<String, Object>();

            // if a body was returned, parse it
            if (body != null && body != '') {
                apiResponse = (Map<String, Object>)JSON.deserializeUntyped(body);
            }

            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': apiResponse: ' + apiResponse);

        // parse response

            if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Parsing Google Auth response');

            // if there is an error
            if (httpStatus != 200) {

                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': An error has occurred, httpStatus: ' + httpStatus);
                hasErrors = true;
                
                String errorMessage = null;

                // try to deserialize the error message
                try {

                    try {

                        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Attempting to deserialize into Google_Detailed_Error_Response');
                        
                        // deserialize the body into an error response
                        Google_Detailed_Error_Response errorResponse = (Google_Detailed_Error_Response) JSON.deserialize(body, Google_Detailed_Error_Response.class);
                        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorResponse: ' + errorResponse);

                        errorMessage = errorResponse.error.code + ': ' + errorResponse.error.message;

                    } catch (System.JSONException e) {

                        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Could not deserialize into Google_Detailed_Error_Response, trying Google_Simple_Error_Response');

                        // deserialize the body into an error response
                        Google_Simple_Error_Response errorResponse = (Google_Simple_Error_Response) JSON.deserialize(body, Google_Simple_Error_Response.class);
                        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorResponse: ' + errorResponse);

                        errorMessage = errorResponse.error + ': ' + errorResponse.error_description;

                    }
                    
                } catch (Exception e) {
                    if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Could not deserialize response, returning entire body');
                    errorMessage = body;
                }

                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);

                // throw exception
                throw new Google_API_Exception(errorMessage, httpStatus);
            }

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': end');

        return body;
    }
        
    // get the access/refresh token from the Google API given the authorization_code
    public static Google_Token_Response getAccessToken(String code){

        String methodName = 'getAccessToken';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': code: ' + code);

        Map<String, String> messageBody = new Map<String, String>();
        messageBody.put('code', code);
        messageBody.put('client_id', CLIENT_ID);
        messageBody.put('client_secret', CLIENT_SECRET);
        messageBody.put('redirect_uri', REDIRECT_URI);
        messageBody.put('grant_type', 'authorization_code');

        // Getting access token from google
        HttpRequest req = buildRequest('POST', tokenURL, messageBody, 'application/x-www-form-urlencoded');

        String responseBody = calloutHelper(req);
        // if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': responseBody: ' + responseBody);

        // deserialize response
        Google_Token_Response token = (Google_Token_Response) JSON.deserialize(responseBody, Google_Token_Response.class);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': token: ' + token);

        return token;
    }

}
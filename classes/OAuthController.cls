public without sharing class OAuthController {

    @TestVisible private static String className = 'OAuthController';

    @TestVisible private static Boolean debugMode = false;
    
    // constructor
    public OAuthController() {

        String methodName = 'constructor';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
    }

    // given a physician ID and Google API authorization_code, get the access/refresh token and update physician record
    @RemoteAction
    public static Boolean captureAccessToken(Id physicianId, String code) {

        String methodName = 'captureAccessToken';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': physicianId: ' + physicianId);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': code: ' + code);

        // get the access token/refresh token
        Google_Token_Response response = Google_API_Helper.getAccessToken(code);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': response: ' + response);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': access_token: ' + response.access_token);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': refresh_token: ' + response.refresh_token);

        // update physician record's tokens
        Physician__c physician = new Physician__c(Id = physicianId,
                                                  GAPI_Access_Token__c = response.access_token,
                                                  GAPI_Refresh_Token__c = response.refresh_token
                                                  );
        update physician;

        return true;

    }

}
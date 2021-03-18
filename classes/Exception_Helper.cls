public without sharing class Exception_Helper {

    // class name for debugging
    @TestVisible private static String className = 'Exception_Helper';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // Classes

    // custom exception for testing
    public class MyException extends Exception{}

    // takes an exception error message and makes it better readable for an end-user by stripping some of the more technical text from the error
    public static String userReadableError(String errorMessage) {
        
        String methodName = 'userReadableError';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': start');
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': errorMessage: ' + errorMessage);

        String result = errorMessage;

        if (errorMessage != null) {
            
            // if the search string is present, grab all the text AFTER the search string
            String searchString = 'FIELD_CUSTOM_VALIDATION_EXCEPTION, ';
            Integer index = errorMessage.indexOf(searchString);
            if (index >= 0) {
                if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': Pattern match found, trimming result');
                result = errorMessage.substring(index + searchString.length(), errorMessage.length());
            }
        }
        
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': result: ' + result);

        return result;
    }

}
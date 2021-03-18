public without sharing class JSON_Helper {

    // class name for debugging
    @TestVisible private static String className = 'JSON_Helper';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // update the reserved words in a json string with the provided replacement map
    public static String replaceKeys(String data, Map<String, String> replacements) {

        String methodName = 'replaceKeys';

        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': data: ' + data);
        if (debugMode) system.debug(LoggingLevel.DEBUG, className + '.' + methodName + ': replacements: ' + replacements);

        // Regex to match the start of the line and the key
        // surrounded by quotes and ending with a colon
        String regexFormat = '(?m)^\\s*"{0}"\\s*:';
    
        // Replacement format of the new key surrounded by
        // quotes and ending with a colon
        String replacementFormat = '"{0}" :';
    
        // Since our JSON can come in formatted however the
        // endpoint wants, we need to format it to a standard
        // we know and can handle
        String formattedJSON = JSON.serializePretty(JSON.deserializeUntyped(data));
    
        // Iterate over all the keys we want to replace
        for (String key : replacements.keySet()) {
            // Generate our regex based on the key
            String regex = String.format(
                regexFormat,
                new List<String> {key}
            );
    
            // Generate our replacement
            String replacement = String.format(
                replacementFormat,
                new List<String> {replacements.get(key)}
            );
    
            // Find all and replace
            formattedJSON = formattedJSON.replaceAll(regex, replacement);
        }
    
        return formattedJSON;
    }

}
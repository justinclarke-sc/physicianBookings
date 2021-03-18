// support functions for lightning components
public without sharing class Lightning_Support {

    // class name for debugging
    @TestVisible private static String className = 'Lightning_Support';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // get the UI Theme
    // Theme1: Obsolete Salesforce theme
    // Theme2: Salesforce Classic 2005 user interface theme
    // Theme3: Salesforce Classic 2010 user interface theme
    // Theme4d: Modern “Lightning Experience” Salesforce theme
    // Theme4t: Salesforce mobile app theme
    // Theme4u: Lightning Console theme
    // PortalDefault: Salesforce Customer Portal theme
    // Webstore: Salesforce AppExchange theme
    @AuraEnabled(cacheable=true)
    public static String getUITheme() {
        String theme = UserInfo.getUiThemeDisplayed();
        return theme;
    }   

}
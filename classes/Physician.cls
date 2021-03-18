public without sharing class Physician {

    // class name for debugging
    @TestVisible private static String className = 'Google_API_Helper';

    // set flag on whether to enable debug output
    @TestVisible private static Boolean debugMode = false;

    // set flag on whether to cause certain conditions to occur for unit testing
    @TestVisible private static Integer testMode = 0;

    // flag to indicate whether any errors/exceptions occurred
    @TestVisible private static Boolean hasErrors = false;

    // set a flag to indicate that a physician value has changed and needs to be updated
    // used for delaying the DML until after the web callouts are completed
    public static Boolean physiciansChanged = false;

    // cached map of physician ID to Physician record
    private static Map<Id, Physician__c> physiciansMap = null;

    // get map of physicians, get from static cache if already queried
    public static Map<Id, Physician__c> getPhysicians() {
        
        // if not yet populated, initialize and query
        if (physiciansMap == null) {
            physiciansMap = new Map<Id, Physician__c>();

            physiciansMap = new Map<Id, Physician__c>([SELECT Id, Name, Title__c, Full_Name__c, GAPI_Access_Token__c, GAPI_Refresh_Token__c, Booked_Colour__c, Busy_Colour__c FROM Physician__c]);
        }

        return physiciansMap;

    }

    // get the Physician__c record based on Physician ID from static cached map
    public static Physician__c getPhysician(Id physicianId) {
        return getPhysicians().get(physicianId);
    }

    // update the Physician__c record in the static cached map
    public static void setPhysician(Physician__c p) {

        // intialize the map
        getPhysicians();

        // replace in map
        physiciansMap.put(p.Id, p);

        // mark as changed so we can do a DML update later
        physiciansChanged = true;
    }

}
public without sharing class Google_Event_Response {
    
    public String kind;
    // public String etag;
    public String id;
    public String status;
    public String htmlLink;
    // public Datetime created;
    // public Datetime updated;
    public String summary;
    // public Map<String, String> creator;
    // public Map<String, String> organizer;
    public Google_Date_Time startTime;
    public Google_Date_Time endTime;
    // public String recurringEventId;
    // public Google_Date_Time originalStartTime;
    // public String iCalUID;
    // public Integer sequence;
    public String eventType;
    public String description;
    public String location;

    public List<Google_Event_Attendee> attendees;

    // append information about the physician
    public String physicianId;
    public String physicianName;
    public String bookedColour;
    public String busyColour;
    
    // constructor
    public Google_Event_Response(Datetime startTime, Datetime endTime, String timeZone, String summary, String description) {
        this.startTime = new Google_Date_Time(startTime, null, timeZone);
        this.endTime = new Google_Date_Time(endTime, null, timeZone);
        this.summary = summary;
        this.description = description;
    }

}
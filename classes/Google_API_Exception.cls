// custom exception if one needs to be thrown
public class Google_API_Exception extends Exception {
    
    // http status code
    public Integer errorCode;

    public Google_API_Exception (String message, Integer errorCode) {
        this(message);
        this.errorCode = errorCode;
    }

}
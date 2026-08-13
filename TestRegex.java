import java.util.regex.Pattern;

public class TestRegex {
    public static void main(String[] args) {
        String regex = "^\\+?[1-9]\\d{1,14}$";
        String phone = "+919342161049";
        System.out.println("Matches: " + Pattern.matches(regex, phone));
    }
}

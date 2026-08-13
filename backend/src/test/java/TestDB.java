import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:h2:mem:stridemate;DB_CLOSE_DELAY=-1", "sa", "");
            PreparedStatement ps = conn.prepareStatement("SELECT id, first_name, last_name, phone_number FROM users WHERE phone_number = '+919342161049'");
            ResultSet rs = ps.executeQuery();
            int count = 0;
            while (rs.next()) {
                System.out.println("User: " + rs.getString("first_name") + " " + rs.getString("last_name"));
                count++;
            }
            System.out.println("Total users with phone: " + count);
            
            // let's check the OTP table
            PreparedStatement psOtp = conn.prepareStatement("SELECT otp_hash FROM otp_entity WHERE phone_number = '+919342161049' ORDER BY created_at DESC LIMIT 1");
            ResultSet rsOtp = psOtp.executeQuery();
            if (rsOtp.next()) {
                System.out.println("OTP Hash exists");
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

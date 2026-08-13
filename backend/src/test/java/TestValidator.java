import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import jakarta.validation.ConstraintViolation;
import java.util.Set;
import com.stridemate.api.auth.dto.RegisterRequest;

public class TestValidator {
    public static void main(String[] args) {
        try {
            LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
            validator.afterPropertiesSet();
            
            RegisterRequest req = new RegisterRequest();
            req.setFirstName("TEST1");
            req.setLastName("A");
            req.setEmail("test42@test.com"); // Assuming the user meant a valid email
            req.setPhoneNumber("+919342161049");
            req.setPassword("StrideTest123!");
            
            Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(req);
            System.out.println("Violations size: " + violations.size());
            for (ConstraintViolation<RegisterRequest> v : violations) {
                System.out.println(v.getPropertyPath() + ": " + v.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

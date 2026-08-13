import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.ConstraintViolation;
import java.util.Set;
import com.stridemate.api.auth.dto.RegisterRequest;

public class TestValidator2 {
    public static void main(String[] args) {
        try {
            ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
            Validator validator = factory.getValidator();
            
            RegisterRequest req = new RegisterRequest();
            req.setFirstName("TEST1");
            req.setLastName("A");
            req.setEmail("test42@example.com");
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

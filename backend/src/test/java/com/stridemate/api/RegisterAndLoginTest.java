package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class RegisterAndLoginTest {

    @LocalServerPort
    private int port;

    @Test
    public void testRegAndLogin() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        ObjectMapper mapper = new ObjectMapper();

        RegisterRequest reg = new RegisterRequest();
        reg.setFirstName("Test");
        reg.setLastName("User");
        reg.setEmail("test1@example.com");
        reg.setPhoneNumber("+123456");
        reg.setPassword("password123");

        HttpRequest req1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:"+port+"/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(reg)))
                .build();
        HttpResponse<String> res1 = client.send(req1, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, res1.statusCode());

        LoginRequest login = new LoginRequest();
        login.setEmail("test1@example.com");
        login.setPassword("password123");

        HttpRequest req2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:"+port+"/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(login)))
                .build();
        HttpResponse<String> res2 = client.send(req2, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res2.statusCode()); // This is what we expect to fail with 401 based on the bug report
    }
}

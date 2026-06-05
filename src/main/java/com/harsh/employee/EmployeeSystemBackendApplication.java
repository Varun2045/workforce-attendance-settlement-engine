package com.harsh.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(exclude = {RedisAutoConfiguration.class})
@EnableAsync
public class EmployeeSystemBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmployeeSystemBackendApplication.class, args);
	}

}

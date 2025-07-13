package com.maven.OnlineShoppingSB;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class OnlineShoppingSbApplication {

	public static void main(String[] args) {
		SpringApplication.run(OnlineShoppingSbApplication.class, args);
	}

}

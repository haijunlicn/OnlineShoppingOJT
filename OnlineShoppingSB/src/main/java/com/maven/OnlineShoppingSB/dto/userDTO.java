package com.maven.OnlineShoppingSB.dto;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class userDTO {
	  private Long id;

	    @NotBlank(message  = "Email is required")
	    @Email(message = "Invalid email format")
	    private String email;

	    @NotBlank(message = "Name is required")
	    @Size(max = 100, message = "Name must be at most 100 characters")
	    private String name;

	    
	    private String phone;

	    
	    private Boolean isVerified;

	  
	    private Boolean delFg;

	    private LocalDateTime createdDate;
	    private LocalDateTime updatedDate;

	    
	    private String roleName;
}

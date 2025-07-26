package com.maven.OnlineShoppingSB.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class EmailValidationResponse {
    private String email;
    private boolean isValidFormat;
    private boolean isDisposable;
    private boolean isFreeEmail;
    private boolean isMxFound;
    private boolean isSmtpValid;

    @JsonProperty("is_valid_format")
    public void setIsValidFormat(ValueWrapper validFormat) {
        this.isValidFormat = validFormat.value;
    }

    @JsonProperty("is_disposable_email")
    public void setIsDisposable(ValueWrapper disposable) {
        this.isDisposable = disposable.value;
    }

    @JsonProperty("is_free_email")
    public void setIsFreeEmail(ValueWrapper freeEmail) {
        this.isFreeEmail = freeEmail.value;
    }

    @JsonProperty("is_mx_found")
    public void setIsMxFound(ValueWrapper mxFound) {
        this.isMxFound = mxFound.value;
    }

    @JsonProperty("is_smtp_valid")
    public void setIsSmtpValid(ValueWrapper smtpValid) {
        this.isSmtpValid = smtpValid.value;
    }

    public boolean isValid() {
        return isValidFormat && isMxFound && isSmtpValid;
    }

    public static class ValueWrapper {
        public boolean value;
    }
}

package com.maven.OnlineShoppingSB.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;


public class WebConfig  {

    @Bean
    public ModelMapper mapper() {
    	
        ModelMapper modelMapper = new ModelMapper();
        return modelMapper;
    }


}

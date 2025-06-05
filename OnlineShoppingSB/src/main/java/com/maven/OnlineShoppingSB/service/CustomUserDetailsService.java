package com.maven.OnlineShoppingSB.service;

<<<<<<< Updated upstream
import com.maven.OnlineShoppingSB.entity.UserEntity;
=======
>>>>>>> Stashed changes
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

<<<<<<< Updated upstream
=======
import com.maven.OnlineShoppingSB.entity.UserEntity;
>>>>>>> Stashed changes
import com.maven.OnlineShoppingSB.repository.UserRepository;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                new ArrayList<>()  // authorities (e.g. ROLE_USER) – empty for now
        );
    }
<<<<<<< Updated upstream
}

=======
}
>>>>>>> Stashed changes

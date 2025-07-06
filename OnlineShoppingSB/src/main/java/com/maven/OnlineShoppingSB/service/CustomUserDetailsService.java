package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.entity.PermissionEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

//    @Override
//    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
//        UserEntity user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//
//        return new org.springframework.security.core.userdetails.User(
//                user.getEmail(),
//                user.getPassword(),
//                new ArrayList<>()  // authorities (e.g. ROLE_USER) – empty for now
//        );
//    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Set<GrantedAuthority> authorities = new HashSet<>();

        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().toUpperCase()));

            for (PermissionEntity perm : user.getRole().getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(perm.getCode()));
            }
        }

        return new CustomUserDetails(user, authorities);
    }


//    public UserDetails loadUserByUsernameAndRoleType(String email, Integer roleType) throws UsernameNotFoundException {
//        return userRepository.findByEmailAndRoleType(email, roleType)
//                .map(user -> new org.springframework.security.core.userdetails.User(
//                        user.getEmail(),
//                        user.getPassword(),
//                        new ArrayList<>()
//                ))
//                .orElseThrow(() -> new UsernameNotFoundException("User not found with email and roleType"));
//    }

    @Transactional(readOnly = true)
    public UserDetails loadUserByUsernameAndRoleType(String email, Integer roleType) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmailAndRoleType(email, roleType)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email and roleType"));

        Set<GrantedAuthority> authorities = new HashSet<>();

        if (user.getRole() != null) {
            // add role name as authority (optional)
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().toUpperCase()));

            // add permissions as authorities
            for (PermissionEntity perm : user.getRole().getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(perm.getCode()));
            }
        }

        System.out.println("this user has authorities : " + authorities);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

}

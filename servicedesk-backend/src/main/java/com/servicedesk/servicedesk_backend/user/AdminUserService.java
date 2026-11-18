package com.servicedesk.servicedesk_backend.user;

// STEP 1: IMPORT REQUIRED CLASSES

import com.servicedesk.servicedesk_backend.auth.dto.UserResponse;
import com.servicedesk.servicedesk_backend.exception.EmailAlreadyExistsException;
import com.servicedesk.servicedesk_backend.user.dto.AdminCreateAgentRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

// STEP 2: DECLARE ADMIN USER SERVICE
@Service
@Transactional
public class AdminUserService {

    // STEP 3: DECLARE REQUIRED DEPENDENCIES
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // STEP 4: INJECT DEPENDENCIES THROUGH THE CONSTRUCTOR
    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // STEP 5: CREATE A SUPPORT AGENT ACCOUNT
    public UserResponse createAgent(AdminCreateAgentRequest request) {
        // STEP 5.1: NORMALIZE EMAIL TO A CONSISTENT FORMAT
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // STEP 5.2: PREVENT DUPLICATE EMAIL ACCOUNTS
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        // STEP 5.3: HASH THE INITIAL PASSWORD USING THE EXISTING BCRYPT ENCODER
        String encodedPassword = passwordEncoder.encode(request.password());

        // STEP 5.4: SET AGENT ROLE ON THE SERVER, NEVER FROM CLIENT INPUT
        User agent = new User(request.name().trim(), email, encodedPassword, Role.AGENT);

        // STEP 5.5: PERSIST THE AGENT ACCOUNT
        User savedAgent = userRepository.save(agent);

        // STEP 5.6: RETURN A SAFE DTO, NOT THE ENTITY OR PASSWORD HASH
        return toUserResponse(savedAgent);
    }

    // STEP 6: FETCH ALL ACTIVE SUPPORT AGENTS
    @Transactional(readOnly = true)
    public List<UserResponse> getActiveAgents() {
        // STEP 6.1: FIND ACTIVE AGENTS FROM MYSQL
        List<User> agents = userRepository.findByRoleAndEnabledTrue(Role.AGENT);

        // STEP 6.2: MAP EACH ENTITY TO A SAFE RESPONSE DTO
        return agents.stream().map(this::toUserResponse).toList();
    }

    // STEP 7: CONVERT USER ENTITY INTO A SAFE RESPONSE
    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}

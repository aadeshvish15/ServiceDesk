package com.servicedesk.servicedesk_backend.user.controller;

// STEP 1: IMPORT REQUIRED CLASSES

import com.servicedesk.servicedesk_backend.auth.dto.UserResponse;
import com.servicedesk.servicedesk_backend.user.AdminUserService;
import com.servicedesk.servicedesk_backend.user.dto.AdminCreateAgentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// STEP 2: DECLARE ADMIN USER MANAGEMENT CONTROLLER
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    // STEP 3: INJECT THE SERVICE LAYER
    private final AdminUserService adminUserService;

    // STEP 4: CONSTRUCTOR INJECTION
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    // STEP 5: CREATE AN AGENT ACCOUNT — POST /api/admin/users/agents
    @PostMapping("/agents")
    public ResponseEntity<UserResponse> createAgent(
            @Valid @RequestBody AdminCreateAgentRequest request
    ) {
        // STEP 5.1: EXECUTE AGENT CREATION BUSINESS LOGIC
        UserResponse response = adminUserService.createAgent(request);

        // STEP 5.2: RETURN HTTP 201 CREATED
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // STEP 6: LIST ACTIVE AGENTS — GET /api/admin/users/agents
    @GetMapping("/agents")
    public ResponseEntity<List<UserResponse>> getActiveAgents() {
        // STEP 6.1: FETCH ACTIVE AGENT ACCOUNTS
        List<UserResponse> agents = adminUserService.getActiveAgents();

        // STEP 6.2: RETURN THE AGENT LIST
        return ResponseEntity.ok(agents);
    }
}

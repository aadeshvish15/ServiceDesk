package com.servicedesk.servicedesk_backend.ticket.controller;

// STEP 1: IMPORT REQUIRED CLASSES

import com.servicedesk.servicedesk_backend.ticket.TicketService;
import com.servicedesk.servicedesk_backend.ticket.dto.TicketResponse;
import com.servicedesk.servicedesk_backend.ticket.dto.TicketStatusUpdateRequest;
import com.servicedesk.servicedesk_backend.user.User;
import com.servicedesk.servicedesk_backend.user.UserRepository;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// STEP 2: DECLARE AGENT TICKET CONTROLLER

@RestController
@RequestMapping("/api/agent/tickets")
public class AgentTicketController {

    // STEP 3: INJECT REQUIRED SERVICES AND REPOSITORIES

    private final TicketService ticketService;
    private final UserRepository userRepository;

    // STEP 4: CONSTRUCTOR INJECTION

    public AgentTicketController(
            TicketService ticketService,
            UserRepository userRepository
    ) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    // STEP 5: FETCH TICKETS AVAILABLE TO THE LOGGED-IN AGENT

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAvailableTickets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // STEP 5.1: CHECK WHETHER THE LOGGED-IN USER IS AN ADMIN
        boolean admin = isAdmin(userDetails);

        // STEP 5.2: ADMIN CAN VIEW ALL TICKETS
        if (admin) {
            return ResponseEntity.ok(ticketService.getAllTickets());
        }

        // STEP 5.3: FIND THE LOGGED-IN AGENT
        User agent = findCurrentAgent(userDetails.getUsername());

        // STEP 5.4: FETCH ALL TICKETS AND FILTER THE RESULT
        // Agents can see tickets assigned to them and the unassigned queue.
        // They must not see another agent's assigned tickets.
        List<TicketResponse> visibleTickets = ticketService.getAllTickets()
                .stream()
                .filter(ticket -> ticket.assignedToId() == null
                        || ticket.assignedToId().equals(agent.getId()))
                .toList();

        // STEP 5.5: RETURN ONLY AUTHORIZED TICKETS
        return ResponseEntity.ok(visibleTickets);
    }

    // STEP 6: FETCH UNASSIGNED TICKETS

    @GetMapping("/unassigned")
    public ResponseEntity<List<TicketResponse>> getUnassignedTickets() {
        // STEP 6.1: FETCH THE UNASSIGNED QUEUE
        List<TicketResponse> tickets = ticketService.getUnassignedTickets();

        // STEP 6.2: RETURN THE QUEUE
        return ResponseEntity.ok(tickets);
    }

    // STEP 7: FETCH ONE TICKET AFTER CHECKING ACCESS

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // STEP 7.1: FETCH THE REQUESTED TICKET
        TicketResponse ticket = ticketService.getTicket(ticketId);

        // STEP 7.2: ALLOW ADMIN TO VIEW ANY TICKET
        if (isAdmin(userDetails)) {
            return ResponseEntity.ok(ticket);
        }

        // STEP 7.3: FIND THE CURRENT AGENT
        User agent = findCurrentAgent(userDetails.getUsername());

        // STEP 7.4: CHECK ASSIGNMENT OWNERSHIP
        // Unassigned tickets are visible because agents need to inspect
        // the queue. A ticket assigned to another agent is forbidden.
        if (ticket.assignedToId() != null
                && !ticket.assignedToId().equals(agent.getId())) {
            throw new AccessDeniedException(
                    "You can only view tickets assigned to you or the unassigned queue"
            );
        }

        // STEP 7.5: RETURN THE AUTHORIZED TICKET
        return ResponseEntity.ok(ticket);
    }

    // STEP 8: UPDATE TICKET STATUS

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // STEP 8.1: EXTRACT THE CURRENT USER EMAIL
        String currentUserEmail = userDetails.getUsername();

        // STEP 8.2: DETERMINE WHETHER THE REQUESTER IS AN ADMIN
        boolean admin = isAdmin(userDetails);

        // STEP 8.3: DELEGATE STATUS AND ASSIGNMENT VALIDATION TO SERVICE
        // TicketService already verifies that a non-admin agent is
        // assigned to the ticket before allowing status changes.
        TicketResponse response = ticketService.updateTicketStatus(
                ticketId,
                currentUserEmail,
                request,
                admin
        );

        // STEP 8.4: RETURN UPDATED TICKET
        return ResponseEntity.ok(response);
    }

    // STEP 9: REUSABLE ADMIN ROLE CHECK

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    // STEP 10: FETCH THE ENABLED AGENT RECORD

    private User findCurrentAgent(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(User::isEnabled)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Active user account not found"
                ));

        if (user.getRole() == null || !user.getRole().name().equals("AGENT")) {
            throw new AccessDeniedException("An agent account is required");
        }

        return user;
    }
}

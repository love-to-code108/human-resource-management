# System Architecture: University Leave Management System

## Core Purpose
An automated, hierarchical Employee Leave Management System (ELMS) for teaching staff, management, and high-level administrators. 

## Core Entities & Leave Bank
1. **User / Employee:** Belongs to a Department and holds a Designation. Connected via `reportsToId` to establish a manager/subordinate relationship.
2. **Leave Types:** Dynamic types (Casual, Medical, etc.) managed by admins via soft-delete (`isActive`).
3. **Leave Bank (LeaveBalance):** A ledger tracking allocated vs. used days per academic year.
4. **Leave Request:** The application containing dates, leaveType, reason (Novel.sh rich text), and currentStatus in the approval chain.

## The Dynamic Approval Hierarchy (Node-Based)
The system routes leaves dynamically based on the `reportsToId` field. 
- When an employee applies, the request goes to their direct manager (`reportsToId`).
- This continues up the chain until it hits a user with no manager (e.g., the VC), which triggers final approval.

### Admin Tools & UI Features
- **Visual Hierarchy Builder:** Admins configure the reporting structure using an interactive **React Flow** canvas. The canvas maps `Users/Designations` as nodes and the `reportsToId` as draggable edges (arrows).
- **Dynamic Leave Types:** Admins can add/remove leave types and adjust default quotas.

## Technical Implementation Rules
- **Routing Logic:** The Next.js API must dynamically check the applicant's manager to determine the `nextApproverId`.
- **Leave Deduction Timing:** Leaves are only deducted from the `LeaveBalance` table upon **Final Approval** (when the request reaches a user with no manager). Do NOT deduct leaves upon submission.
- **Authentication & Security:** Custom HTTP-only session cookies. Next.js Middleware must intercept routes and verify the session before allowing access to the Dashboard or API endpoints.
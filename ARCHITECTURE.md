# System Architecture: University Leave Management System

## Core Purpose
An automated, hierarchical Employee Leave Management System (ELMS) for teaching staff, management, and high-level administrators. 

## Core Entities & Leave Bank
1. **User / Employee:** Belongs to a specific Department (e.g., CSE, Administration) and holds a Designation (Teacher, HOD, Assistant Dean, Registrar, VC).
2. **Leave Types:** There are roughly 7 distinct types of leaves (e.g., Casual, Medical, Earned, Duty, etc.).
3. **Leave Bank (LeaveBalance):** A ledger tracking how many leaves of each type an individual user is allocated per year, how many they have taken, and their remaining balance. 
4. **Leave Request:** The application containing `fromDate`, `toDate`, `leaveType`, `reason`, and the `currentStatus` in the approval chain.

## The Dynamic Approval Hierarchy
The system routes leave applications upwards based on the applicant's designation. The college has multiple Departments (with respective HODs) but only ONE Assistant Dean, ONE Registrar, and ONE Vice Chancellor (VC).

### Standard Teaching Staff Flow
- **Teacher (e.g., CSE)** ──> **CSE HOD** ──> **Assistant Dean** ──> **Registrar** (Final Approval)

### Mid-to-High Level Staff Flow
If a higher-ranking official applies, they skip the lower tiers:
- **HOD** ──> **Assistant Dean** ──> **Registrar** (Final Approval)
- **Assistant Dean** ──> **Registrar** ──> **Vice Chancellor (VC)** (Final Approval)
- **Registrar** ──> **Vice Chancellor (VC)** (Final Approval)
- **Vice Chancellor (VC)** ──> **Logged & Auto-Approved** (or forwarded to Board/Chancellor)

### Management / Non-Teaching Staff Flow
- **Management Staff** ──> **Department Head / Manager** ──> **Registrar** 

## Technical Implementation Rules
- **Routing Logic:** The Next.js API must dynamically check the applicant's `Designation` and `Department` to determine the `nextApproverId`.
- **Leave Deduction:** Leaves are only deducted from the **Leave Bank** AFTER the final authority in the chain approves the request.
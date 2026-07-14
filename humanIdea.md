
Lets begin from the beginning
the admin we will need to build the admin dashboard or the admin view first because otherwise we wont be able to create a new user, Designation and Departments.

So how will the admin panel look like exactly, the screen will be divided into two main parts, a left side bar and a right side section where actions can be performed (by the way i should mention here that we are not going to use routes, we will mainly be changing the internal components of the right side) .
The left side panel will mainly contain three sections on the highest level

the header ( containing the name and logo of the company ) it should have a hover card saying so stuff put some placeholder there for now
The body containing the buttons ( there will be two to three sections in this part with seperate headings )
Then there will be a footer section containing a small image of the user ( a badge initially we will give it a random colour and the initials of the name ) then there will be his/her name, and email below that, if someone clicks that thing there will be something like a drop down menu with the settings and one other option ( keep that one other option as a placeholder for now )

Now that we have a high level idea of the how the left sidebar should look
we should move into the contents of the body where all of our logic will reside

because we are making the admin part first lets move with that
In the admin view, in the left side panel of the admin view there will be three sections
( i am not good with names please decide the heading and button names as you see fit)
1. the first section will contain two buttons, 
	1. the first button will be to create new leave applications
	2. the second button will be to see the current state of the leave application
2. the second section will contain action buttons
	1. add new user
	2. add new designation 
	3. add new department
	4. Then there will be button with something called heirarchy, where the admin can use that drag and drop, node like thingy to set whos leave application will go to whome, basically the manager system ( i will go in depth about this system in the later part )
3. The third section will mainly contain buttons regarding the approval or rejection of the leave applications
	1. i am calling it leave management button for now
	2. user management button ( basically will show a table containing the data of all the indivisuals that specific user manages)

Now i will explain what every button will do :
i am starting with the action buttons
1. the add new user button when clicked will open a modal which takes in 6 fields
	1. the first field will be name
	2. the second field will be email
	3. the third field will be password which will be pre filled with "UEM@123" can be changed by the admin if he deems it necessary
	4. the fourth field will be Designation, it will be basically a combobox, that will pull from the database all the designations that the admin has added, 
	5. The fifth field will be deparment, this will also be a combobox, that will pull from the database all the departments, that the admin has added,
		( after all of this is done there will be a add new user button once clicked we will save the users data in the database )
2. the add new designation button when clicked will also open a modal, the modal will contain a table with a add new button
	1. the table will contain existing designations ( pull them from the database dont catche anything ), if there are any or will prompt the admin to add a new designation.
	2. the table will contain mainly four columns, first serial number, second designation name, third a edit button , fourth a delete button
	3. and also provide a add button so that admin could add new designations
	4. new designations, or any edit or delete should reflect in the database as well
3. the add new department will have a exactly same view as the add new designation, everything will be same except for the data, that will be shown, edited etc.

 
## The Architecture So Far (Phase 1-3 & Phase 4 Blueprint)
*Added later for context preservation*

### 1. The Abstract Node Hierarchy (Role-Based Routing)
Instead of assigning User A to report to User B (which breaks when someone leaves the company), we created a `HierarchyNode` map. 
A `HierarchyNode` represents a Role, which is a combination of a `Department` and `Designation` (e.g., Department: CSE, Designation: HOD).
The visual drag-and-drop graph (`ReactFlow`) wires these nodes together. 
When a user applies for leave, the system checks their Department & Designation, finds their specific node in the graph, looks at the parent node (manager), and routes the application to `pendingAtNodeId`. Whoever occupies that parent role can approve the leave.

### 2. Leave Types & Allocations (Phase 4)
Previously, a `LeaveType` just had a `defaultDays` value (e.g., Casual Leave = 12 days). 
To support advanced constraints (e.g., a Dean getting 20 days), we introduced `LeaveAllocationRule`.
This allows the Admin to override the default limit for specific designations directly within the "Add Leave Type" UI. When a user is created, the system uses this rule to calculate their `LeaveBalance`.

### 3. Application State & Negotiations (Phase 4)
Leave applications move beyond simple Pending/Approved/Rejected.
If a manager cannot grant the exact dates, they can propose new dates. This shifts the `LeaveRequest` into a `NEGOTIATING` status. The application returns to the applicant's dashboard where they can Accept the proposed dates or Withdraw the application entirely.
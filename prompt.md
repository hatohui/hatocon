As a senior developer:

Can you add a few options here for the participants/:id page:

FEAT: PARTICIPANT MANAGEMENT

1. Should have an option to kick an user if you own the participants or is admin [action button on the member list item]. And in settings tab, there should be an option to allow transfer ownership to other members if you are the owner of the participation. If you transfer ownership, you will become a normal member and the new owner will have all the permissions that you have.

FEAT: SETTINGS AND PERMISSIONS

2. There should be a few settings that the owner can set for the participation:

- isMemberInviteAllowed: boolean (default: true) - allow members to invite other users
- isPublic: boolean (default: false) - if true, anyone can see the participation if you have the link.
- isActivityPublicVisible: boolean (default: true) - if false, the page returns 404 for non-members.
- isMemberListPublicVisible: boolean (default: true) - if false, the member list is hidden for non-members.

FEAT: APPROVAL SYSTEM

3. Following 2, there should be an approval system for joining the participation if isMemberInviteAllowed is false. If a user requests to join, the owner and current members can see the pending request and approve or reject it. If approved, the user becomes a member of the participation. If rejected, the user receives a notification that their request was rejected.

FEAT: NOTIFICATION SYSTEM

4. There should also be a notification bar for every users in Notification Table, and if there are any notifications that are not read, it shows the notification bar with the number of unread notifications. When you click the notification bar, it shows the list of notifications with the option to mark them as read. And it should support different types of notificaitons, but right now we only need types:

- "JOIN_REQUEST": when a user requests to join a participation. The notification should have the information of the user who requested and the participation they requested to join.
- "JOIN_REQUEST_APPROVED": when a user's join request is approved. The notification should have the information of the participation they joined.
- "JOIN_REQUEST_REJECTED": when a user's join request is rejected. The notification should have the information of the participation they requested to join.
- "OWNERSHIP_TRANSFERRED": when the ownership of a participation is transferred. The notification should have the information of the participation and the new owner.
- "USER_KICKED": when a user is kicked from a participation. The notification should have the information of the participation they were kicked from.
- "INVITED_TO_JOIN": when a user is invited to join a participation. The notification should have the information of the participation they were invited to join and the user who invited them.

All the above should have an action button for "ACCEPT" and "REJECT" if it's a join request, and "VIEW" for other notifications that takes you to the participation page. And when you click the action button, it should mark the notification as read. For those that don't need to accept/reject, clicking on it should just mark it as read.

Rules:

- Frontend:
  - Use React Query for data fetching and state management.
  - Use Tailwind CSS for styling.
  - Follow the existing code structure and conventions.
  - Split the codes, every components and react pages should only have ~60-80 lines of code, and if it's more than that, split it into smaller components or hooks.
  - See hooks and services and compoenents that are already implemented for reference, and try to reuse them as much as possible.
- Backend:
  - Use Next.js API routes for backend implementation.
  - Follow the existing code structure and conventions.
  - Use Prisma for database interactions.
  - Implement necessary database schema changes for the new features.
  - Ensure proper authentication and authorization for the new features.

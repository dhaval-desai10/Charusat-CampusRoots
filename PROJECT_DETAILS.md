# CampusRoots - Comprehensive Features & System Definitions Catalog 📚

> **Document Purpose**: This single, all-in-one reference file provides complete definition-type details for every feature, module, data model, API endpoint, component, user role, and configuration setting in the **CampusRoots** platform.

---

## 📑 Table of Contents
1. [Executive Summary & Core Concept](#1-executive-summary--core-concept)
2. [Feature Definitions Catalog](#2-feature-definitions-catalog)
3. [Technology Stack & Dependency Breakdown](#3-technology-stack--dependency-breakdown)
4. [Database Schema & Model Definitions](#4-database-schema--model-definitions)
5. [Complete API Endpoints Catalog](#5-complete-api-endpoints-catalog)
6. [Frontend & Admin UI Components Catalog](#6-frontend--admin-ui-components-catalog)
7. [Role-Based Access Control (RBAC) Matrix](#7-role-based-access-control-rbac-matrix)
8. [System Configurations & Environment Variables](#8-system-configurations--environment-variables)

---

## 1. Executive Summary & Core Concept

**CampusRoots** is an institutional alumni networking platform built exclusively for **Charotar University of Science and Technology (CHARUSAT)**. It bridges the gap between current students, graduated alumni, faculty members, and university administrators.

### Core Objectives:
- **Verified Network**: Restrict registration to official `@charusat.edu.in` and `@charusat.ac.in` email accounts.
- **Career Mentorship**: Facilitate job referrals, internships, and skill exchange between alumni and students.
- **Alumni Reunions**: Organize, manage, and register for batch reunions and institutional gatherings.
- **Fundraising & Legacy**: Support university growth through targeted alumni donation drives.
- **Real-Time Communication**: Enable instant peer-to-peer and group messaging with Socket.IO.
- **Nostalgia & Memories**: Showcase photos, batch memories, and throwback events in a moderated gallery.

---

## 2. Feature Definitions Catalog

### 🔐 2.1 Authentication & Security Features
- **Google OAuth 2.0 Single Sign-On (SSO)**: Allows seamless one-click authentication using official Google Workspace accounts.
- **Domain Restricted Access**: Strictly blocks any email domain other than `@charusat.edu.in` and `@charusat.ac.in`.
- **Email OTP Verification**: Provides a fallback 6-digit one-time password system sent via email for passwordless or email-verified logins.
- **Mobile OTP Verification**: Allows users to link and verify their mobile numbers via SMS OTP.
- **Session Management**: Session-based auth stored persistently in MongoDB via `connect-mongo` with HTTP-only cookies.
- **Password Encryption**: Uses `bcryptjs` for salt-and-hash encryption on local user credentials.

### 👤 2.2 Profile & Identity Management
- **Onboarding Step-Wizard**: Forces new users to complete their academic and professional profiles before granting dashboard access.
- **Role Assignment**: Distinguishes users into **Student**, **Alumni**, **Faculty**, and **Admin**.
- **Academic Metadata**: Captures Department, Graduation Batch Year, Student Enrollment ID, and Degree.
- **Professional Details**: Captures Current Employer, Designation, Total Work Experience, Skills (dynamic tags), and City/Country.
- **Social Profiles**: Links LinkedIn, GitHub, Personal Portfolio, and Contact Numbers.
- **Privacy Controls**: Granular user controls to toggle visibility of email, mobile number, company, skills, and directory listing (Public, Connections-only, Private).

### 🤝 2.3 Alumni & Student Networking
- **Alumni Directory**: Complete searchable database of all registered CHARUSAT members.
- **Multi-Filter Engine**: Filter directory cards by Department, Batch Year, Role (Alumni/Student), Current Employer, and Specific Skillsets.
- **Connection Request System**: Send, Accept, Decline, and Cancel connection requests.
- **Network Management**: View active friends/connections and unfriend connections when needed.

### 📰 2.4 Community Feed & Content
- **Social Posts Feed**: Global feed where users can publish posts, announcements, project highlights, and media photos.
- **Media File Uploads**: Upload post image attachments handled via `Multer` file processing stored in `/uploads`.
- **Interactions**: Like/Unlike posts with dynamic like counters and author profile cards.
- **Comment Threads**: Add comments to posts for active community discussions.

### 💬 2.5 Real-Time Messaging & Socket Engine
- **1-on-1 Direct Chat**: Private instant messaging between connected users.
- **Group Messaging**: Multi-user group chats for batch groups, department circles, or project teams.
- **Unread Counters**: Live update of unread message badges synchronized across open sessions.
- **Typing Indicators**: Visual typing status broadcasted when a user is typing a response.
- **Read Receipts (Seen Status)**: Tracks when messages are delivered and read by recipients.
- **Online/Offline Status**: Live online user status indicators.

### 📅 2.6 Reunions & Gatherings
- **Reunion Event Directory**: Browse upcoming and past alumni reunions.
- **Alumni Proposals**: Alumni can submit reunion ideas for batch meets or department gatherings.
- **Admin Approval Gate**: User-created reunions require admin review before appearing publicly.
- **RSVP & Registration**: Users register for events with attendee counts and optional payment gateway integration for paid events.

### 💼 2.7 Internships & Job Board
- **Job/Internship Postings**: Alumni recruiters post full-time jobs, internships, or referral opportunities.
- **Student Applications**: Students apply directly with cover notes and resume file links.
- **Application Tracking System (ATS)**: Recruiters review applications and update status (`Submitted`, `Shortlisted`, `Interviewing`, `Hired`, `Rejected`).

### 💰 2.8 Campus Fundraising & Giving
- **Donation Campaigns**: University drives for campus expansion, labs, scholarships, and innovation funds.
- **Progress Progress Bars**: Live goal calculation showing total target vs raised amounts.
- **Donor Wall & Leaderboard**: Public recognition for alumni contributors.

### 🖼️ 2.9 Photo Gallery & Flashback
- **Batch Photo Albums**: Structured photo collections sorted by graduation year and department.
- **Flashback Throwbacks**: Memory feed highlighting photos from past campus events.
- **User Memory Submissions**: Users can upload campus nostalgia photos (subject to admin approval).

### 💬 2.10 Platform Feedback & Support
- **User Feedback Portal**: Submit feature requests, bug reports, and UX reviews.
- **Status Lifecycle**: Feedback status tracked from `New` -> `In-Progress` -> `Resolved`.

### 🛡️ 2.11 Admin Control Panel
- **User Oversight**: Verify, edit, ban, or promote user accounts.
- **Content Moderation**: Moderate user posts, reported comments, and gallery submissions.
- **Event Controls**: Approve reunion listings and export RSVP attendee lists.
- **Financial Audit**: Manage donation drives and total funds collected.

---

## 3. Technology Stack & Dependency Breakdown

### 🎨 Frontend Core (`/client` & `/admin`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | 19.x | UI Component Library |
| **Vite** | 6.x | Fast Frontend Build & Development Tool |
| **React Router DOM** | 7.x | Client-Side SPA Routing Engine |
| **Tailwind CSS** | 4.x | Utility-First Responsive Styling |
| **Lucide React** | 0.475.x | Modern UI Icon Suite |
| **Axios** | 1.7.x | HTTP Client for REST API Requests |
| **Socket.IO Client** | 4.8.x | Real-Time WebSocket Client |

### ⚙️ Backend Engine (`/server`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | >= 18.x | JavaScript Server Runtime Environment |
| **Express.js** | 4.21.x | Web Framework for REST APIs |
| **Socket.IO** | 4.8.x | Real-Time Event Communication Server |
| **Mongoose** | 8.10.x | MongoDB Object Data Modeling (ODM) |
| **Passport.js** | 0.7.x | Authentication Strategy Manager |
| **passport-google-oauth20** | 2.0.x | Google OAuth 2.0 Strategy |
| **express-session** | 1.18.x | Server-side Session Middleware |
| **connect-mongo** | 5.1.x | MongoDB Session Persistence Store |
| **Multer** | 1.4.x | Form-Data & File Upload Middleware |
| **BcryptJS** | 2.4.x | Password Hashing Utility |
| **Nodemailer** | 6.10.x | SMTP Transporter for Email OTPs & Alerts |

---

## 4. Database Schema & Model Definitions

CampusRoots uses **16 distinct MongoDB collections** defined via Mongoose models:

### 1. `User` Schema
- `googleId` (String): Google OAuth identifier.
- `email` (String, Required, Unique): User email ending with `@charusat.edu.in` or `@charusat.ac.in`.
- `password` (String): Encrypted password for local auth.
- `name` (String, Required): Full name.
- `role` (String, Enum: `['student', 'alumni', 'faculty', 'admin']`): System role.
- `profilePicture` (String): Avatar image URL.
- `batch` (String): Graduation year (e.g., "2024").
- `department` (String): Academic department (e.g., "Computer Engineering").
- `currentCompany` (String): Employer company name.
- `currentRole` (String): Designation / job title.
- `skills` (Array of Strings): Dynamic tags (e.g., `["React", "Node.js"]`).
- `linkedIn`, `github`, `portfolioUrl` (String): Social links.
- `bio` (String, max 500 chars): Biography note.
- `mobileNumber` (String): Contact phone number.
- `isProfileComplete` (Boolean): Profile completion flag.
- `privacy` (Object): Settings for profile visibility, directory listing, and contact display.

### 2. `Connection` Schema
- `requester` (ObjectId -> User): User who sent the request.
- `recipient` (ObjectId -> User): Target user receiving request.
- `status` (String, Enum: `['pending', 'accepted', 'rejected']`): Status of connection.

### 3. `Post` Schema
- `author` (ObjectId -> User): Author of post.
- `content` (String, Required): Text body of post.
- `image` (String): Uploaded image path.
- `likes` (Array of ObjectId -> User): Users who liked the post.
- `comments` (Array of Objects): `{ author, text, createdAt }`.

### 4. `Conversation` Schema
- `participants` (Array of ObjectId -> User): The 2 users in direct chat.
- `lastMessage` (ObjectId -> Message): Reference to last message.
- `lastMessageAt` (Date): Timestamp of last activity.
- `unreadCounts` (Map of User -> Number): Unread count per participant.

### 5. `Message` Schema
- `conversation` (ObjectId -> Conversation): Parent conversation.
- `sender` (ObjectId -> User): Message author.
- `content` (String): Message text.
- `readBy` (Array of Objects): Users who read message + read timestamp.

### 6. `Group` Schema
- `name` (String, Required): Group name.
- `description` (String): Group details.
- `avatar` (String): Group cover/icon.
- `creator` (ObjectId -> User): Admin creator.
- `members` (Array of Objects): `{ user, role, status, joinedAt }`.
- `lastMessage` (ObjectId -> GroupMessage): Last message ref.
- `unreadCounts` (Map of User -> Number): Unread tracking.

### 7. `GroupMessage` Schema
- `group` (ObjectId -> Group): Target group.
- `sender` (ObjectId -> User): Author.
- `content` (String): Content text.
- `readBy` (Array of Objects): Read receipts.

### 8. `Reunion` Schema
- `title` (String, Required): Event title.
- `description` (String): Event summary.
- `date`, `time`, `venue` (String/Date): Event schedule & location.
- `targetBatch`, `targetDepartment` (String): Intended audience.
- `creator` (ObjectId -> User): Host user.
- `status` (String, Enum: `['pending', 'approved', 'rejected']`): Approval status.
- `rsvps` (Array of Objects): `{ user, status, guests, registrationDate }`.
- `ticketPrice` (Number): Optional registration fee.

### 9. `Internship` Schema
- `title`, `company`, `location` (String): Job metadata.
- `type` (String, Enum: `['Full-time', 'Part-time', 'Internship', 'Referral']`).
- `stipendSalary` (String): Compensation.
- `description`, `requirements` (String): Position requirements.
- `postedBy` (ObjectId -> User): Recruiter user ref.
- `deadline` (Date): Application cutoff date.
- `status` (String, Enum: `['active', 'closed']`).

### 10. `InternshipApplication` Schema
- `internship` (ObjectId -> Internship): Applied position.
- `applicant` (ObjectId -> User): Student applicant.
- `resumeUrl` (String): Link or file path to resume.
- `coverNote` (String): Cover letter.
- `status` (String, Enum: `['applied', 'shortlisted', 'rejected', 'hired']`).

### 11. `Donation` Schema
- `title`, `description` (String): Campaign details.
- `targetAmount` (Number): Goal amount.
- `raisedAmount` (Number): Currently collected amount.
- `category` (String): Category (Campus infrastructure, scholarship, etc.).
- `donors` (Array of Objects): `{ donor: User, amount: Number, transactionId: String, date: Date }`.

### 12. `Gallery` Schema
- `title` (String): Photo title.
- `imageUrl` (String, Required): Stored image URL.
- `batchYear`, `department` (String): Category metadata.
- `uploadedBy` (ObjectId -> User): Uploader.
- `isApproved` (Boolean): Moderation status.
- `likes` (Array of User refs): User likes.

### 13. `Feedback` Schema
- `user` (ObjectId -> User): Feedback submitter.
- `type` (String, Enum: `['bug', 'feature', 'general']`).
- `rating` (Number, 1-5): Star rating.
- `message` (String, Required): Review message.
- `status` (String, Enum: `['new', 'in-progress', 'resolved']`).

### 14. `Notification` Schema
- `recipient` (ObjectId -> User): Target recipient.
- `sender` (ObjectId -> User): Event initiator.
- `type` (String): Event category (`connection_request`, `message`, `post_like`, etc.).
- `referenceId` (ObjectId): Related document ID.
- `isRead` (Boolean): Read status.

### 15. `Otp` & 16. `EmailOtp` Schemas
- `email` / `mobile` (String): Recipient key.
- `otp` (String): Hashed or plain 6-digit OTP code.
- `expiresAt` (Date): 10-minute expiration timestamp.

---

## 5. Complete API Endpoints Catalog

### Authentication (`/api/auth`)
- `GET /api/auth/google` - Initiates Google OAuth authentication
- `GET /api/auth/google/callback` - Handles OAuth redirect & session creation
- `GET /api/auth/me` - Returns logged-in user profile & session data
- `POST /api/auth/login` - Local credential login
- `POST /api/auth/logout` - Destroys session & clears auth cookie

### Profile & Settings (`/api/profile` & `/api/settings`)
- `PUT /api/profile` - Updates user profile details & flags `isProfileComplete: true`
- `POST /api/profile/avatar` - Uploads user profile picture via Multer
- `GET /api/settings/privacy` - Retrieves current user privacy settings
- `PUT /api/settings/privacy` - Updates privacy preferences

### Connections & Network (`/api/connections`)
- `GET /api/connections/all` - Retrieves list of all platform members for directory
- `GET /api/connections/my-connections` - Retrieves active connections for logged-in user
- `POST /api/connections/request` - Sends connection request to target user
- `POST /api/connections/accept` - Accepts pending connection request
- `POST /api/connections/reject` - Declines connection request
- `DELETE /api/connections/cancel` - Cancels sent connection request
- `DELETE /api/connections/unfriend` - Removes an existing connection

### Posts & Community Feed (`/api/posts`)
- `GET /api/posts` - Fetches community posts feed (paginated)
- `POST /api/posts` - Creates new post (supports multipart media upload)
- `POST /api/posts/:id/like` - Toggles like status on a post
- `POST /api/posts/:id/comment` - Adds comment to a post
- `DELETE /api/posts/:id` - Deletes user's own post (or admin delete)

### Direct Chat & Groups (`/api/chat` & `/api/groups`)
- `GET /api/chat/conversations` - Gets all direct conversations for active user
- `GET /api/chat/messages/:conversationId` - Fetches message history for a conversation
- `POST /api/groups/create` - Creates new group chat
- `GET /api/groups/my-groups` - Retrieves user's joined groups
- `GET /api/groups/messages/:groupId` - Gets group message history

### Reunions & Events (`/api/reunions`)
- `GET /api/reunions` - Fetches list of approved upcoming & past reunions
- `POST /api/reunions` - Submits new reunion event proposal
- `POST /api/reunions/:id/rsvp` - Registers user RSVP for reunion

### Internships & Careers (`/api/internships`)
- `GET /api/internships` - Fetches active job and internship postings
- `POST /api/internships` - Creates new job posting (alumni/admin)
- `POST /api/internships/:id/apply` - Submits job application with resume
- `GET /api/internships/:id/applications` - Gets applicants list for recruiter
- `PUT /api/internships/applications/:appId/status` - Updates application status

### Campus Donations (`/api/donation`)
- `GET /api/donation/campaigns` - Gets all fundraising campaigns
- `POST /api/donation/process` - Processes alumni donation contribution

### Gallery & Flashbacks (`/api/gallery`)
- `GET /api/gallery` - Fetches approved memory gallery photos
- `POST /api/gallery/upload` - Uploads memory photo for admin review

### Feedback (`/api/feedback`)
- `POST /api/feedback` - Submits user platform feedback/bug report

### Admin Routes (`/api/admin`)
- `GET /api/admin/stats` - Platform dashboard metrics & aggregates
- `GET /api/admin/users` - Gets all users with verification status
- `PUT /api/admin/users/:id/verify` - Verifies or toggles user status
- `GET /api/admin/reunions/pending` - Gets pending reunion proposals
- `PUT /api/admin/reunions/:id/status` - Approves/rejects reunion
- `GET /api/admin/feedback` - Reviews user feedback submissions
- `PUT /api/admin/feedback/:id/status` - Updates feedback resolution status

---

## 6. Frontend & Admin UI Components Catalog

### 🌐 User Web Portal (`client/src/pages/`)
1. **`Login.jsx`**: Handles Google OAuth SSO trigger and Email OTP request form.
2. **`CompleteProfile.jsx`**: 5-step onboarding wizard for profile completion.
3. **`Dashboard.jsx`**: Central hub displaying platform metrics, upcoming reunions, featured jobs, and user status.
4. **`Feed.jsx`**: Main social timeline displaying post creation box, image preview, likes, and comments.
5. **`Network.jsx`**: Alumni directory featuring real-time search, multi-faceted filtering, and connection buttons.
6. **`Chat.jsx`**: Dual-pane messaging UI for 1-on-1 direct conversations and group channels with live typing indicators.
7. **`Reunions.jsx`**: Catalog of reunions with filter tabs (All, Batch-wise, My RSVPs) and proposal submission modal.
8. **`Internships.jsx`**: Job portal split into "Browse Jobs", "Post a Job", and "Applications Managed".
9. **`Donation.jsx`**: Campus fundraising portal showing goal meters, top donor leaderboard, and payment form.
10. **`Gallery.jsx`**: Grid photo gallery with modal full-screen viewer and batch photo filters.
11. **`Flashback.jsx`**: Throwback campus memories feed sorted chronologically.
12. **`UserProfile.jsx`**: Public/Private profile view showing user details, experience, skills, and connection trigger.
13. **`Settings.jsx`**: Profile edit forms, account security controls, and privacy toggles.
14. **`Feedback.jsx`**: Clean form to submit feedback rating and feature requests.

### 🛡️ Admin Control Panel (`admin/src/pages/`)
1. **`Dashboard.jsx`**: High-level platform analytics (Total Alumni, Students, Posts, Donations, Active Events).
2. **`Users.jsx`**: Tabular user management with account verification toggles and role modifiers.
3. **`Posts.jsx`**: Content moderation panel to review and delete flagged community posts.
4. **`Reunions.jsx`**: Proposal review panel to approve, edit, or reject submitted reunions.
5. **`Internships.jsx`**: Moderation table for posted jobs and recruiter oversight.
6. **`Donations.jsx`**: Campaign builder to launch new fundraising drives and view financial logs.
7. **`Gallery.jsx`**: Moderation queue for user-submitted memory photos.
8. **`Feedback.jsx`**: Support dashboard to manage platform bug reports and status updates.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Guest | Student | Alumni | Faculty | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authenticate via CHARUSAT Email** | 🔑 | 🔑 | 🔑 | 🔑 | 🔑 |
| **View Dashboard & Feed** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Post to Community Feed** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Search Alumni Directory** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Send Connection Requests** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **1-on-1 & Group Messaging** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Apply for Internships / Jobs** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Post Job / Internship Opening** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Register for Reunions (RSVP)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Propose New Reunion Event** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Donate to Campus Drives** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Create Donation Campaign** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Approve Reunions & Photos** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Verify / Ban User Accounts** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. System Configurations & Environment Variables

### Server Configuration (`server/.env`)
```env
# Database & Network
DB_URL=mongodb://127.0.0.1:27017/campusroots
PORT=5000

# Authentication & Security
JWT_SECRET=CampusRootsSecretKey2026
JWT_EXPIRES_IN=7d
SESSION_SECRET=CampusRootsSessionSecretKey2026

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend Application URLs
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Email Transporter (SMTP for Email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@campusroots.edu.in
SMTP_PASS=your-smtp-app-password
```

### Client Configuration (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---
*End of Details Documentation — CampusRoots Platform*

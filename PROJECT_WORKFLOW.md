# CampusRoots - End-to-End System Workflow & Architecture Documentation 🎓

> **System Overview**: CampusRoots is a full-stack alumni networking and community engagement platform built specifically for **CHARUSAT** (Charotar University of Science and Technology). It connects alumni, current students, faculty, and university administrators in a verified, secure environment.

---

## 📑 Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Authentication & Onboarding Workflow](#2-authentication--onboarding-workflow)
3. [User Profile Setup & Management Workflow](#3-user-profile-setup--management-workflow)
4. [Alumni & Student Networking Workflow](#4-alumni--student-networking-workflow)
5. [Community Feed & Content Engagement Workflow](#5-community-feed--content-engagement-workflow)
6. [Real-Time Direct & Group Messaging Workflow](#6-real-time-direct--group-messaging-workflow)
7. [Reunion Event & Gathering Workflow](#7-reunion-event--gathering-workflow)
8. [Internship & Placement Portal Workflow](#8-internship--placement-portal-workflow)
9. [Campus Fundraising & Donation Workflow](#9-campus-fundraising--donation-workflow)
10. [Gallery & Memory Flashback Workflow](#10-gallery--memory-flashback-workflow)
11. [Platform Feedback & Support Workflow](#11-platform-feedback--support-workflow)
12. [Admin Moderation & Management Workflow](#12-admin-moderation--management-workflow)
13. [Real-Time Notification Engine Workflow](#13-real-time-notification-engine-workflow)

---

## 1. High-Level System Architecture

CampusRoots operates on a **three-tier architectural model** comprising two client applications (User Web Portal & Admin Control Panel), a central Node.js/Express REST & WebSocket backend server, and a MongoDB database storage layer.

```mermaid
graph TD
    subgraph Client Applications
        A[Alumni/Student Client Portal<br/>Vite + React 19 + Tailwind]
        B[Admin Control Panel<br/>Vite + React 19 + Tailwind]
    end

    subgraph Server Tier - Node.js & Express
        C[Express REST API Engine<br/>Port 5000]
        D[Passport.js Auth & Session Handler]
        E[Socket.IO Real-Time Messaging Server]
        F[Multer File & Media Processor]
    end

    subgraph Database & Persistence Tier
        G[(MongoDB Database<br/>CampusRoots DB)]
        H[(MongoStore Session DB)]
    end

    subgraph External Services
        I[Google Cloud OAuth 2.0]
        J[Nodemailer / SMTP Email Service]
    end

    A -->|HTTP / REST API| C
    B -->|HTTP / REST API| C
    A <-->|WebSocket Connection| E
    B <-->|WebSocket Connection| E
    
    C --> D
    D -->|OAuth Verify| I
    C -->|Send Verification/Alerts| J
    
    C -->|Read/Write Schemas| G
    C -->|Session State| H
    F -->|Uploads Storage| C
```

---

## 2. Authentication & Onboarding Workflow

CampusRoots strictly restricts user access to verified CHARUSAT institution members using domain-validated email addresses (`@charusat.edu.in` and `@charusat.ac.in`).

### 2.1 Google OAuth 2.0 Login Workflow
```mermaid
sequenceDiagram
    autonumber
    actor User as Alumni / Student
    participant Client as React Client (Port 5173)
    participant Server as Express Server (Port 5000)
    participant Google as Google OAuth 2.0
    participant DB as MongoDB Database

    User->>Client: Click "Sign in with Google"
    Client->>Server: GET /api/auth/google
    Server->>Google: Redirect to Google OAuth Consent Screen
    Google->>User: Prompt for @charusat email credentials
    User->>Google: Authenticate & Authorize
    Google->>Server: GET /api/auth/google/callback (with Auth Code)
    
    alt Email domain is NOT @charusat.edu.in or @charusat.ac.in
        Server->>Client: Redirect to /login?error=invalid_domain
        Client->>User: Display "Only CHARUSAT emails allowed" toast error
    else Domain is Valid
        Server->>DB: Search User by googleId or email
        alt New User
            Server->>DB: Create User (isVerified: true, profileCompleted: false)
        else Existing User
            Server->>DB: Update lastLogin date
        end
        Server->>Server: Express Session created (MongoStore)
        Server->>Client: Redirect to Client App (/dashboard or /complete-profile)
        Client->>Server: GET /api/auth/me (Check Session & Profile Status)
        Server-->>Client: Return User Object
    end
```

### 2.2 Email OTP Verification Workflow (Alternative Onboarding)
```mermaid
sequenceDiagram
    autonumber
    actor User as New User
    participant Client as React Client
    participant Server as Express Server
    participant DB as MongoDB Database
    participant Mail as SMTP Mailer

    User->>Client: Enter Email (@charusat.edu.in) & Request OTP
    Client->>Server: POST /api/email-otp/send-otp { email }
    Server->>Server: Validate CHARUSAT Domain
    Server->>DB: Generate 6-digit OTP code with 10-min expiration
    Server->>Mail: Send Email containing OTP code
    Mail-->>User: Deliver OTP Email
    User->>Client: Enter 6-digit OTP code
    Client->>Server: POST /api/email-otp/verify-otp { email, otp }
    Server->>DB: Verify OTP against stored hash & expiration
    alt OTP Valid
        Server->>DB: Mark Email Verified & Create/Update User Session
        Server-->>Client: Return Success Token & Redirect to /complete-profile
    else OTP Invalid or Expired
        Server-->>Client: Return 400 Bad Request ("Invalid OTP")
    end
```

---

## 3. User Profile Setup & Management Workflow

Upon initial login, users with `profileCompleted: false` are forced into the setup flow before accessing the main dashboard.

```mermaid
flowchart TD
    A[User Logged In] --> B{profileCompleted == true?}
    B -- Yes --> C[Redirect to /dashboard]
    B -- No --> D[Redirect to /complete-profile]

    D --> E[Step 1: Select Role - Student vs Alumni]
    E --> F[Step 2: Core Academic Details<br/>Department, Graduation Batch, Student/Enrollment ID]
    F --> G[Step 3: Professional Info<br/>Current Company, Job Role, Experience, Location]
    G --> H[Step 4: Profile Details & Bio<br/>Skills Tags, Bio, Contact Mobile]
    H --> I[Step 5: Social Media & Media<br/>LinkedIn, GitHub, Portfolio, Profile Picture]
    
    I --> J[Submit Profile Form - PUT /api/profile]
    J --> K[Server validates required fields]
    K --> L[Update MongoDB User document: profileCompleted = true]
    L --> M[Redirect to /dashboard with full navigation enabled]
```

---

## 4. Alumni & Student Networking Workflow

The networking subsystem allows users to search, filter, send, accept, reject, or unfriend connections within the institution.

### 4.1 Search & Filter Flow
```mermaid
flowchart LR
    A[User visits /network] --> B[Client fetches /api/connections/all]
    B --> C[Filters Applied by User]
    
    C -->|Text Query| D[Name / Skills Search]
    C -->|Dropdown| E[Filter by Department]
    C -->|Dropdown| F[Filter by Graduation Batch]
    C -->|Toggle| G[Filter by Role: Alumni / Student]
    C -->|Company Query| H[Filter by Current Employer]

    D & E & F & G & H --> I[MongoDB Query Executed]
    I --> J[Return Filtered User Cards]
```

### 4.2 Connection Request Lifecycle
```mermaid
stateDiagram-v2
    [*] --> NoConnection: User A views User B's profile
    NoConnection --> Pending: User A clicks "Connect" (POST /api/connections/request)
    
    state Pending {
        [*] --> RequestSent: Socket notification emitted to User B
        RequestSent --> Accepted: User B clicks "Accept" (POST /api/connections/accept)
        RequestSent --> Rejected: User B clicks "Decline" (POST /api/connections/reject)
        RequestSent --> Withdrawn: User A clicks "Cancel Request" (DELETE /api/connections/cancel)
    }

    Rejected --> NoConnection
    Withdrawn --> NoConnection
    Accepted --> Connected: Both users added to each other's network
    Connected --> NoConnection: Either user clicks "Unfriend" (DELETE /api/connections/unfriend)
```

---

## 5. Community Feed & Content Engagement Workflow

The Feed allows alumni and students to share updates, news, job leads, and media images with likes and threaded discussions.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Author
    participant Client as React Client (/feed)
    participant Server as Express Server (/api/posts)
    participant Multer as File Storage Middleware
    participant DB as MongoDB Database

    %% Creating a Post
    User->>Client: Writes Post Content & selects Image File
    Client->>Server: POST /api/posts (multipart/form-data)
    Server->>Multer: Process & save uploaded image file to /uploads
    Multer-->>Server: Return stored file path
    Server->>DB: Create Post document (author, content, image, likes: [], comments: [])
    Server-->>Client: Return newly created Post
    Client->>User: Prepend new post to top of Feed

    %% Liking a Post
    User->>Client: Clicks "Like" on Post
    Client->>Server: POST /api/posts/:id/like
    Server->>DB: Toggle user ID in post.likes array
    Server-->>Client: Return updated like count & user liked status
    Client->>User: Animate Heart Icon & Update Like Counter

    %% Commenting on a Post
    User->>Client: Types comment & submits
    Client->>Server: POST /api/posts/:id/comment { text }
    Server->>DB: Push comment object into post.comments array
    Server-->>Client: Return updated comments list
    Client->>User: Render new comment immediately
```

---

## 6. Real-Time Direct & Group Messaging Workflow

CampusRoots features instantaneous 1-on-1 and group chat powered by **Socket.IO** room subscriptions.

### 6.1 Direct Messaging Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Sender as Sender (User A)
    participant ClientA as Client App A
    participant SocketServer as Socket.IO Server
    participant DB as MongoDB Database
    participant ClientB as Client App B
    actor Recipient as Recipient (User B)

    Sender->>ClientA: Selects User B & types message
    ClientA->>SocketServer: Emit 'conversation:join' (Room: `conversation:ID`)
    ClientA->>SocketServer: Emit 'message:send' { conversationId, senderId, recipientId, content, tempId }
    
    SocketServer->>DB: Save Message & Update Conversation (lastMessage, lastMessageAt)
    SocketServer-->>ClientA: Ack 'message:sent' (replaces temp message ID with real DB _id)
    
    SocketServer->>ClientB: Broadcast 'message:received' to room `conversation:ID`
    SocketServer->>ClientB: Emit 'message:unread-count' to personal room `user:UserB_ID`
    ClientB-->>Recipient: Show message & play sound / show badge counter

    Recipient->>ClientB: Opens chat screen
    ClientB->>SocketServer: Emit 'message:read' { conversationId, userId: UserB }
    SocketServer->>DB: Update readBy array & reset unread counter
    SocketServer->>ClientA: Emit 'message:seen' (Updates checkmark status to Seen)
```

### 6.2 Group Messaging Workflow
```mermaid
flowchart TD
    A[User creates Group Chat] --> B[POST /api/groups/create]
    B --> C[DB creates Group schema with members list]
    C --> D[Socket emits 'group:invite:notify' to all members]
    
    D --> E[Member opens Chat page]
    E --> F[Client emits 'groups:join-all' to join all group socket rooms]
    
    F --> G[Member sends message]
    G --> H[Socket emits 'group:message:send']
    H --> I[Message saved in GroupMessage DB schema]
    I --> J[Broadcast 'group:message:received' to room group:GroupID]
    J --> K[Update unread counters for all offline group members]
```

---

## 7. Reunion Event & Gathering Workflow

The Reunion module facilitates batch reunions, department gatherings, and university-wide alumni meets.

```mermaid
flowchart TD
    subgraph Event Creation & Approval Phase
        A[Alumni or Admin creates Reunion Proposal] --> B[POST /api/reunions]
        B --> C{Created by Admin?}
        C -- Yes --> D[Status = Approved & Published]
        C -- No --> E[Status = Pending Admin Review]
        E --> F[Admin reviews proposal in Admin Panel]
        F -->|Approve| D
        F -->|Reject| G[Status = Rejected]
    end

    subgraph Event Registration & Ticket Phase
        D --> H[Users view published Reunion on /reunions]
        H --> I[User clicks 'Register / RSVP']
        I --> J{Event Paid or Free?}
        J -- Free --> K[Register RSVP directly - POST /api/reunions/:id/rsvp]
        J -- Paid --> L[Trigger Payment Gateway Integration]
        L --> M[Payment Successful]
        M --> K
        K --> N[Create RSVP record & generate Ticket confirmation]
        N --> O[Send confirmation Email to User]
    end
```

---

## 8. Internship & Placement Portal Workflow

The Internship module allows alumni to post hiring opportunities, job openings, and referral opportunities for current students and junior alumni.

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Alumni Recruiter
    participant Client as Client Application
    participant Server as Backend API (/api/internships)
    participant DB as MongoDB Database
    actor Applicant as Student Applicant

    %% Posting Internship
    Recruiter->>Client: Fills Job Posting Form (Title, Company, Stipend, Skills, Deadline)
    Client->>Server: POST /api/internships
    Server->>DB: Save Internship (Status: Active)
    Server-->>Client: Return Success & List Opportunity

    %% Student Application
    Applicant->>Client: Browses /internships & selects position
    Applicant->>Client: Attaches Resume URL/File & Cover note
    Client->>Server: POST /api/internships/:id/apply
    Server->>DB: Create InternshipApplication record & increment applicant count
    Server-->>Client: Confirm Application Submitted

    %% Recruiter Application Review
    Recruiter->>Client: Views "Applications Received" tab
    Client->>Server: GET /api/internships/:id/applications
    Server-->>Client: Return Applicant details & resume links
    Recruiter->>Client: Updates applicant status (Shortlisted / Interviewing / Hired / Rejected)
    Client->>Server: PUT /api/internships/applications/:appId/status
    Server->>DB: Update status
    Server->>Applicant: Send Notification of Status Change
```

---

## 9. Campus Fundraising & Donation Workflow

Alumni can give back to university initiatives, infrastructure projects, scholarships, and student innovation funds.

```mermaid
flowchart LR
    A[Admin creates Donation Campaign] --> B[Published on /donations]
    B --> C[Alumni views campaign goals & raised amount]
    C --> D[Alumni enters Donation Amount & Message]
    D --> E[Selects Payment Method: UPI / Card / NetBanking]
    E --> F[Executes Transaction]
    F --> G[POST /api/donation/process]
    
    G --> H[MongoDB updates Campaign raisedAmount & donors count]
    H --> I[Record added to Donor Wall & Leaderboard]
    I --> J[Tax Exemption Receipt PDF generated & emailed to Alumni]
```

---

## 10. Gallery & Memory Flashback Workflow

CampusRoots maintains nostalgia through campus memory archives, batch photos, throwback galleries, and event media.

```mermaid
flowchart TD
    A[User visits /gallery or /flashback] --> B{Select View Mode}
    
    B -->|Batch Archives| C[Filter photos by Batch Year & Department]
    B -->|Throwback Memories| D[Randomized/Date-matched Flashback timeline]
    B -->|Submit New Photo| E[Upload memory with title, year & tags]
    
    E --> F[POST /api/gallery/upload]
    F --> G[Pending Moderation Queue]
    G --> H[Admin approves photo]
    H --> I[Photo appears in Public Campus Gallery]
    
    C & D --> J[Users can Like, Share, and Comment on gallery photos]
```

---

## 11. Platform Feedback & Support Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Platform User
    participant Client as React Client (/feedback)
    participant Server as API Server (/api/feedback)
    participant DB as MongoDB Database
    actor Admin as System Administrator

    User->>Client: Select Feedback Type (Bug, Feature Request, General)
    User->>Client: Type detail rating & description
    Client->>Server: POST /api/feedback
    Server->>DB: Create Feedback document (Status: New)
    Server-->>Client: Return Confirmation Toast

    Admin->>Client: Opens Admin Panel -> Feedback Section
    Client->>Server: GET /api/admin/feedback
    Server-->>DB: Query all feedback items
    Server-->>Client: Return feedback catalog
    Admin->>Client: Updates status to 'In-Progress' or 'Resolved'
    Client->>Server: PUT /api/admin/feedback/:id/status
    Server->>DB: Update database record
```

---

## 12. Admin Moderation & Management Workflow

The Admin Panel operates on a dedicated portal (`/admin` app running on port 5174 or 5175) to oversee the entire platform ecosystem.

```mermaid
flowchart TD
    A[Admin Login - /admin/login] --> B[Backend checks req.user.role == 'admin']
    B -->|Authorized| C[Admin Dashboard Opened]
    B -->|Unauthorized| D[Deny Access - 403 Forbidden]

    C --> E[User Management]
    C --> F[Content Moderation]
    C --> G[Event Management]
    C --> H[Fundraising Controls]
    C --> I[System Analytics]

    E --> E1[Verify Student/Alumni Accounts]
    E --> E2[Toggle User Status / Ban Accounts]

    F --> F1[Delete reported posts or spam comments]
    F --> F2[Moderate uploaded gallery images]

    G --> G1[Approve / Reject alumni-submitted Reunions]
    G --> G2[Manage RSVP lists & ticket downloads]

    H --> H1[Create new campus donation drives]
    H --> H2[Export financial donation reports]

    I --> I1[View total registered users, active connections, total funds raised]
```

---

## 13. Real-Time Notification Engine Workflow

```mermaid
flowchart TD
    A[Platform Event Occurs] --> B{Event Type}
    
    B -->|Connection Request| C[Target: Requested User]
    B -->|New Message| D[Target: Chat Recipient]
    B -->|Post Like / Comment| E[Target: Post Author]
    B -->|Application Status Change| F[Target: Job Applicant]
    B -->|Event Approval| G[Target: Event Creator]

    C & D & E & F & G --> H[Create Notification Document in DB]
    H --> I{Is Target User Online?}
    I -- Yes --> J[Socket Server emits event to room `user:targetUserId`]
    I -- No --> K[Store as Unread in DB]
    J --> L[Client displays bell badge & toast popup]
    K --> M[User logs in -> GET /api/notifications -> renders unread list]
```

---
*End of Workflow Documentation — CampusRoots Platform*

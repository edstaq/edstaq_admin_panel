# Edstaq Database Schema Reference

This document outlines the full schema and relations for the Edstaq scheduling and capacity engine. Data is sourced live from Google Sheets via Google Apps Script web app endpoint (`action=all`).

---

## 1. Google Spreadsheets Overview

| Database / Spreadsheet | Sheet / Tab Name | Primary Key | Key Relationships |
| :--- | :--- | :--- | :--- |
| **HR & Sales** | `Teacher` | `Teacher ID` | Links to `Teacher Availability` and `Teacher Assign` |
| **HR & Sales** | `Teacher Availability` | `Available ID` | `Teacher ID` $\rightarrow$ `Teacher` |
| **HR & Sales** | `Subjects` | `Subject ID` | `Subject ID` $\rightarrow$ `Teacher` (`Subjects ID(s)`), `Teacher Assign` |
| **HR & Sales** | `Teacher Review` | `Session Id` + `Student Id` | `Teacher ID` $\rightarrow$ `Teacher`, `Session Id` $\rightarrow$ `Class Master` |
| **HR & Sales** | `Teacher Decline` | Timestamp / ID | `Teacher ID` $\rightarrow$ `Teacher` |
| **Classroom & Session Mng** | `Teacher Assign` | `Teacher Assign ID` | `Teacher ID` $\rightarrow$ `Teacher`, `Subject ID` $\rightarrow$ `Subjects` |
| **Classroom & Session Mng** | `Class Master` | `Session ID` | `Teacher Assign ID` $\rightarrow$ `Teacher Assign` |

---

## 2. Table Schemas

### Table 1: `Teacher` (Spreadsheet: *HR & Sales*)
Stores teacher profiles, qualifications, and operational status.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Date` | String (Date) | Date profile created / updated (e.g. `14-Sep-2025`) |
| `Teacher ID` | String (**PK**) | Unique teacher code (e.g. `TCH101`) |
| `Name` | String | Teacher's full name |
| `Contact` | String | Contact phone / mobile number |
| `Password` | String | Portal authentication password |
| `Subjects ID(s)` | String (CSV) | Comma-separated list of qualified Subject IDs (e.g. `SUB124, SUB127`) |
| `Onboarded Date` | String (Date) | Date onboarding was finalized |
| `Documents Submitted` | String / Boolean | Verification status of submitted certificates/ID |
| `Available ID(s)` | String (CSV) | Associated availability block IDs |
| `Address` | String | Physical residential address |
| `Teacher wage / session`| Number | Payment per session (standard 75m class) |
| `Rating` | Number | Performance rating (1 to 5 scale) |
| `Teach Lang` | String (CSV) | Languages the teacher can teach in (e.g. `English, Malayalam`) |
| `Status` | String | Operational status (`Active`, `In-Active`, etc.) |
| `Edit Access` | Boolean | Permission flag (`TRUE` / `FALSE`) |
| `Mail` | String | Email address |
| `Remark` | String | Internal notes / comments |
| `Disciplinary score` | Number | Disciplinary tracking score |

---

### Table 2: `Teacher Availability` (Spreadsheet: *HR & Sales*)
Stores the recurring weekly availability windows for each teacher.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Available ID` | String (**PK**) | Unique identifier for availability slot (e.g. `TAV115`) |
| `Teacher ID` | String (**FK**) | References `Teacher['Teacher ID']` |
| `Weekday` | String | Day of week (`Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`) |
| `Start Time` | String (Time) | Slot start time (12h/24h format, e.g. `07:00 pm` or `19:00:00`) |
| `End Time` | String (Time) | Slot end time (12h/24h format, e.g. `09:00 pm` or `21:00:00`) |

---

### Table 3: `Subjects` (Spreadsheet: *HR & Sales*)
The master academic catalog of courses, boards, and grade levels.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Subject ID` | String (**PK**) | Unique subject code (e.g. `SUB101`) |
| `Category` | String | Academic category (`School`, `Competitive`, `Language`, etc.) |
| `Board` | String | Educational curriculum board (`CBSE`, `ICSE`, `Kerala`, `Cambridge`, `Edexcel`) |
| `Level` | String | Level bracket (`LP`, `UP`, `HS`, `HSS`, `IGCSE`, `A Level`) |
| `Department` | String | Academic department (`Science`, `Commerce`, `Humanities`, etc.) |
| `Stage` | String | Grade / Class (e.g. `Class 1`, `Class 6`, `Class 10`) |
| `Subject Name` | String | Name of the subject (e.g. `MATHS`, `ENGLISH`, `PHYSICS`) |
| `Subject Description` | String | Syllabus / topic details |
| `Subject Code` | String | Official academic code |
| `Tags` | String | Search tags |
| `Status` | String | Catalog status (`Active`, `Inactive`) |
| `Label` | String | Composite display label (e.g. `Class 6 - MATHS (Kerala)`) |
| `Student price` | Number | Cost charged to students per session |
| `Teacher ID(s)` | String / Number | Count or IDs of teachers mapped |
| `Source` | String (URL) | Link to textbook/curriculum source |

---

### Table 4: `Teacher Assign` (Spreadsheet: *Classroom & Session Mng*)
Active recurring class bookings and student assignments.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Teacher Assign ID` | String (**PK**) | Unique assignment code (e.g. `TAS101`) |
| `Class Room ID` | String | Identifier / room title (e.g. `edstaq c6 safa`) |
| `Meet Link` | String (URL) | Virtual meeting room link (Google Meet) |
| `Subject ID` | String (**FK**) | References `Subjects['Subject ID']` |
| `Student ID` | String (**FK**) | Enrolled student reference |
| `Teacher ID` | String (**FK**) | References `Teacher['Teacher ID']` |
| `Start Date` | String (Date) | Class schedule start date (`YYYY-MM-DD`) |
| `Sessions per day` | Number | Number of sessions conducted per scheduled day |
| `Start Time` | String (Time) | Scheduled class start time (e.g. `07:00pm`) |
| `End Time` | String (Time) | Scheduled class end time (e.g. `08:15pm`) |
| `Days` | String (CSV) | Comma-separated scheduled days (e.g. `Monday, Wednesday, Friday`) |
| `Status` | String | Class status (`Active`, `HOLD`, `Closed`) |
| `Week Cycle` | Number | Frequency cycle in weeks |
| `End Date Req` | String (Date) | Optional requested end date |
| `Class Count Req` | Number | Total target classes requested |
| `Student Limit` | Number | Max student capacity (e.g. `1` for 1-on-1, `5` for group) |
| `Classes Payment Mode`| String | Billing mode (`After`, `Prepaid`) |
| `Period in Days` | Number | Duration period |
| `Interactive Session` | Boolean | Flag for live interactive format (`TRUE`/`FALSE`) |
| `Status Summary` | String | Summary description |
| `Payment Note` | String | Notes regarding billing |
| `Neurostack` | Boolean / String | Integrated platform indicator |
| `Subscriptions` | String | Subscription package metadata |

---

### Table 5: `Class Master` (Spreadsheet: *Classroom & Session Mng*)
Individual conducted session logs and class instance history.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Session ID` | String (**PK**) | Unique session code (e.g. `AAA5E1D6`) |
| `Session Temp Id` | String | Composite identifier (`<AssignID>_<Date>_<Time>`) |
| `Class Room ID` | String | Reference to classroom name |
| `Teacher Assign ID` | String (**FK**) | References `Teacher Assign['Teacher Assign ID']` |
| `Student ID` | String (**FK**) | Student ID |
| `Subject ID` | String (**FK**) | Subject ID |
| `Teacher ID` | String (**FK**) | Teacher ID |
| `Date` | String (Date) | Class execution date (`DD/MM/YYYY`) |
| `Start Time` | String (Time) | Session start time (`19:00:00`) |
| `End Time` | String (Time) | Session end time (`20:15:00`) |
| `Status` | String | Execution status (`Completed`, `Scheduled`, `Cancelled`) |
| `Sessions per day` | Number | Sessions on date |
| `Student Limit` | Number | Classroom capacity |
| `Subject label` | String | Composite subject label |
| `Subject name` | String | Subject name |
| `Class link` | String (URL) | Meeting URL |
| `Topic covered` | String | Curriculum topics covered during session |
| `Started Time` | String (Time) | Timestamp teacher started call |
| `Ended Time` | String (Time) | Timestamp call finished |
| `Verify` | String | Verification status (`Verified`, `Pending`) |
| `Neurostack` | Boolean / String | Platform tracking |
| `Note` | String | Session observations |
| `Subscriptions` | String | Subscription details |

---

### Table 6: `Teacher Review` (Spreadsheet: *HR & Sales*)
Stores student ratings and feedback submitted after session execution.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Timestamp` | String (DateTime)| Timestamp when review was submitted |
| `Session Id` | String (**FK**) | References `Class Master['Session ID']` |
| `Student Id` | String (**FK**) | References student submitting review |
| `Teacher Id` | String (**FK**) | References `Teacher['Teacher ID']` |
| `Rating` | Number | Rating on a 1–5 scale |
| `Comment` | String | Optional qualitative student feedback |

---

### Table 7: `Teacher Decline` (Spreadsheet: *HR & Sales*)
Tracks instances where a teacher declines, rejects, or fails to take up an offered class booking, along with policy compliance tracking.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `Timestamp` | String (DateTime)| Date and time when the decline was logged (`YYYY-MM-DD HH:mm:ss`) |
| `Teacher ID` | String (**FK**) | References `Teacher['Teacher ID']` (e.g. `TCH101`) |
| `Teacher Name` | String | Name of the teacher |
| `Reason` | String | Category or specific explanation (e.g. `Schedule / Time Conflict`, `Health Issue`, `Unreachable`) |
| `Policy Violation` | Boolean / String | `TRUE` / `FALSE` flag indicating whether the decline violated company operational policies |
| `Student / Subject Note` | String | Context regarding student or subject associated with the booking attempt |
| `Remarks` | String | Admin notes, disciplinary warnings, or follow-up details |

---

## 3. Core Engine Logic: How Tables Are Computed

1. **Active Teachers**: Filters `Teacher` where `Status.toLowerCase() === 'active'`.
2. **Subject Mapping**: Maps each teacher's `Subjects ID(s)` string to the `Subjects` catalog to identify their Boards, Stages, Levels, and Categories.
3. **Availability Projection**: For each active teacher across the rolling window (e.g. 7 days), extracts `Teacher Availability` matching the weekday.
4. **Interval Subtraction**: For each date, finds overlapping bookings from `Teacher Assign` where status is `Active` or `HOLD`. Subtracts occupied intervals from the teacher's availability windows to obtain **Remaining Free Slots**.
5. **Vacant Sessions**: For each continuous free slot, calculates $\lfloor \frac{\text{Duration}}{75} \rfloor$ (or user-defined session duration) to yield bookable class capacity.
6. **Teacher Performance Rating per Session**:
   - **Step 1 (Session Average)**: In group or individual classes, multiple students may submit reviews for the same session. Compute average rating for each unique session:
     $$R_{\text{session}} = \frac{\sum_{i=1}^k \text{Rating}_i}{k}$$
   - **Step 2 (Teacher Overall Rating)**: For each teacher with $N$ reviewed sessions, compute their overall performance rating as the arithmetic mean across all session averages:
     $$R_{\text{teacher}} = \frac{\sum_{s=1}^N R_{\text{session}, s}}{N}$$
   - **Display**: Displayed as a Flipkart-style badge with star rating (e.g. `4.4 ★`) along with reviewed session count (e.g. `30 sessions`) and review count. Strictly displays `No reviews` if no reviews exist in `Teacher Review` tab.
7. **Teacher Declines & Policy Violations**:
   - Each decline logged against a teacher is aggregated to compute **Total Declines** (`declinesCount`).
   - If any decline has `policyViolation === true`, the teacher is flagged with `hasPolicyViolation = true` and `policyViolationsCount`.
   - The far-right action button displays `Declines (X)` and highlights in red with a warning icon if policy violations exist. Admins can view the full decline history and log new ones directly from the modal.

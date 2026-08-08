# Exam Platform — System Requirements Document

**Stack:** Node.js, Express 5, MongoDB, Mongoose
**Architecture:** Layered (routes → controllers → services → models)

---

## 1. Overview

A college exam platform limited to four departments: `cs`, `it`, `is`, `general`. The platform's only function is exam creation, delivery, and grading — there is no lecture content, no course material, and no dashboards of any kind.

Three roles exist in a **single `User` collection**, distinguished by a `role` field: `student`, `instructor`, `pending_instructor`, `admin`.

---

## 2. Roles & Permissions

| Role           | Can do                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Student**    | Register/login, view exams matching their own department + year, start and submit an exam (once), view their own submission history and detailed results                             |
| **Instructor** | Register/login, create exams (limited to subjects they are approved for), edit their own exam's questions/schedule (only before `opensAt`), view all submissions for their own exams |
| **Admin**      | View all exams and submissions across the whole platform, approve/reject instructor requests, manage the `Subject` list, hard-delete any exam (cascades to its submissions)          |

### Role transitions

- Every new signup defaults to `role: student`. Users **cannot** self-select a role at signup.
- A student may request to become an instructor. This sets `role: pending_instructor`.
- An admin approves the request, which updates `role: instructor` in place (no document migration, since all roles live in one collection).
- Admins are never created through public signup — only via a seed script or by an existing admin.

---

## 3. Functional Requirements

### 3.1 Student

- FR-1: Register an account (default role: student), providing department and year.
- FR-2: Log in / authenticate.
- FR-3: View the list of exams available to them (matching their own `department` + `year`, currently open — i.e., `opensAt <= now <= closesAt`).
- FR-4: Start an exam — creates an `ExamAttempt` record; a student may only start a given exam once.
- FR-5: Submit an exam before their effective deadline (`min(attempt.startedAt + exam.durationMinutes, exam.closesAt)`). Submission is rejected if the deadline has passed, or if a submission for this exam already exists.
- FR-6: View a list of all exams they have submitted, showing subject name, exam type, and score.
- FR-7: Open any of their own past submissions to view a per-question breakdown: their selected answer, whether it was correct, and the correct answer.

### 3.2 Instructor

- FR-8: Log in / authenticate.
- FR-9: Request promotion from student to instructor (sets `role: pending_instructor`, pending admin approval).
- FR-10: Create a new exam, selecting a subject from their own approved subject list only. Department and year are derived from the selected subject.
- FR-11: Add questions (MCQ or True/False) to an exam, each with its own point value.
- FR-12: Edit an exam's questions, points, or schedule — **only while `Date.now() < exam.opensAt`**. This is computed live on every edit request, not stored as a flag. Setting a new future `opensAt` re-enables editing.
- FR-13: View the list of exams they have created.
- FR-14: View all submissions for a given exam of theirs, including each student's total score and a full per-question breakdown.

### 3.3 Admin

- FR-15: Approve or reject a `pending_instructor` request.
- FR-16: Create/manage entries in the `Subject` collection, and assign subjects to instructors.
- FR-17: View any exam or submission on the platform, regardless of owner.
- FR-18: Hard-delete an exam. This **cascades**: deleting an exam also deleters all `Submission` and `ExamAttempt` documents referencing it. No data related to a deleted exam is retained.

---

## 4. Data Model

### 4.1 `User`

| Field        | Type                     | Required    | Notes                                                                                                                      |
| ------------ | ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `name`       | String                   | Yes         |                                                                                                                            |
| `email`      | String                   | Yes         | Unique                                                                                                                     |
| `password`   | String                   | Yes         | Hashed before storage                                                                                                      |
| `role`       | String enum              | Yes         | `student` \| `pending_instructor` \| `instructor` \| `admin`. Default: `student`                                           |
| `department` | String enum              | Conditional | Required only when `role === 'student'`. One of `cs`/`it`/`is`/`general`                                                   |
| `year`       | Number (1–4)             | Conditional | Required only when `role === 'student'`                                                                                    |
| `subjects`   | [ObjectId ref `Subject`] | No          | Only meaningful for `instructor`/`pending_instructor`; the list of subjects this instructor is approved to create exams in |
| `createdAt`  | Date                     | Auto        |                                                                                                                            |

> Note: instructors are **not** tied to a department directly. Their department affiliation is implicit, via the department of each subject in their `subjects` list. An instructor may hold subjects across more than one department.

### 4.2 `Subject`

| Field        | Type         | Required | Notes                              |
| ------------ | ------------ | -------- | ---------------------------------- |
| `name`       | String       | Yes      | e.g. "Data Structures"             |
| `department` | String enum  | Yes      | `cs` \| `it` \| `is` \| `general`  |
| `year`       | Number (1–4) | Yes      | The year this subject is taught to |

- Managed by admins only — instructors cannot create arbitrary subjects.
- Unique on `(name, department, year)` to avoid duplicate entries.

### 4.3 `Exam`

| Field             | Type                   | Required | Notes                                                                                                                       |
| ----------------- | ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `instructorId`    | ObjectId ref `User`    | Yes      |                                                                                                                             |
| `subjectId`       | ObjectId ref `Subject` | Yes      | Must be one of `instructor.subjects`                                                                                        |
| `department`      | String enum            | Yes      | Denormalized copy of `subject.department`, set at creation time — avoids a populate() on every "list available exams" query |
| `year`            | Number (1–4)           | Yes      | Denormalized copy of `subject.year`, same reason as above                                                                   |
| `examType`        | String enum            | Yes      | `midterm` \| `final` \| `practical` \| `quiz-chapter`                                                                       |
| `opensAt`         | Date                   | Yes      | Must be before `closesAt`                                                                                                   |
| `closesAt`        | Date                   | Yes      |                                                                                                                             |
| `durationMinutes` | Number                 | Yes      | Per-student time limit once started                                                                                         |
| `questions`       | [Question subdocument] | Yes      | Embedded array, minimum 1                                                                                                   |

**Question subdocument:**

| Field             | Type                 | Notes                                                                                                         |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `questionId`      | Number               | Sequential within the exam (1, 2, 3…), assigned by the backend on creation — not user-typed                   |
| `questionText`    | String               |                                                                                                               |
| `type`            | String enum          | `mcq` \| `true_false`                                                                                         |
| `points`          | Number               | Per-question weight                                                                                           |
| `order`           | Number               | Original authored order (display order is shuffled per-student at render time only, never stored differently) |
| `options`         | [Option subdocument] | Minimum 2                                                                                                     |
| `correctOptionId` | Number               | References an `optionId` within this question's own `options` array                                           |

**Option subdocument:** `{ optionId: Number, text: String }`

### 4.4 `ExamAttempt`

| Field       | Type                | Required | Notes                                    |
| ----------- | ------------------- | -------- | ---------------------------------------- |
| `examId`    | ObjectId ref `Exam` | Yes      |                                          |
| `studentId` | ObjectId ref `User` | Yes      |                                          |
| `startedAt` | Date                | Yes      | Set when the student clicks "start exam" |

- Unique compound index on `(examId, studentId)` — enforced at the database level, not just in application logic.
- No document is created before the student starts; there is no "in progress" state.

### 4.5 `Submission`

| Field         | Type                 | Required | Notes                                    |
| ------------- | -------------------- | -------- | ---------------------------------------- |
| `examId`      | ObjectId ref `Exam`  | Yes      |                                          |
| `studentId`   | ObjectId ref `User`  | Yes      |                                          |
| `answers`     | [Answer subdocument] | Yes      |                                          |
| `totalScore`  | Number               | Yes      | Sum of `pointsEarned` across all answers |
| `submittedAt` | Date                 | Yes      |                                          |

**Answer subdocument:** `{ questionId: Number, selectedOptionId: Number, isCorrect: Boolean, pointsEarned: Number }`

- `isCorrect` and `pointsEarned` are computed **once, at submission time**, and never recalculated afterward.
- `correctOptionId` is **not** duplicated into the submission — it's read from `Exam.questions` at display time.
- Unique compound index on `(examId, studentId)` — a document existing at all means "submitted"; there is no status field.
- Existence of this document is the only signal that a student has submitted. No auto-save, no partial submissions.

---

## 5. Key Business Rules

- BR-1: A student can access an exam only if `exam.department === student.department AND exam.year === student.year`. No enrollment concept.
- BR-2: An instructor can only create an exam using a `subjectId` present in their own `subjects` array.
- BR-3: A student may start a given exam only once (`ExamAttempt` unique index).
- BR-4: A student's effective submission deadline is `min(attempt.startedAt + exam.durationMinutes, exam.closesAt)`. The backend — never the frontend — is the source of truth for this check.
- BR-5: A student may submit a given exam only once (`Submission` unique index).
- BR-6: An exam's questions/schedule can be edited only while `Date.now() < exam.opensAt`, computed live — never a stored flag.
- BR-7: Passing score is fixed platform-wide at 50%, not configurable per exam.
- BR-8: Deleting an exam is a hard, cascading delete: the `Exam`, and every `Submission` and `ExamAttempt` referencing it, are permanently removed. No historical data survives exam deletion.

---

## 6. Explicitly Out of Scope

- Student dashboard / instructor dashboard
- Question bank / question reuse across exams
- Auto-save of in-progress answers, `in_progress` submission status
- Re-opening an exam for a student to retake
- Soft-delete or "protected" exams
- Audit log
- Free-text `subjectName` on exams (subjects are normalized via the `Subject` collection)

# Exam Platform API

A secure REST API for creating, delivering, submitting, and grading college exams.

The API is built with Node.js, Express, MongoDB, and Mongoose. It supports students, instructors, pending instructor requests, and administrators.

## Features

- Student registration and login
- JWT authentication with role-based access control
- Password reset with hashed, expiring, one-time tokens
- Admin-managed subjects
- Instructor approval and subject assignment
- Instructor exam creation and editing
- Student exam availability by department and year
- One-time exam attempts and submissions
- Automatic answer grading
- Student submission history and detailed results
- Instructor submission review
- Admin-wide exam and submission oversight
- Cascading exam deletion
- Security headers, CORS allowlisting, rate limiting, request-size limits, and query sanitization

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer
- npm

## Installation

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env
```

Update `.env` with real values, especially `MONGO_URI` and `JWT_SECRET`.

## Environment Variables

| Variable             | Required    | Description                                                           |
| -------------------- | ----------- | --------------------------------------------------------------------- |
| `PORT`               | No          | HTTP port. Defaults to `5000`.                                        |
| `NODE_ENV`           | No          | Use `production` in production.                                       |
| `MONGO_URI`          | Yes         | MongoDB connection string.                                            |
| `JWT_SECRET`         | Yes         | Long random secret used to sign JWTs.                                 |
| `JWT_EXPIRES_IN`     | No          | JWT lifetime. Defaults to `1h`.                                       |
| `CORS_ORIGINS`       | Recommended | Comma-separated allowed browser origins.                              |
| `RESET_TOKEN_EXPOSE` | No          | Set to `true` only for local development. Never enable in production. |

Example:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/exam-platform
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
CORS_ORIGINS=http://localhost:3000
RESET_TOKEN_EXPOSE=false
```

## Running

Start the production-style server:

```bash
npm start
```

Start the development server with automatic restart:

```bash
npm run dev
```

The API is available at:

```text
http://localhost:5000/api/v1
```

The server connects to MongoDB before it begins listening.

## Testing

Run all unit tests:

```bash
npm test
```

Run tests with Node coverage reporting:

```bash
npm run test:coverage
```

The test suite uses Node's built-in test runner with Sinon and Proxyquire. Tests are database-independent and mock model access.

## Authentication

Protected endpoints require a bearer token:

```http
Authorization: Bearer <jwt>
```

New public accounts always receive the `student` role. The role cannot be selected during signup.

### Roles

| Role                 | Permissions                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| `student`            | Take available exams, submit once, view own results                       |
| `pending_instructor` | Await administrator approval                                              |
| `instructor`         | Create exams for assigned subjects and review submissions for owned exams |
| `admin`              | Manage subjects, approve instructors, view all data, delete exams         |

## API Endpoints

All paths below are relative to `/api/v1`.

### Authentication

| Method  | Path                          | Access | Description                                  |
| ------- | ----------------------------- | ------ | -------------------------------------------- |
| `POST`  | `/auth/signup`                | Public | Create a student account                     |
| `POST`  | `/auth/login`                 | Public | Authenticate and receive a JWT               |
| `POST`  | `/auth/forgot-password`       | Public | Start password recovery                      |
| `PATCH` | `/auth/reset-password/:token` | Public | Set a new password using a valid reset token |

#### Signup

```http
POST /api/v1/auth/signup
Content-Type: application/json
```

```json
{
  "name": "Jane Student",
  "email": "jane@example.com",
  "password": "strong-password",
  "department": "cs",
  "year": 2
}
```

Passwords must be between 8 and 72 characters. Valid departments are `cs`, `it`, `is`, and `general`. Valid years are `1` through `4`.

#### Login

```json
{
  "email": "jane@example.com",
  "password": "strong-password"
}
```

#### Forgot Password

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "jane@example.com"
}
```

The endpoint always returns a generic success response so attackers cannot determine whether an email is registered. In production, the reset token should be delivered through an email provider. This repository does not include SMTP delivery yet.

For local development only, setting `RESET_TOKEN_EXPOSE=true` includes the raw token in the response. Never enable this in production.

#### Reset Password

```http
PATCH /api/v1/auth/reset-password/<token>
Content-Type: application/json
```

```json
{
  "password": "new-strong-password",
  "passwordConfirm": "new-strong-password"
}
```

Reset tokens are stored only as SHA-256 hashes, expire after 10 minutes, and can be used once. A successful reset invalidates previously issued JWTs.

### Users

| Method | Path        | Access        | Description                     |
| ------ | ----------- | ------------- | ------------------------------- |
| `GET`  | `/users/me` | Authenticated | Return the current user profile |

### Subjects

| Method   | Path             | Access     | Description            |
| -------- | ---------------- | ---------- | ---------------------- |
| `POST`   | `/subjects`      | Admin      | Create a subject       |
| `GET`    | `/subjects`      | Admin      | List all subjects      |
| `GET`    | `/subjects/mine` | Instructor | List assigned subjects |
| `PATCH`  | `/subjects/:id`  | Admin      | Update a subject       |
| `DELETE` | `/subjects/:id`  | Admin      | Delete a subject       |

Subject payload example:

```json
{
  "name": "Data Structures",
  "department": ["cs"],
  "year": 2
}
```

### Instructor Approval and Administration

| Method  | Path                                         | Access | Description                      |
| ------- | -------------------------------------------- | ------ | -------------------------------- |
| `GET`   | `/admin/instructor-requests`                 | Admin  | List pending instructor requests |
| `PATCH` | `/admin/instructor-requests/:userId/approve` | Admin  | Approve an instructor            |
| `PATCH` | `/admin/instructor-requests/:userId/reject`  | Admin  | Reject an instructor request     |
| `PATCH` | `/admin/users/:userId/subjects`              | Admin  | Assign subjects to an instructor |
| `GET`   | `/admin/exams`                               | Admin  | List every exam                  |
| `GET`   | `/admin/submissions`                         | Admin  | List every submission            |

### Exams

| Method   | Path                                    | Access                    | Description                                      |
| -------- | --------------------------------------- | ------------------------- | ------------------------------------------------ |
| `POST`   | `/exams`                                | Instructor                | Create an exam                                   |
| `GET`    | `/exams/mine`                           | Instructor                | List owned exams                                 |
| `GET`    | `/exams/available`                      | Student                   | List currently available exams                   |
| `GET`    | `/exams/:examId`                        | Owner instructor or admin | View full exam details including correct answers |
| `GET`    | `/exams/:examId/for-student`            | Student                   | View shuffled questions without correct answers  |
| `PATCH`  | `/exams/:examId`                        | Owner instructor          | Update an exam before it opens                   |
| `DELETE` | `/exams/:examId`                        | Admin                     | Delete an exam and all related data              |
| `POST`   | `/exams/:examId/start`                  | Student                   | Start an exam once                               |
| `POST`   | `/exams/:examId/submit`                 | Student                   | Submit and grade an exam                         |
| `GET`    | `/exams/:examId/submissions`            | Owner instructor or admin | List submissions for an exam                     |
| `GET`    | `/exams/:examId/submissions/:studentId` | Owner instructor or admin | View one student's detailed result               |

Exam creation example:

```json
{
  "subjectId": "507f1f77bcf86cd799439011",
  "examType": "midterm",
  "durationMinutes": 60,
  "opensAt": "2026-09-01T09:00:00.000Z",
  "closesAt": "2026-09-01T12:00:00.000Z",
  "questions": [
    {
      "questionText": "What is a stack?",
      "type": "mcq",
      "points": 2,
      "options": [
        { "optionId": 1, "text": "A LIFO data structure" },
        { "optionId": 2, "text": "A FIFO data structure" }
      ],
      "correctOptionId": 1
    }
  ]
}
```

The backend assigns sequential question IDs and normalizes option IDs. An instructor can only use subjects assigned by an administrator.

### Submissions

| Method | Path                         | Access         | Description                    |
| ------ | ---------------------------- | -------------- | ------------------------------ |
| `GET`  | `/submissions/mine`          | Student        | List the student's submissions |
| `GET`  | `/submissions/:submissionId` | Owning student | View a detailed result         |

Submit payload example:

```json
{
  "answers": [
    { "questionId": 1, "selectedOptionId": 1 },
    { "questionId": 2, "selectedOptionId": 2 }
  ]
}
```

## Exam Rules

- Students must match the exam's department and year.
- An exam must be open to start.
- A student can start each exam only once.
- A student can submit each exam only once.
- The effective deadline is the earlier of:
  - `attempt.startedAt + durationMinutes`
  - `exam.closesAt`
- Every question must be answered.
- Correctness and points are calculated at submission time and stored permanently.
- Exam deletion permanently removes the exam, submissions, and attempts.

## Security

The application includes:

- Helmet security headers
- Disabled `x-powered-by` header
- CORS origin allowlisting
- Global API rate limiting
- Stricter authentication rate limiting
- JSON and URL-encoded body size limits
- HTTP parameter pollution protection
- Mongoose strict query and filter sanitization
- HS256 JWT algorithm enforcement
- Generic authentication and password recovery errors
- Password hashing with bcrypt
- Password exclusion from serialized user responses
- Production error responses without stack traces
- Graceful shutdown on fatal process errors

Do not commit `.env`. It is ignored by Git. Use `.env.example` as the configuration template.

## Project Structure

```text
app.js                         Express application setup
server.js                      Database connection and HTTP startup
config/db.js                   MongoDB configuration
controllers/                   Request handlers and business rules
middlewares/                   Authentication, validation, and errors
models/                        Mongoose schemas
routers/                       Feature routers and centralized API router
utils/validators/              Request validation rules
test/unit.test.js              Database-independent unit tests
```

## Error Responses

Validation and operational errors use this general shape:

```json
{
  "status": "fail",
  "message": "A useful error message"
}
```

In development, additional error details may be included. Production responses do not expose stack traces or internal error details.

## Production Checklist

- Set `NODE_ENV=production`.
- Use a long, randomly generated `JWT_SECRET`.
- Set a production `MONGO_URI` with authentication and TLS where appropriate.
- Set `CORS_ORIGINS` to trusted frontend origins only.
- Keep `RESET_TOKEN_EXPOSE=false`.
- Configure an email provider for password reset delivery.
- Run behind HTTPS and a reverse proxy.
- Keep MongoDB network access restricted.
- Run `npm audit` before deployment.
- Run `npm test` and `npm run test:coverage` in CI.

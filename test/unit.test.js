const assert = require("node:assert/strict");
const test = require("node:test");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();
const { validationResult } = require("express-validator");

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-unit-tests";

const runValidation = async (validations, body, params = {}) => {
  const req = { body, params };
  for (const validation of validations) {
    await validation.run(req);
  }
  return validationResult(req).array();
};

const response = () => ({
  statusCode: null,
  body: null,
  sent: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(value) {
    this.body = value;
    return this;
  },
  send(value) {
    this.body = value;
    this.sent = true;
    return this;
  },
});

test("auth signup hashes the password and never returns it", async () => {
  const User = {
    create: sinon.stub().resolves({
      _id: "user-1",
      password: "hashed-password",
      toObject: () => ({ _id: "user-1", password: "hashed-password" }),
    }),
  };
  const bcrypt = { hash: sinon.stub().resolves("hashed-password") };
  const jwt = { sign: sinon.stub().returns("token") };
  const { signup } = proxyquire("../controllers/auth.controller", {
    bcrypt,
    jsonwebtoken: jwt,
    "../models/user.model": User,
  });

  const res = response();
  await signup(
    {
      body: {
        name: "Student",
        email: "student@example.com",
        password: "strongpass",
        department: "cs",
        year: 2,
      },
    },
    res,
    assert.fail,
  );

  assert.equal(bcrypt.hash.calledWith("strongpass", 12), true);
  assert.equal(User.create.firstCall.args[0].password, "hashed-password");
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.user.password, undefined);
  assert.equal(res.body.token, "token");
});

test("auth login rejects invalid credentials", async () => {
  const User = {
    findOne: sinon.stub().returns({
      select: sinon.stub().resolves(null),
    }),
  };
  const { login } = proxyquire("../controllers/auth.controller", {
    bcrypt: { compare: sinon.stub() },
    jsonwebtoken: { sign: sinon.stub() },
    "../models/user.model": User,
  });
  let receivedError;

  await login(
    { body: { email: "missing@example.com", password: "wrongpass" } },
    response(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.statusCode, 401);
  assert.equal(receivedError.message, "Incorrect email or password");
});

test("forgotPassword uses a generic response for an unknown email", async () => {
  const User = { findOne: sinon.stub().resolves(null) };
  const { forgotPassword } = proxyquire("../controllers/auth.controller", {
    "../models/user.model": User,
  });
  const res = response();

  await forgotPassword({ body: { email: "unknown@example.com" } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.data.message, /If an account exists/);
  assert.equal(res.body.data.resetToken, undefined);
});

test("forgotPassword stores only a hashed expiring token", async () => {
  process.env.RESET_TOKEN_EXPOSE = "true";
  const user = {
    save: sinon.stub().resolves(),
  };
  const User = { findOne: sinon.stub().resolves(user) };
  const { forgotPassword } = proxyquire("../controllers/auth.controller", {
    "../models/user.model": User,
  });
  const res = response();

  await forgotPassword({ body: { email: "student@example.com" } }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.data.resetToken, /^[a-f0-9]{64}$/);
  assert.match(user.passwordResetToken, /^[a-f0-9]{64}$/);
  assert.notEqual(user.passwordResetToken, res.body.data.resetToken);
  assert.ok(user.passwordResetExpires > new Date());
  assert.equal(user.save.calledWith({ validateBeforeSave: false }), true);
  delete process.env.RESET_TOKEN_EXPOSE;
});

test("resetPassword hashes the new password and invalidates old sessions", async () => {
  const user = {
    _id: "user-1",
    role: "student",
    password: "old-hash",
    save: sinon.stub().resolves(),
    toObject: () => ({ _id: "user-1", role: "student", password: "new-hash" }),
  };
  const User = {
    findOne: sinon.stub().returns({
      select: sinon.stub().resolves(user),
    }),
  };
  const bcrypt = { hash: sinon.stub().resolves("new-hash") };
  const jwt = { sign: sinon.stub().returns("new-token") };
  const { resetPassword } = proxyquire("../controllers/auth.controller", {
    bcrypt,
    jsonwebtoken: jwt,
    "../models/user.model": User,
  });
  const res = response();

  await resetPassword(
    { params: { token: "a".repeat(64) }, body: { password: "newpassword" } },
    res,
    assert.fail,
  );

  assert.equal(bcrypt.hash.calledWith("newpassword", 12), true);
  assert.equal(user.password, "new-hash");
  assert.equal(user.passwordResetToken, undefined);
  assert.equal(user.passwordResetExpires, undefined);
  assert.ok(user.passwordChangedAt instanceof Date);
  assert.equal(res.body.token, "new-token");
});

test("resetPassword rejects an invalid or expired token", async () => {
  const User = {
    findOne: sinon.stub().returns({
      select: sinon.stub().resolves(null),
    }),
  };
  const { resetPassword } = proxyquire("../controllers/auth.controller", {
    "../models/user.model": User,
  });
  let receivedError;

  await resetPassword(
    { params: { token: "invalid" }, body: { password: "newpassword" } },
    response(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.statusCode, 400);
});

test("auth validators reject weak passwords and invalid departments", async () => {
  const { signUpValidator } = require("../utils/validators/auth.validator");
  const errors = await runValidation(signUpValidator, {
    name: "Student",
    email: "not-an-email",
    password: "short",
    department: "biology",
    year: 9,
  });

  assert.ok(errors.length >= 4);
});

test("auth validators accept a valid signup payload", async () => {
  const { signUpValidator } = require("../utils/validators/auth.validator");
  const errors = await runValidation(signUpValidator, {
    name: " Student ",
    email: "STUDENT@EXAMPLE.COM",
    password: "strongpass",
    department: "cs",
    year: "2",
  });

  assert.deepEqual(errors, []);
});

test("password reset validators require matching strong passwords", async () => {
  const { resetPasswordValidator } = require("../utils/validators/auth.validator");
  const errors = await runValidation(resetPasswordValidator, {
    password: "newpassword",
    passwordConfirm: "differentpassword",
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0].msg, /do not match/);
});

test("subject update ignores fields outside the allowlist", async () => {
  const Subject = {
    findByIdAndUpdate: sinon
      .stub()
      .resolves({ _id: "subject-1", name: "math" }),
  };
  const { updateSubject } = proxyquire("../controllers/subject.controller", {
    "../models/subject.model": Subject,
  });

  const res = response();
  await updateSubject(
    {
      params: { id: "subject-1" },
      body: { name: "math", role: "admin", subjects: ["unsafe"] },
    },
    res,
    assert.fail,
  );

  assert.deepEqual(Subject.findByIdAndUpdate.firstCall.args[1], {
    name: "math",
  });
});

test("submitExam grades every answer and calculates the total score", async () => {
  const exam = {
    _id: "exam-1",
    durationMinutes: 30,
    closesAt: new Date(Date.now() + 60_000),
    question: [
      {
        questionId: 1,
        points: 2,
        correctOptionId: 2,
        options: [{ optionId: 1 }, { optionId: 2 }],
      },
      {
        questionId: 2,
        points: 3,
        correctOptionId: 1,
        options: [{ optionId: 1 }, { optionId: 2 }],
      },
    ],
  };
  const Exam = { findById: sinon.stub().resolves(exam) };
  const ExamAttempt = {
    findOne: sinon.stub().resolves({
      startedAt: new Date(Date.now() - 1_000),
    }),
  };
  const Submission = {
    create: sinon.stub().callsFake(async (value) => value),
  };
  const { submitExam } = proxyquire("../controllers/exam.controller", {
    "../models/exam.model": Exam,
    "../models/examAttempt.model": ExamAttempt,
    "../models/submission.model": Submission,
    "../models/subject.model": {},
  });

  const res = response();
  await submitExam(
    {
      params: { examId: "exam-1" },
      user: { _id: "student-1" },
      body: {
        answers: [
          { questionId: 1, selectedOptionId: 2 },
          { questionId: 2, selectedOptionId: 2 },
        ],
      },
    },
    res,
    assert.fail,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.submission.totalScore, 2);
  assert.deepEqual(
    res.body.data.submission.answers.map((answer) => answer.isCorrect),
    [true, false],
  );
});

test("submitExam rejects a submission after the effective deadline", async () => {
  const Exam = {
    findById: sinon.stub().resolves({
      _id: "exam-1",
      durationMinutes: 1,
      closesAt: new Date(Date.now() + 60_000),
      question: [],
    }),
  };
  const ExamAttempt = {
    findOne: sinon.stub().resolves({
      startedAt: new Date(Date.now() - 120_000),
    }),
  };
  const { submitExam } = proxyquire("../controllers/exam.controller", {
    "../models/exam.model": Exam,
    "../models/examAttempt.model": ExamAttempt,
    "../models/submission.model": {},
    "../models/subject.model": {},
  });
  let receivedError;

  await submitExam(
    {
      params: { examId: "exam-1" },
      user: { _id: "student-1" },
      body: { answers: [] },
    },
    response(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.statusCode, 400);
});

test("getAllExams returns populated platform-wide exams", async () => {
  const exams = [{ _id: "exam-1" }];
  const query = {
    populate: sinon.stub().returnsThis(),
    sort: sinon.stub().resolves(exams),
  };
  const Exam = { find: sinon.stub().returns(query) };
  const { getAllExams } = proxyquire("../controllers/admin.controller", {
    "../models/exam.model": Exam,
    "../models/submission.model": {},
    "../models/user.model": {},
    "../models/subject.model": {},
  });
  const res = response();

  await getAllExams({}, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.results, 1);
  assert.equal(query.populate.callCount, 2);
});

test("getAllSubmissions returns platform-wide score summaries", async () => {
  const submissions = [{ _id: "submission-1", totalScore: 5 }];
  const query = {
    select: sinon.stub().returnsThis(),
    populate: sinon.stub().returnsThis(),
    sort: sinon.stub().resolves(submissions),
  };
  const Submission = { find: sinon.stub().returns(query) };
  const { getAllSubmissions } = proxyquire("../controllers/admin.controller", {
    "../models/exam.model": {},
    "../models/submission.model": Submission,
    "../models/user.model": {},
    "../models/subject.model": {},
  });
  const res = response();

  await getAllSubmissions({}, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.submissions[0].totalScore, 5);
});

test("protect rejects malformed and expired JWTs as unauthorized", async () => {
  const jwt = { verify: sinon.stub().throws({ name: "TokenExpiredError" }) };
  const { protect } = proxyquire("../middlewares/auth.middleware", {
    jsonwebtoken: jwt,
    "../models/user.model": {},
  });
  let receivedError;

  await protect(
    { headers: { authorization: "Bearer expired-token" } },
    response(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.statusCode, 401);
  assert.equal(receivedError.message, "Invalid or expired token");
});

test("submission ID validator rejects malformed IDs", async () => {
  const {
    submissionIdParamValidator,
  } = require("../utils/validators/submission.validator");
  const errors = await runValidation(
    submissionIdParamValidator,
    {},
    { submissionId: "not-an-id" },
  );

  assert.equal(errors.length, 1);
});

test("central API router and app load without database access", () => {
  const app = require("../app");
  const apiRouter = require("../routers");

  assert.equal(typeof app, "function");
  assert.equal(typeof apiRouter, "function");
});

test("getMe returns the authenticated user", async () => {
  const { getMe } = require("../controllers/user.controller");
  const user = { _id: "user-1", role: "student" };
  const res = response();

  getMe({ user }, res, assert.fail);

  assert.deepEqual(res.body.data.user, user);
});

test("requestInstructor changes a student role to pending instructor", async () => {
  const user = {
    role: "student",
    save: sinon.stub().resolves(),
  };
  const User = { findOne: sinon.stub().resolves(user) };
  const { requestInstructor } = proxyquire("../controllers/user.controller", {
    "../models/user.model": User,
  });
  const res = response();

  await requestInstructor({ user: { _id: "user-1" } }, res, assert.fail);

  assert.equal(user.role, "pending_instructor");
  assert.equal(user.save.calledOnce, true);
  assert.equal(res.statusCode, 200);
});

test("subject create persists only validated subject fields", async () => {
  const Subject = {
    create: sinon.stub().resolves({ _id: "subject-1", name: "math" }),
  };
  const { createSubject } = proxyquire("../controllers/subject.controller", {
    "../models/subject.model": Subject,
  });
  const res = response();

  await createSubject(
    { body: { name: "math", department: ["cs"], year: 1 } },
    res,
    assert.fail,
  );

  assert.deepEqual(Subject.create.firstCall.args[0], {
    name: "math",
    department: ["cs"],
    year: 1,
  });
  assert.equal(res.statusCode, 201);
});

test("subject delete returns 404 when the subject does not exist", async () => {
  const Subject = { findByIdAndDelete: sinon.stub().resolves(null) };
  const { deleteSubject } = proxyquire("../controllers/subject.controller", {
    "../models/subject.model": Subject,
  });
  let receivedError;

  await deleteSubject({ params: { id: "subject-1" } }, response(), (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 404);
});

test("startExam creates one attempt for an eligible student", async () => {
  const exam = {
    _id: "exam-1",
    opensAt: new Date(Date.now() - 1_000),
    closesAt: new Date(Date.now() + 60_000),
    year: 2,
    department: ["cs"],
  };
  const Exam = { findById: sinon.stub().resolves(exam) };
  const ExamAttempt = { create: sinon.stub().resolves({ examId: "exam-1" }) };
  const { startExam } = proxyquire("../controllers/exam.controller", {
    "../models/exam.model": Exam,
    "../models/examAttempt.model": ExamAttempt,
    "../models/submission.model": {},
    "../models/subject.model": {},
  });
  const res = response();

  await startExam(
    {
      params: { examId: "exam-1" },
      user: { _id: "student-1", year: 2, department: "cs" },
    },
    res,
    assert.fail,
  );

  assert.equal(ExamAttempt.create.calledOnce, true);
  assert.equal(res.statusCode, 201);
});

test("deleteExam removes the exam, submissions, and attempts", async () => {
  const exam = {
    _id: "exam-1",
    deleteOne: sinon.stub().resolves(),
  };
  const Exam = { findById: sinon.stub().resolves(exam) };
  const Submission = { deleteMany: sinon.stub().resolves() };
  const ExamAttempt = { deleteMany: sinon.stub().resolves() };
  const { deleteExam } = proxyquire("../controllers/exam.controller", {
    "../models/exam.model": Exam,
    "../models/examAttempt.model": ExamAttempt,
    "../models/submission.model": Submission,
    "../models/subject.model": {},
  });
  const res = response();

  await deleteExam({ params: { examId: "exam-1" } }, res, assert.fail);

  assert.equal(exam.deleteOne.calledOnce, true);
  assert.deepEqual(Submission.deleteMany.firstCall.args[0], {
    examId: "exam-1",
  });
  assert.deepEqual(ExamAttempt.deleteMany.firstCall.args[0], {
    examId: "exam-1",
  });
  assert.equal(res.statusCode, 204);
});

test("getStudentSubmissionDetail denies an instructor who does not own the exam", async () => {
  const Exam = {
    findById: sinon.stub().returns({
      select: sinon.stub().resolves({ instructor: "owner-1" }),
    }),
  };
  const { getStudentSubmissionDetail } = proxyquire(
    "../controllers/submission.controller",
    {
      "../models/exam.model": Exam,
      "../models/submission.model": {},
    },
  );
  let receivedError;

  await getStudentSubmissionDetail(
    {
      params: { examId: "exam-1", studentId: "student-1" },
      user: { _id: "other-instructor", role: "instructor" },
    },
    response(),
    (error) => {
      receivedError = error;
    },
  );

  assert.equal(receivedError.statusCode, 403);
});

test("exam validators reject invalid question options", async () => {
  const { createExamValidator } = require("../utils/validators/exam.validator");
  const errors = await runValidation(createExamValidator, {
    subjectId: "507f1f77bcf86cd799439011",
    examType: "final",
    durationMinutes: 30,
    opensAt: "2026-08-20T10:00:00.000Z",
    closesAt: "2026-08-20T11:00:00.000Z",
    questions: [
      {
        questionText: "Question",
        type: "mcq",
        points: 1,
        options: [{ optionId: 1, text: "Only option" }],
        correctOptionId: 2,
      },
    ],
  });

  assert.ok(errors.length > 0);
});

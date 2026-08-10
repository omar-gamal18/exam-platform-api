const AppError = require("../utils/appError");
const Subject = require("../models/subject.model");

const createSubject = async (req, res, next) => {
  const { name, department, year } = req.body;

  const subject = await Subject.create({ name, department, year });
  res.status(201).json({
    status: "success",
    data: {
      subject,
    },
  });
};

const listAllSubjects = async (req, res, next) => {
  const subjects = await Subject.find();

  res.status(201).json({
    status: "success",
    results: subjects.length,
    data: {
      subject,
    },
  });
};

const updateSubject = async (req, res, next) => {
  const { id } = req.params;

  const subject = await Subject.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      subject,
    },
  });
};

const deleteSubject = async (req, res, next) => {
  const { id } = req.params;

  const subject = await Subject.findByIdAndDelete(id);

  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }

  res.status(204).json();
};

module.exports = {
  createSubject,
  listAllSubjects,
  updateSubject,
  deleteSubject,
};

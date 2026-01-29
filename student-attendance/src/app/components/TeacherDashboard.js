"use client";

import { useState } from "react";
import {
  getClassesForTeacher,
  getStudentsByClass,
  getClassById,
  getDepartmentById,
  mockData,
} from "../../lib/mockData";
import "../attendance.css";

export default function TeacherDashboard({ user, onLogout }) {
  const teacherClasses = getClassesForTeacher(user.teacherId);
  const [selectedClassId, setSelectedClassId] = useState(
    teacherClasses.length > 0 ? teacherClasses[0].id : "",
  );
  const [attendance, setAttendance] = useState(() => {
    const initial = {};
    getStudentsByClass(selectedClassId).forEach((student) => {
      initial[student.id] = { absent: false, reason: "" };
    });
    return initial;
  });

  const currentClass = getClassById(selectedClassId);
  const department = currentClass
    ? getDepartmentById(currentClass.departmentId)
    : null;
  const students = getStudentsByClass(selectedClassId);

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const initial = {};
    getStudentsByClass(classId).forEach((student) => {
      initial[student.id] = { absent: false, reason: "" };
    });
    setAttendance(initial);
  };

  const handleAbsentChange = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absent: !prev[studentId].absent,
      },
    }));
  };

  const handleReasonChange = (studentId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason: value,
      },
    }));
  };

  const handleSubmit = () => {
    const attendanceRecord = {
      classId: selectedClassId,
      className: currentClass?.name,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
      records: students.map((student) => ({
        studentId: student.id,
        name: student.name,
        rollNo: student.rollNo,
        ...attendance[student.id],
      })),
    };
    console.log("Attendance Record:", attendanceRecord);
    alert("Attendance submitted successfully!");
  };

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p className="teacher-name">Welcome, {user.name}</p>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="class-selector-section">
          <label htmlFor="class-select" className="class-label">
            Select Class:
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="class-select"
          >
            {teacherClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {getDepartmentById(cls.departmentId)?.name}
              </option>
            ))}
          </select>
        </div>

        {currentClass && (
          <div className="class-info">
            <p>
              <strong>Department:</strong> {department?.name}
            </p>
            <p>
              <strong>Semester:</strong> {currentClass.semester}
            </p>
            <p>
              <strong>Total Students:</strong> {students.length}
            </p>
          </div>
        )}

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Name</th>
              <th>Absent</th>
              <th>Reason for Absence</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.rollNo}</td>
                <td>{student.name}</td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={attendance[student.id]?.absent || false}
                    onChange={() => handleAbsentChange(student.id)}
                    className="checkbox-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter reason..."
                    value={attendance[student.id]?.reason || ""}
                    onChange={(e) =>
                      handleReasonChange(student.id, e.target.value)
                    }
                    disabled={!attendance[student.id]?.absent}
                    className="reason-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={handleSubmit} className="submit-btn">
          Submit Attendance
        </button>
      </div>
    </div>
  );
}

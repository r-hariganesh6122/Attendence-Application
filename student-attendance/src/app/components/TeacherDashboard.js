import { useState } from "react";
import {
  getDepartmentsForTeacher,
  getStudentsByDepartment,
  getDepartmentById,
  mockData,
} from "../../lib/mockData";
import "../attendance.css";

export default function TeacherDashboard({ user, onLogout }) {
  const teacherDepartments = getDepartmentsForTeacher(user.teacherId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    teacherDepartments.length > 0 ? teacherDepartments[0].id : "",
  );
  const [attendance, setAttendance] = useState(() => {
    const initial = {};
    getStudentsByDepartment(selectedDepartmentId).forEach((student) => {
      initial[student.id] = { absent: false, reason: "" };
    });
    return initial;
  });

  const currentDepartment = getDepartmentById(selectedDepartmentId);
  const students = getStudentsByDepartment(selectedDepartmentId);

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    const initial = {};
    getStudentsByDepartment(departmentId).forEach((student) => {
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
      departmentId: selectedDepartmentId,
      departmentName: currentDepartment?.name,
      program: currentDepartment?.program,
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
          <label htmlFor="department-select" className="class-label">
            Select Department:
          </label>
          <select
            id="department-select"
            value={selectedDepartmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="class-select"
          >
            {teacherDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} - {dept.program}
              </option>
            ))}
          </select>
        </div>

        {currentDepartment && (
          <div className="class-info">
            <p>
              <strong>Department:</strong> {currentDepartment?.name}
            </p>
            <p>
              <strong>Program:</strong> {currentDepartment?.program}
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

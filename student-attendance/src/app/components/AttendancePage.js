"use client";

import { useState } from "react";
import "../attendance.css";

export default function AttendancePage({ userPhone, onLogout }) {
  const [students, setStudents] = useState([
    { id: 1, name: "John Doe", absent: false, reason: "" },
    { id: 2, name: "Jane Smith", absent: false, reason: "" },
    { id: 3, name: "Mike Johnson", absent: false, reason: "" },
    { id: 4, name: "Sarah Williams", absent: false, reason: "" },
    { id: 5, name: "Tom Brown", absent: false, reason: "" },
  ]);

  const handleAbsentChange = (id) => {
    setStudents(
      students.map((student) =>
        student.id === id ? { ...student, absent: !student.absent } : student,
      ),
    );
  };

  const handleReasonChange = (id, value) => {
    setStudents(
      students.map((student) =>
        student.id === id ? { ...student, reason: value } : student,
      ),
    );
  };

  const handleSubmit = () => {
    console.log("Attendance Data:", students);
    alert("Attendance submitted successfully!");
  };

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <h1>Student Attendance</h1>
          <button onClick={onLogout} className="logout-btn">
            Logout ({userPhone})
          </button>
        </div>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Name</th>
              <th>Absent</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>{student.name}</td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={student.absent}
                    onChange={() => handleAbsentChange(student.id)}
                    className="checkbox-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter reason..."
                    value={student.reason}
                    onChange={(e) =>
                      handleReasonChange(student.id, e.target.value)
                    }
                    disabled={!student.absent}
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

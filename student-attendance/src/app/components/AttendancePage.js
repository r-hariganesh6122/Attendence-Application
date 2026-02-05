"use client";

import { useState, useEffect } from "react";
import "../attendance.css";

  const [students, setStudents] = useState([]);
  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Add absent/reason fields for UI state
          setStudents(
            data.students.map((s) => ({ ...s, absent: false, reason: "" }))
          );
        } else {
          setStudents([]);
        }
      })
      .catch(() => setStudents([]));
  }, []);

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

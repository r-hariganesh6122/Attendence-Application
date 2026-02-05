import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "../attendance.css";

function TeacherDashboard({ user, onLogout }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentDepartment, setCurrentDepartment] = useState(null);

  // Fetch teacher's departments (classes)
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/teacher-departments?teacherId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.departments.length > 0) {
          setDepartments(data.departments);
          setSelectedDepartmentId(data.departments[0].id);
        } else {
          setDepartments([]);
          setSelectedDepartmentId("");
        }
      });
  }, [user]);

  // Fetch students for selected department/class
  useEffect(() => {
    if (!selectedDepartmentId) {
      setStudents([]);
      setAttendance({});
      setCurrentDepartment(null);
      return;
    }
    fetch(`/api/students?classId=${selectedDepartmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStudents(data.students);
          const initial = {};
          data.students.forEach((student) => {
            initial[student.id] = { absent: false, reason: "", informed: "" };
          });
          setAttendance(initial);
        } else {
          setStudents([]);
          setAttendance({});
        }
      });
    // Set current department/class info
    const dept = departments.find((d) => d.id === selectedDepartmentId);
    setCurrentDepartment(dept || null);
  }, [selectedDepartmentId, departments]);

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Reset attendance when date changes
    const initial = {};
    students.forEach((student) => {
      initial[student.id] = { absent: false, reason: "", informed: "" };
    });
    setAttendance(initial);
  };

  const handleAbsentChange = (studentId) => {
    setAttendance((prev) => {
      const newAbsent = !prev[studentId].absent;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          absent: newAbsent,
          reason: newAbsent ? prev[studentId].reason : "",
          informed: newAbsent ? prev[studentId].informed : "",
        },
      };
    });
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

  const handleInformedChange = (studentId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        informed: value,
      },
    }));
  };

  const handleSubmit = () => {
    const attendanceRecord = {
      departmentId: selectedDepartmentId,
      departmentName: currentDepartment?.name,
      date: selectedDate.toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      records: students.map((student) => ({
        studentId: student.id,
        name: student.name,
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
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label htmlFor="department-select" className="class-label">
                Select Department:
              </label>
              <select
                id="department-select"
                value={selectedDepartmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="class-select"
                style={{
                  padding: "10px 15px",
                  border: "2px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date-select" className="class-label">
                Select Date:
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
                className="class-select"
                id="date-select"
              />
            </div>
          </div>
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
              <th>Status</th>
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
                <td>
                  <select
                    value={attendance[student.id]?.informed || ""}
                    onChange={(e) =>
                      handleInformedChange(student.id, e.target.value)
                    }
                    disabled={!attendance[student.id]?.absent}
                    className="informed-select"
                  >
                    <option value="">Select</option>
                    <option value="Informed">Informed</option>
                    <option value="Not Informed">Not Informed</option>
                  </select>
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

export default TeacherDashboard;

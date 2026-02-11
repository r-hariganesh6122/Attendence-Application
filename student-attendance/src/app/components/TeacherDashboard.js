"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiCall } from "@/lib/apiUtils";

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
    apiCall(`/api/teacher-departments?teacherId=${user.id}`)
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
    async function fetchData() {
      // Fetch students
      const resStudents = await apiCall(
        `/api/students?classId=${selectedDepartmentId}`,
      );
      const dataStudents = await resStudents.json();
      setStudents(dataStudents.success ? dataStudents.students : []);

      // Fetch attendance records for selected date
      const dateStr = selectedDate.toISOString().split("T")[0];
      const resAttendance = await apiCall(
        `/api/attendance?classId=${selectedDepartmentId}&from=${dateStr}&to=${dateStr}`,
      );
      const dataAttendance = await resAttendance.json();
      const attendanceRecords = dataAttendance.success
        ? dataAttendance.attendanceRecords
        : [];

      // Pre-fill attendance state
      const initial = {};
      (dataStudents.success ? dataStudents.students : []).forEach((student) => {
        const record = attendanceRecords.find(
          (r) => r.studentId === student.id,
        );
        initial[student.id] = {
          absent: record ? record.status === "absent" : false,
          reason: record ? record.absenceReason || "" : "",
          informed: record ? !!record.informed : false,
        };
      });
      setAttendance(initial);

      // Set current department/class info
      const dept = departments.find((d) => d.id === selectedDepartmentId);
      setCurrentDepartment(dept || null);
    }
    fetchData();
  }, [selectedDepartmentId, departments, selectedDate]);

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Reset attendance when date changes
    const initial = {};
    students.forEach((student) => {
      initial[student.id] = { absent: false, reason: "", informed: false };
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
          informed: newAbsent ? prev[studentId].informed : false,
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

  const handleInformedChange = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        informed: !prev[studentId].informed,
      },
    }));
  };

  const handleSubmit = () => {
    const attendanceRecord = {
      classId: selectedDepartmentId,
      date: selectedDate.toISOString().split("T")[0],
      records: students.map((student) => ({
        studentId: student.id,
        absent: attendance[student.id]?.absent || false,
        informed: attendance[student.id]?.informed || false,
        reason: attendance[student.id]?.reason || "",
      })),
    };
    apiCall("/api/attendance", {
      method: "POST",
      body: JSON.stringify(attendanceRecord),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Attendance submitted successfully!");
          // Optionally, refetch attendance to update UI
        } else {
          alert(
            "Failed to submit attendance: " + (data.message || "Unknown error"),
          );
        }
      })
      .catch((err) => {
        alert("Failed to submit attendance: " + err.message);
      });
  };

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p className="teacher-name">
              Welcome,{" "}
              {user &&
                (user.name ||
                  user.teacherName ||
                  user.fullName ||
                  user.username)}
            </p>
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
              <th>Reg No.</th>
              <th>Name</th>
              <th>Absent</th>
              <th>Informed</th>
              <th>Reason for Absence</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.regNo}</td>
                <td>{student.studentName || student.name}</td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={attendance[student.id]?.absent || false}
                    onChange={() => handleAbsentChange(student.id)}
                    className="checkbox-input"
                  />
                </td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={attendance[student.id]?.informed || false}
                    onChange={() => handleInformedChange(student.id)}
                    className="checkbox-input"
                    disabled={!attendance[student.id]?.absent}
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
export default TeacherDashboard;

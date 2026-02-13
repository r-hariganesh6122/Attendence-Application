"use client";
import { useState, useEffect } from "react";
import { apiCall } from "@/lib/apiUtils";

import "../attendance.css";

function TeacherDashboard({ user, onLogout }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [attendanceLocked, setAttendanceLocked] = useState(false);

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

  // Set current department when selectedDepartmentId changes
  useEffect(() => {
    if (!selectedDepartmentId || departments.length === 0) {
      setCurrentDepartment(null);
      return;
    }
    const dept = departments.find((d) => d.id == selectedDepartmentId); // Use == for loose comparison
    setCurrentDepartment(dept || null);
  }, [selectedDepartmentId, departments]);

  // Fetch students and attendance for selected department/date
  useEffect(() => {
    if (!selectedDepartmentId) {
      setStudents([]);
      setAttendance({});
      setAttendanceLocked(false);
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
      const dateStr = selectedDate;
      const resAttendance = await apiCall(
        `/api/attendance?classId=${selectedDepartmentId}&from=${dateStr}&to=${dateStr}`,
      );
      const dataAttendance = await resAttendance.json();
      const attendanceRecords = dataAttendance.success
        ? dataAttendance.attendanceRecords
        : [];

      // Fetch attendance lock status
      const resLock = await apiCall(
        `/api/attendance-lock?classId=${selectedDepartmentId}&date=${dateStr}`,
      );
      const dataLock = await resLock.json();
      setAttendanceLocked(dataLock.isLocked || false);

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
    }
    fetchData();
  }, [selectedDepartmentId, selectedDate]);

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(parseInt(departmentId) || departmentId);
  };

  const isDateInPast = (dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const selectedDateOnly = new Date(year, month - 1, day);
    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);
    return selectedDateOnly < todayOnly;
  };

  const isAttendanceEditable = () => {
    return !isDateInPast(selectedDate) && !attendanceLocked;
  };

  const getLockedReason = () => {
    if (attendanceLocked) {
      return "This attendance is locked by admin";
    }
    if (isDateInPast(selectedDate)) {
      return "This is a previous date. Attendance cannot be modified.";
    }
    return null;
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // Reset attendance when date changes
    const initial = {};
    students.forEach((student) => {
      initial[student.id] = { absent: false, reason: "", informed: false };
    });
    setAttendance(initial);
  };

  const handleAbsentChange = (studentId) => {
    if (!isAttendanceEditable()) {
      alert(getLockedReason());
      return;
    }
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
    if (!isAttendanceEditable()) {
      alert(getLockedReason());
      return;
    }
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason: value,
      },
    }));
  };

  const handleInformedChange = (studentId) => {
    if (!isAttendanceEditable()) {
      alert(getLockedReason());
      return;
    }
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        informed: !prev[studentId].informed,
      },
    }));
  };

  const handleSubmit = () => {
    if (!isAttendanceEditable()) {
      alert(getLockedReason());
      return;
    }
    const attendanceRecord = {
      classId: selectedDepartmentId,
      date: selectedDate,
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
          <div className="department-date-selector">
            <div className="selector-group">
              <label htmlFor="department-select" className="class-label">
                Select Department:
              </label>
              <select
                id="department-select"
                value={selectedDepartmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="class-select"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="selector-group">
              <label htmlFor="date-select" className="class-label">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  maxWidth: "250px",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
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
            {!isAttendanceEditable() && (
              <p
                style={{
                  color: "#d32f2f",
                  fontWeight: "bold",
                  marginTop: "10px",
                  padding: "8px",
                  backgroundColor: "#ffebee",
                  borderRadius: "4px",
                }}
              >
                ⚠️{" "}
                {attendanceLocked
                  ? "This attendance is locked by admin. Attendance cannot be modified."
                  : "This is a previous date. Attendance cannot be modified."}
              </p>
            )}
          </div>
        )}

        <table className="attendance-table">
          <thead>
            <tr>
              <th className="sno-column">S.No</th>
              <th>Roll No</th>
              <th className="name-column">Name</th>
              <th>Absent</th>
              <th>Informed</th>
              <th>Reason for Absence</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td className="sno-column">{index + 1}</td>
                <td>
                  <span className="desktop-content">{student.regNo}</span>
                  <span className="mobile-content">{student.regNo % 1000}</span>
                </td>
                <td className="name-column">
                  {student.studentName || student.name}
                </td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={attendance[student.id]?.absent || false}
                    onChange={() => handleAbsentChange(student.id)}
                    className="checkbox-input"
                    disabled={!isAttendanceEditable()}
                  />
                </td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={attendance[student.id]?.informed || false}
                    onChange={() => handleInformedChange(student.id)}
                    className="checkbox-input"
                    disabled={
                      !attendance[student.id]?.absent || !isAttendanceEditable()
                    }
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
                    disabled={
                      !attendance[student.id]?.absent || !isAttendanceEditable()
                    }
                    maxLength="40"
                    className="reason-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={handleSubmit}
          className="submit-btn"
          disabled={!isAttendanceEditable()}
          style={{
            opacity: !isAttendanceEditable() ? 0.5 : 1,
            cursor: !isAttendanceEditable() ? "not-allowed" : "pointer",
          }}
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
}
export default TeacherDashboard;

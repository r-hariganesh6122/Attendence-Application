"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import "../../attendance.css";

export default function ClassDetailsPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [tab, setTab] = useState("students");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    async function fetchClassData() {
      // Fetch students
      const resStudents = await fetch(`/api/students?classId=${id}`);
      const dataStudents = await resStudents.json();
      setStudents(dataStudents.success ? dataStudents.students : []);
      // Fetch teachers
      const resTeachers = await fetch(`/api/teachers?classId=${id}`);
      const dataTeachers = await resTeachers.json();
      setTeachers(dataTeachers.success ? dataTeachers.teachers : []);
    }
    fetchClassData();
  }, [id]);

  const fetchStudentAttendance = async (studentId) => {
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}`);
      const data = await res.json();
      setAttendanceRecords(data.success ? data.attendance : []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      setAttendanceRecords([]);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setAttendanceSearch(student.studentName);
    fetchStudentAttendance(student.id);
  };

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <div>
            <h1>Class Details</h1>
            <p className="teacher-name">
              {classInfo ? classInfo.name : `Class ID: ${id}`}
            </p>
          </div>
          <button onClick={() => router.push("/")} className="back-btn">
            ← Back
          </button>
        </div>
        <div className="admin-section">
          <div className="admin-nav" style={{ marginBottom: 24 }}>
            <button
              className={`nav-btn${tab === "students" ? " active" : ""}`}
              onClick={() => setTab("students")}
            >
              Student Details
            </button>
            <button
              className={`nav-btn${tab === "teachers" ? " active" : ""}`}
              onClick={() => setTab("teachers")}
            >
              Teachers Assigned
            </button>
            <button
              className={`nav-btn${tab === "attendance" ? " active" : ""}`}
              onClick={() => setTab("attendance")}
            >
              Attendance History
            </button>
          </div>
          {tab === "students" && (
            <div className="data-list">
              <div className="list-header">
                <div>S No</div>
                <div>Roll No</div>
                <div>Reg No</div>
                <div>Name</div>
                <div>Residence</div>
              </div>
              {students.length === 0 ? (
                <div className="list-item">
                  No students found for this class.
                </div>
              ) : (
                students.map((student, idx) => (
                  <div key={student.id} className="list-item">
                    <div>{idx + 1}</div>
                    <div>{student.rollNo || "-"}</div>
                    <div>{student.regNo || "-"}</div>
                    <div>{student.studentName || "-"}</div>
                    <div>{student.residence || "-"}</div>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "teachers" && (
            <div className="data-list">
              <div className="list-header">
                <div>S No</div>
                <div>Course Code</div>
                <div>Course Name</div>
                <div>Teacher Name</div>
                <div>Phone Number</div>
              </div>
              {teachers.length === 0 ? (
                <div className="list-item">
                  No teachers assigned to this class.
                </div>
              ) : (
                teachers.map((teacher, idx) => (
                  <div
                    key={String(
                      teacher.classTeacherId || `${teacher.id}-${idx}`,
                    )}
                    className="list-item"
                  >
                    <div>{idx + 1}</div>
                    <div>{teacher.courseCode || "-"}</div>
                    <div>{teacher.courseName || "-"}</div>
                    <div>{teacher.name}</div>
                    <div>{teacher.mobile}</div>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "attendance" && (
            <div style={{ width: "100%" }}>
              {/* Student Search Section */}
              <div className="search-section" style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Search student by name or reg no..."
                  className="search-input"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Matching Students List */}
              {attendanceSearch.trim() && !selectedStudent && (
                <div
                  style={{
                    marginBottom: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {students
                    .filter(
                      (student) =>
                        student.studentName
                          .toLowerCase()
                          .includes(attendanceSearch.toLowerCase()) ||
                        student.regNo
                          .toLowerCase()
                          .includes(attendanceSearch.toLowerCase()),
                    )
                    .map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        style={{
                          padding: "10px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          backgroundColor: "#fff",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#f5f5f5")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#fff")
                        }
                      >
                        {student.studentName} (Reg: {student.regNo})
                      </div>
                    ))}
                  {students.filter(
                    (student) =>
                      student.studentName
                        .toLowerCase()
                        .includes(attendanceSearch.toLowerCase()) ||
                      student.regNo
                        .toLowerCase()
                        .includes(attendanceSearch.toLowerCase()),
                  ).length === 0 && (
                    <div style={{ padding: "10px", color: "#999" }}>
                      No students found
                    </div>
                  )}
                </div>
              )}

              {/* Selected Student Info */}
              {selectedStudent && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 5px 0" }}>
                        {selectedStudent.studentName}
                      </h3>
                      <p
                        style={{ margin: "0", color: "#666", fontSize: "14px" }}
                      >
                        Reg No: {selectedStudent.regNo} | Roll No:{" "}
                        {selectedStudent.rollNo}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setAttendanceSearch("");
                        setAttendanceRecords([]);
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Attendance Records Table */}
              {selectedStudent && (
                <div className="data-list">
                  <div className="list-header">
                    <div style={{ flex: "0.5" }}>S No</div>
                    <div>Name</div>
                    <div>Date</div>
                    <div>Reason</div>
                    <div>Status</div>
                  </div>
                  {attendanceRecords.filter((r) => r.status === "absent")
                    .length === 0 ? (
                    <div className="list-item">
                      No absence records found for this student.
                    </div>
                  ) : (
                    attendanceRecords
                      .filter((record) => record.status === "absent")
                      .map((record, idx) => (
                        <div key={record.id} className="list-item">
                          <div style={{ flex: "0.5" }}>{idx + 1}</div>
                          <div>{selectedStudent.studentName}</div>
                          <div>
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                          <div>{record.absenceReason || "-"}</div>
                          <div>
                            {record.informed ? "Informed" : "Not Informed"}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

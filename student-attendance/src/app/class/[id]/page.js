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
  const [studentTab, setStudentTab] = useState("list");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Student management states
  const [newStudent, setNewStudent] = useState({
    rollNo: "",
    regNo: "",
    studentName: "",
    residence: "",
  });
  const [editStudent, setEditStudent] = useState(null);
  const [editStudentSearch, setEditStudentSearch] = useState("");
  const [selectedStudentToRemove, setSelectedStudentToRemove] = useState("");

  // Teacher management states
  const [teacherTab, setTeacherTab] = useState("list");
  const [courses, setCourses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    subject: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedTeacherForCourse, setSelectedTeacherForCourse] =
    useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedCourseToRemove, setSelectedCourseToRemove] = useState(null);
  const [editClassTeacher, setEditClassTeacher] = useState(null);
  const [editTeacherSearch, setEditTeacherSearch] = useState("");

  useEffect(() => {
    async function fetchClassData() {
      // Fetch students
      const resStudents = await fetch(`/api/students?classId=${id}`);
      const dataStudents = await resStudents.json();
      setStudents(dataStudents.success ? dataStudents.students : []);
      // Fetch class-teachers assignments
      const resTeachers = await fetch(`/api/class-teachers?classId=${id}`);
      const dataTeachers = await resTeachers.json();
      if (dataTeachers.success) {
        const mappedTeachers = dataTeachers.assignments.map((assignment) => ({
          classTeacherId: assignment.id,
          id: assignment.id,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.subject,
          name: assignment.teacher.name,
          mobile: assignment.teacher.mobileNo,
          teacherId: assignment.teacher.id,
          courseId: assignment.course.id,
        }));
        setTeachers(mappedTeachers);
      }
      // Fetch courses
      const resCourses = await fetch("/api/courses");
      const dataCourses = await resCourses.json();
      setCourses(dataCourses.success ? dataCourses.courses : []);
      // Fetch all teachers
      const resAllTeachers = await fetch("/api/teachers");
      const dataAllTeachers = await resAllTeachers.json();
      setAllTeachers(dataAllTeachers.success ? dataAllTeachers.teachers : []);
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

  // Fetch students for selected class
  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${id}`);
      const data = await res.json();
      setStudents(data.success ? data.students : []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data.success ? data.courses : []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  // Fetch all teachers in the system
  const fetchAllTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setAllTeachers(data.success ? data.teachers : []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  // Add Student
  const addStudent = async () => {
    if (
      !newStudent.rollNo.trim() ||
      !newStudent.regNo.trim() ||
      !newStudent.studentName.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStudent,
          classId: parseInt(id),
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Student added successfully!");
        setNewStudent({
          rollNo: "",
          regNo: "",
          studentName: "",
          residence: "",
        });
        fetchStudents();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to add student: " + error.message);
    }
  };

  // Delete Student
  const deleteStudent = async (studentId) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const res = await fetch(`/api/students?studentId=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        alert("Student deleted successfully!");
        setSelectedStudentToRemove("");
        fetchStudents();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to delete student: " + error.message);
    }
  };

  // Update Student
  const updateStudent = async () => {
    if (
      !editStudent.rollNo.trim() ||
      !editStudent.regNo.trim() ||
      !editStudent.studentName.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStudent),
      });
      const data = await res.json();

      if (data.success) {
        alert("Student updated successfully!");
        setEditStudent(null);
        setEditStudentSearch("");
        fetchStudents();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to update student: " + error.message);
    }
  };

  // Add Course
  const addCourse = async () => {
    if (!newCourse.courseCode.trim() || !newCourse.subject.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();

      if (data.success) {
        alert("Course added successfully!");
        setNewCourse({ courseCode: "", subject: "" });
        fetchCourses();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to add course: " + error.message);
    }
  };

  // Add Teacher to Course
  const addTeacherToCourse = async () => {
    if (!selectedCourse || !selectedTeacherForCourse) {
      alert("Please select both a course and a teacher");
      return;
    }

    try {
      const res = await fetch("/api/class-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: parseInt(id),
          teacherId: selectedTeacherForCourse.id,
          courseId: selectedCourse.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher assigned successfully!");
        setSelectedTeacherForCourse(null);
        setSelectedCourse(null);
        setTeacherSearch("");
        setCourseSearch("");
        fetchClassTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to assign teacher: " + error.message);
    }
  };

  // Fetch Class Teachers
  const fetchClassTeachers = async () => {
    try {
      const res = await fetch(`/api/class-teachers?classId=${id}`);
      const data = await res.json();
      if (data.success) {
        // Map the assignments to a format the UI can display
        const mappedTeachers = data.assignments.map((assignment) => ({
          classTeacherId: assignment.id,
          id: assignment.id,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.subject,
          name: assignment.teacher.name,
          mobile: assignment.teacher.mobileNo,
          teacherId: assignment.teacher.id,
          courseId: assignment.course.id,
        }));
        setTeachers(mappedTeachers);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  // Remove Course (and all teachers assigned to it)
  const removeCourse = async () => {
    if (!selectedCourseToRemove) {
      alert("Please select a course");
      return;
    }

    if (
      !confirm(
        "Removing this course will also remove all teachers assigned to it. Continue?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseToRemove.id,
          classId: parseInt(id),
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Course and assigned teachers removed successfully!");
        setSelectedCourseToRemove(null);
        fetchCourses();
        fetchClassTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to remove course: " + error.message);
    }
  };

  // Update Teacher Assignment
  const updateTeacherAssignment = async () => {
    if (!editClassTeacher) {
      alert("Please select a teacher");
      return;
    }

    try {
      const res = await fetch("/api/class-teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editClassTeacher),
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher assignment updated successfully!");
        setEditClassTeacher(null);
        setEditTeacherSearch("");
        fetchClassTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to update assignment: " + error.message);
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
            <div>
              {/* Student Sub-tabs Navigation */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  borderBottom: "2px solid #ddd",
                  paddingBottom: "10px",
                }}
              >
                <button
                  onClick={() => setStudentTab("list")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      studentTab === "list" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "list" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: studentTab === "list" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  List
                </button>
                <button
                  onClick={() => setStudentTab("addStudent")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      studentTab === "addStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "addStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: studentTab === "addStudent" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Add Student
                </button>
                <button
                  onClick={() => setStudentTab("removeStudent")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      studentTab === "removeStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "removeStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight:
                      studentTab === "removeStudent" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Remove Student
                </button>
                <button
                  onClick={() => setStudentTab("editStudent")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      studentTab === "editStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "editStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight:
                      studentTab === "editStudent" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Edit Student
                </button>
              </div>

              {/* List Tab */}
              {studentTab === "list" && (
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

              {/* Add Student Tab */}
              {studentTab === "addStudent" && (
                <div className="form-section">
                  <h3>Add New Student</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Roll No</label>
                      <input
                        type="text"
                        value={newStudent.rollNo}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            rollNo: e.target.value,
                          })
                        }
                        placeholder="Enter roll number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Reg No</label>
                      <input
                        type="text"
                        value={newStudent.regNo}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            regNo: e.target.value,
                          })
                        }
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Student Name</label>
                      <input
                        type="text"
                        value={newStudent.studentName}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            studentName: e.target.value,
                          })
                        }
                        placeholder="Enter student name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Residence</label>
                      <input
                        type="text"
                        value={newStudent.residence}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            residence: e.target.value,
                          })
                        }
                        placeholder="Enter residence"
                      />
                    </div>
                  </div>
                  <button onClick={addStudent} className="add-btn">
                    Add Student
                  </button>
                </div>
              )}

              {/* Remove Student Tab */}
              {studentTab === "removeStudent" && (
                <div className="form-section">
                  <h3>Remove Student</h3>
                  <div className="form-group">
                    <label>Student Name to Remove</label>
                    <input
                      type="text"
                      value={selectedStudentToRemove}
                      onChange={(e) =>
                        setSelectedStudentToRemove(e.target.value)
                      }
                      placeholder="Enter student name to remove"
                    />
                    {/* Matching students list */}
                    {selectedStudentToRemove.trim() && (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {students
                          .filter((student) =>
                            student.studentName
                              .toLowerCase()
                              .includes(selectedStudentToRemove.toLowerCase()),
                          )
                          .map((student) => (
                            <div
                              key={student.id}
                              onClick={() =>
                                setSelectedStudentToRemove(student.studentName)
                              }
                              style={{
                                padding: "10px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                backgroundColor:
                                  selectedStudentToRemove.toLowerCase() ===
                                  student.studentName.toLowerCase()
                                    ? "#e3f2fd"
                                    : "#fff",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#f5f5f5")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor =
                                  selectedStudentToRemove.toLowerCase() ===
                                  student.studentName.toLowerCase()
                                    ? "#e3f2fd"
                                    : "#fff")
                              }
                            >
                              {student.studentName} (Reg: {student.regNo})
                            </div>
                          ))}
                        {students.filter((student) =>
                          student.studentName
                            .toLowerCase()
                            .includes(selectedStudentToRemove.toLowerCase()),
                        ).length === 0 && (
                          <div style={{ padding: "10px", color: "#999" }}>
                            No students found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const studentToDelete = students.find(
                        (s) =>
                          s.studentName.toLowerCase() ===
                          selectedStudentToRemove.toLowerCase(),
                      );
                      if (studentToDelete) {
                        deleteStudent(studentToDelete.id);
                      } else if (selectedStudentToRemove.trim()) {
                        alert("Student not found");
                      }
                    }}
                    className="add-btn"
                    disabled={!selectedStudentToRemove.trim()}
                  >
                    Remove Student
                  </button>
                </div>
              )}

              {/* Edit Student Tab */}
              {studentTab === "editStudent" && (
                <div className="form-section">
                  <h3>Edit Student</h3>
                  {!editStudent ? (
                    <div className="form-group">
                      <label>Select Student to Edit</label>
                      <input
                        type="text"
                        value={editStudentSearch}
                        onChange={(e) => setEditStudentSearch(e.target.value)}
                        placeholder="Search student by name"
                      />
                      {/* Matching students list */}
                      {editStudentSearch.trim() && (
                        <div
                          style={{
                            marginTop: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {students
                            .filter((student) =>
                              student.studentName
                                .toLowerCase()
                                .includes(editStudentSearch.toLowerCase()),
                            )
                            .map((student) => (
                              <div
                                key={student.id}
                                onClick={() => {
                                  setEditStudent(student);
                                  setEditStudentSearch("");
                                }}
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
                          {students.filter((student) =>
                            student.studentName
                              .toLowerCase()
                              .includes(editStudentSearch.toLowerCase()),
                          ).length === 0 && (
                            <div style={{ padding: "10px", color: "#999" }}>
                              No students found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          marginBottom: "20px",
                          padding: "15px",
                          backgroundColor: "#e3f2fd",
                          borderRadius: "4px",
                          border: "1px solid #2196F3",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h4 style={{ margin: "0 0 5px 0" }}>
                            {editStudent.studentName}
                          </h4>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            Reg: {editStudent.regNo} | Roll:{" "}
                            {editStudent.rollNo}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditStudent(null);
                            setEditStudentSearch("");
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
                          Change
                        </button>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Roll No</label>
                          <input
                            type="text"
                            value={editStudent.rollNo}
                            onChange={(e) =>
                              setEditStudent({
                                ...editStudent,
                                rollNo: e.target.value,
                              })
                            }
                            placeholder="Enter roll number"
                          />
                        </div>
                        <div className="form-group">
                          <label>Reg No</label>
                          <input
                            type="text"
                            value={editStudent.regNo}
                            onChange={(e) =>
                              setEditStudent({
                                ...editStudent,
                                regNo: e.target.value,
                              })
                            }
                            placeholder="Enter registration number"
                          />
                        </div>
                        <div className="form-group">
                          <label>Student Name</label>
                          <input
                            type="text"
                            value={editStudent.studentName}
                            onChange={(e) =>
                              setEditStudent({
                                ...editStudent,
                                studentName: e.target.value,
                              })
                            }
                            placeholder="Enter student name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Residence</label>
                          <input
                            type="text"
                            value={editStudent.residence}
                            onChange={(e) =>
                              setEditStudent({
                                ...editStudent,
                                residence: e.target.value,
                              })
                            }
                            placeholder="Enter residence"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={updateStudent}
                    className="add-btn"
                    disabled={!editStudent}
                  >
                    Update Student
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === "teachers" && (
            <div>
              {/* Teacher Sub-tabs Navigation */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  borderBottom: "2px solid #ddd",
                  paddingBottom: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setTeacherTab("list");
                    fetchCourses();
                    fetchAllTeachers();
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      teacherTab === "list" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "list" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: teacherTab === "list" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  List
                </button>
                <button
                  onClick={() => {
                    setTeacherTab("addTeacher");
                    fetchCourses();
                    fetchAllTeachers();
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      teacherTab === "addTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "addTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: teacherTab === "addTeacher" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setTeacherTab("removeTeacher");
                    fetchCourses();
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      teacherTab === "removeTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "removeTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight:
                      teacherTab === "removeTeacher" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setTeacherTab("editTeacher");
                    fetchAllTeachers();
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      teacherTab === "editTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "editTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight:
                      teacherTab === "editTeacher" ? "bold" : "normal",
                    transition: "all 0.3s",
                  }}
                >
                  Edit
                </button>
              </div>

              {/* List Tab */}
              {teacherTab === "list" && (
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

              {/* Add Tab */}
              {teacherTab === "addTeacher" && (
                <div>
                  {/* Add Course Section */}
                  <div className="form-section">
                    <h3>Add New Course</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Course Code</label>
                        <input
                          type="text"
                          value={newCourse.courseCode}
                          onChange={(e) =>
                            setNewCourse({
                              ...newCourse,
                              courseCode: e.target.value,
                            })
                          }
                          placeholder="Enter course code"
                        />
                      </div>
                      <div className="form-group">
                        <label>Subject Name</label>
                        <input
                          type="text"
                          value={newCourse.subject}
                          onChange={(e) =>
                            setNewCourse({
                              ...newCourse,
                              subject: e.target.value,
                            })
                          }
                          placeholder="Enter subject name"
                        />
                      </div>
                    </div>
                    <button onClick={addCourse} className="add-btn">
                      Add Course
                    </button>
                  </div>

                  {/* Add Teacher to Course Section */}
                  <div className="form-section">
                    <h3>Assign Teacher to Course</h3>

                    {/* Select Course */}
                    <div className="form-group">
                      <label>Select Course</label>
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Search course by code or name..."
                      />
                      {courseSearch.trim() && !selectedCourse && (
                        <div
                          style={{
                            marginTop: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {courses
                            .filter(
                              (course) =>
                                course.courseCode
                                  .toLowerCase()
                                  .includes(courseSearch.toLowerCase()) ||
                                course.subject
                                  .toLowerCase()
                                  .includes(courseSearch.toLowerCase()),
                            )
                            .map((course) => (
                              <div
                                key={course.id}
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setCourseSearch("");
                                }}
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
                                {course.courseCode} - {course.subject}
                              </div>
                            ))}
                          {courses.filter(
                            (course) =>
                              course.courseCode
                                .toLowerCase()
                                .includes(courseSearch.toLowerCase()) ||
                              course.subject
                                .toLowerCase()
                                .includes(courseSearch.toLowerCase()),
                          ).length === 0 && (
                            <div style={{ padding: "10px", color: "#999" }}>
                              No courses found
                            </div>
                          )}
                        </div>
                      )}
                      {selectedCourse && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            {selectedCourse.courseCode} -{" "}
                            {selectedCourse.subject}
                          </div>
                          <button
                            onClick={() => setSelectedCourse(null)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "#f44336",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Select Teacher */}
                    {selectedCourse && (
                      <div className="form-group">
                        <label>Select Teacher</label>
                        <input
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          placeholder="Search teacher by name or mobile..."
                        />
                        {teacherSearch.trim() && !selectedTeacherForCourse && (
                          <div
                            style={{
                              marginTop: "10px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {allTeachers
                              .filter(
                                (teacher) =>
                                  teacher.name
                                    .toLowerCase()
                                    .includes(teacherSearch.toLowerCase()) ||
                                  teacher.mobile
                                    .toLowerCase()
                                    .includes(teacherSearch.toLowerCase()),
                              )
                              .map((teacher) => (
                                <div
                                  key={teacher.id}
                                  onClick={() => {
                                    setSelectedTeacherForCourse(teacher);
                                    setTeacherSearch("");
                                  }}
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
                                  {teacher.name} ({teacher.mobile})
                                </div>
                              ))}
                            {allTeachers.filter(
                              (teacher) =>
                                teacher.name
                                  .toLowerCase()
                                  .includes(teacherSearch.toLowerCase()) ||
                                teacher.mobile
                                  .toLowerCase()
                                  .includes(teacherSearch.toLowerCase()),
                            ).length === 0 && (
                              <div style={{ padding: "10px", color: "#999" }}>
                                No teachers found
                              </div>
                            )}
                          </div>
                        )}
                        {selectedTeacherForCourse && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px",
                              backgroundColor: "#e8f5e9",
                              borderRadius: "4px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              {selectedTeacherForCourse.name} (
                              {selectedTeacherForCourse.mobile})
                            </div>
                            <button
                              onClick={() => setSelectedTeacherForCourse(null)}
                              style={{
                                padding: "5px 10px",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCourse && selectedTeacherForCourse && (
                      <button onClick={addTeacherToCourse} className="add-btn">
                        Assign Teacher
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Remove Tab */}
              {teacherTab === "removeTeacher" && (
                <div className="form-section">
                  <h3>Remove Course (and Assigned Teachers)</h3>
                  <div className="form-group">
                    <label>Select Course to Remove</label>
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search course..."
                    />
                    {courseSearch.trim() && !selectedCourseToRemove && (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {courses
                          .filter(
                            (course) =>
                              course.courseCode
                                .toLowerCase()
                                .includes(courseSearch.toLowerCase()) ||
                              course.subject
                                .toLowerCase()
                                .includes(courseSearch.toLowerCase()),
                          )
                          .map((course) => (
                            <div
                              key={course.id}
                              onClick={() => {
                                setSelectedCourseToRemove(course);
                                setCourseSearch("");
                              }}
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
                              {course.courseCode} - {course.subject}
                            </div>
                          ))}
                      </div>
                    )}
                    {selectedCourseToRemove && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px",
                          backgroundColor: "#ffebee",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          {selectedCourseToRemove.courseCode} -{" "}
                          {selectedCourseToRemove.subject}
                        </div>
                        <button
                          onClick={() => setSelectedCourseToRemove(null)}
                          style={{
                            padding: "5px 10px",
                            backgroundColor: "#666",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={removeCourse}
                    className="add-btn"
                    disabled={!selectedCourseToRemove}
                    style={{
                      backgroundColor: !selectedCourseToRemove
                        ? "#ccc"
                        : "#f44336",
                    }}
                  >
                    Remove Course
                  </button>
                </div>
              )}

              {/* Edit Tab */}
              {teacherTab === "editTeacher" && (
                <div className="form-section">
                  <h3>Edit Teacher Assignment</h3>
                  {!editClassTeacher ? (
                    <div className="form-group">
                      <label>Select Teacher to Edit</label>
                      <input
                        type="text"
                        value={editTeacherSearch}
                        onChange={(e) => setEditTeacherSearch(e.target.value)}
                        placeholder="Search teacher by name..."
                      />
                      {editTeacherSearch.trim() && (
                        <div
                          style={{
                            marginTop: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {teachers
                            .filter((teacher) =>
                              teacher.name
                                .toLowerCase()
                                .includes(editTeacherSearch.toLowerCase()),
                            )
                            .map((teacher) => (
                              <div
                                key={teacher.classTeacherId}
                                onClick={() => {
                                  setEditClassTeacher({
                                    ...teacher,
                                    id: teacher.classTeacherId,
                                  });
                                  setEditTeacherSearch("");
                                }}
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
                                {teacher.name} - {teacher.courseCode} (
                                {teacher.courseName})
                              </div>
                            ))}
                          {teachers.filter((teacher) =>
                            teacher.name
                              .toLowerCase()
                              .includes(editTeacherSearch.toLowerCase()),
                          ).length === 0 && (
                            <div style={{ padding: "10px", color: "#999" }}>
                              No teachers found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          marginBottom: "20px",
                          padding: "15px",
                          backgroundColor: "#e3f2fd",
                          borderRadius: "4px",
                          border: "1px solid #2196F3",
                        }}
                      >
                        <div>
                          <h4 style={{ margin: "0 0 5px 0" }}>
                            {editClassTeacher.name}
                          </h4>
                          <p
                            style={{
                              margin: "0",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            Current Course: {editClassTeacher.courseCode} -{" "}
                            {editClassTeacher.courseName}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditClassTeacher(null);
                            setEditTeacherSearch("");
                          }}
                          style={{
                            marginTop: "10px",
                            padding: "8px 16px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Choose Different Teacher
                        </button>
                      </div>

                      <div className="form-group">
                        <label>Select New Course</label>
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Search course..."
                        />
                        {courseSearch.trim() && (
                          <div
                            style={{
                              marginTop: "10px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {courses
                              .filter(
                                (course) =>
                                  course.courseCode
                                    .toLowerCase()
                                    .includes(courseSearch.toLowerCase()) ||
                                  course.subject
                                    .toLowerCase()
                                    .includes(courseSearch.toLowerCase()),
                              )
                              .map((course) => (
                                <div
                                  key={course.id}
                                  onClick={() => {
                                    setEditClassTeacher({
                                      ...editClassTeacher,
                                      courseId: course.id,
                                      courseCode: course.courseCode,
                                      courseName: course.subject,
                                    });
                                    setCourseSearch("");
                                  }}
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
                                  {course.courseCode} - {course.subject}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={updateTeacherAssignment}
                    className="add-btn"
                    disabled={!editClassTeacher}
                  >
                    Update Assignment
                  </button>
                </div>
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

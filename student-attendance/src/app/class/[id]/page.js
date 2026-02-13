"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/apiUtils";
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
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);

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
      const resStudents = await apiCall(`/api/students?classId=${id}`);
      const dataStudents = await resStudents.json();
      setStudents(dataStudents.success ? dataStudents.students : []);
      // Fetch class-teachers assignments
      const resTeachers = await apiCall(`/api/class-teachers?classId=${id}`);
      const dataTeachers = await resTeachers.json();
      if (dataTeachers.success) {
        const mappedTeachers = dataTeachers.assignments.map((assignment) => ({
          classTeacherId: assignment.id,
          id: assignment.id,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.subject,
          name: assignment.teacher.name,
          mobile: assignment.teacher.mobile,
          teacherId: assignment.teacher.id,
          courseId: assignment.course.id,
        }));
        setTeachers(mappedTeachers);
      }
      // Fetch courses
      const resCourses = await apiCall(`/api/courses?classId=${id}`);
      const dataCourses = await resCourses.json();
      setCourses(dataCourses.success ? dataCourses.courses : []);
      // Fetch all teachers
      const resAllTeachers = await apiCall("/api/teachers");
      const dataAllTeachers = await resAllTeachers.json();
      setAllTeachers(dataAllTeachers.success ? dataAllTeachers.teachers : []);
    }
    fetchClassData();
  }, [id]);

  const fetchStudentAttendance = async (studentId) => {
    try {
      const res = await apiCall(`/api/attendance?studentId=${studentId}`);
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
      const res = await apiCall(`/api/students?classId=${id}`);
      const data = await res.json();
      setStudents(data.success ? data.students : []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  // Fetch all courses for this class
  const fetchCourses = async () => {
    try {
      const res = await apiCall(`/api/courses?classId=${id}`);
      const data = await res.json();
      setCourses(data.success ? data.courses : []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  // Fetch all teachers in the system
  const fetchAllTeachers = async () => {
    try {
      const res = await apiCall("/api/teachers");
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
      const res = await apiCall("/api/students", {
        method: "POST",
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
      const res = await apiCall(`/api/students?studentId=${studentId}`, {
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
      const res = await apiCall("/api/students", {
        method: "PUT",
        body: JSON.stringify({
          studentId: editStudent.id,
          rollNo: editStudent.rollNo,
          regNo: editStudent.regNo,
          studentName: editStudent.studentName,
          residence: editStudent.residence,
          classId: editStudent.classId,
        }),
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

  // Open Student Modal for editing
  const openStudentModal = (student) => {
    setModalStudent({
      id: student.id,
      rollNo: student.rollNo,
      regNo: student.regNo,
      studentName: student.studentName,
      residence: student.residence,
      classId: student.classId,
    });
    setShowStudentModal(true);
  };

  // Save Student from Modal
  const saveModalStudent = async () => {
    if (
      !modalStudent.rollNo.trim() ||
      !modalStudent.regNo.trim() ||
      !modalStudent.studentName.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await apiCall("/api/students", {
        method: "PUT",
        body: JSON.stringify({
          studentId: modalStudent.id,
          rollNo: modalStudent.rollNo,
          regNo: modalStudent.regNo,
          studentName: modalStudent.studentName,
          residence: modalStudent.residence,
          classId: modalStudent.classId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Student updated successfully!");
        setShowStudentModal(false);
        setModalStudent(null);
        fetchStudents();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to update student: " + error.message);
    }
  };

  // Delete Student from Modal
  const deleteModalStudent = async () => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const res = await apiCall(`/api/students?studentId=${modalStudent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        alert("Student deleted successfully!");
        setShowStudentModal(false);
        setModalStudent(null);
        fetchStudents();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to delete student: " + error.message);
    }
  };

  // Add Course
  const addCourse = async () => {
    if (!newCourse.courseCode.trim() || !newCourse.subject.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await apiCall("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          ...newCourse,
          classId: parseInt(id),
        }),
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
      const res = await apiCall("/api/class-teachers", {
        method: "POST",
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
      const res = await apiCall(`/api/class-teachers?classId=${id}`);
      const data = await res.json();
      if (data.success) {
        // Map the assignments to a format the UI can display
        const mappedTeachers = data.assignments.map((assignment) => ({
          classTeacherId: assignment.id,
          id: assignment.id,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.subject,
          name: assignment.teacher.name,
          mobile: assignment.teacher.mobile,
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
      const res = await apiCall("/api/courses", {
        method: "DELETE",
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
      const res = await apiCall("/api/class-teachers", {
        method: "PUT",
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
    setAttendanceSearch("");
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
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "20px",
                  borderBottom: "2px solid #ddd",
                  paddingBottom: "10px",
                }}
              >
                <button
                  onClick={() => setStudentTab("list")}
                  style={{
                    padding: "10px 12px",
                    backgroundColor:
                      studentTab === "list" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "list" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: studentTab === "list" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
                  }}
                >
                  List
                </button>
                <button
                  onClick={() => setStudentTab("addStudent")}
                  style={{
                    padding: "10px 12px",
                    backgroundColor:
                      studentTab === "addStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "addStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: studentTab === "addStudent" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setStudentTab("removeStudent")}
                  style={{
                    padding: "10px 12px",
                    backgroundColor:
                      studentTab === "removeStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "removeStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: studentTab === "removeStudent" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
                  }}
                >
                  Remove
                </button>
                <button
                  onClick={() => setStudentTab("editStudent")}
                  style={{
                    padding: "10px 12px",
                    backgroundColor:
                      studentTab === "editStudent" ? "#007bff" : "#f0f0f0",
                    color: studentTab === "editStudent" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: studentTab === "editStudent" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
                  }}
                >
                  Edit
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
                    <div>Action</div>
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
                        <div>
                          <button
                            onClick={() => openStudentModal(student)}
                            style={{
                              backgroundColor: "#f5f5f5",
                              color: "#333",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Edit Student"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M2 14l1-4 9-9a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8L5.8 13l-3.8 1z" />
                            </svg>
                          </button>
                        </div>
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
                      <select
                        value={newStudent.residence}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            residence: e.target.value,
                          })
                        }
                      >
                        <option value="">Select residence type</option>
                        <option value="H">Hosteller (H)</option>
                        <option value="D">Day Scholar (D)</option>
                        <option value="OSS">Outside Stayer (OSS)</option>
                      </select>
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
                          <select
                            value={editStudent.residence}
                            onChange={(e) =>
                              setEditStudent({
                                ...editStudent,
                                residence: e.target.value,
                              })
                            }
                          >
                            <option value="">Select residence type</option>
                            <option value="H">Hosteller (H)</option>
                            <option value="D">Day Scholar (D)</option>
                            <option value="OSS">Outside Stayer (OSS)</option>
                          </select>
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

              {/* Student Edit Modal */}
              {showStudentModal && modalStudent && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                  }}
                  onClick={() => {
                    setShowStudentModal(false);
                    setModalStudent(null);
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      padding: "30px",
                      maxWidth: "500px",
                      width: "90%",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      maxHeight: "90vh",
                      overflowY: "auto",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ marginTop: 0 }}>Edit Student</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Roll No</label>
                        <input
                          type="text"
                          value={modalStudent.rollNo}
                          onChange={(e) =>
                            setModalStudent({
                              ...modalStudent,
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
                          value={modalStudent.regNo}
                          onChange={(e) =>
                            setModalStudent({
                              ...modalStudent,
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
                          value={modalStudent.studentName}
                          onChange={(e) =>
                            setModalStudent({
                              ...modalStudent,
                              studentName: e.target.value,
                            })
                          }
                          placeholder="Enter student name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Residence</label>
                        <select
                          value={modalStudent.residence}
                          onChange={(e) =>
                            setModalStudent({
                              ...modalStudent,
                              residence: e.target.value,
                            })
                          }
                        >
                          <option value="">Select residence type</option>
                          <option value="H">Hosteller (H)</option>
                          <option value="D">Day Scholar (D)</option>
                          <option value="OSS">Outside Stayer (OSS)</option>
                        </select>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        onClick={saveModalStudent}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={deleteModalStudent}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        Delete Student
                      </button>
                      <button
                        onClick={() => {
                          setShowStudentModal(false);
                          setModalStudent(null);
                        }}
                        style={{
                          flex: 0,
                          padding: "10px 20px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
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
                  flexWrap: "wrap",
                  gap: "8px",
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
                    padding: "10px 12px",
                    backgroundColor:
                      teacherTab === "list" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "list" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: teacherTab === "list" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
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
                    padding: "10px 12px",
                    backgroundColor:
                      teacherTab === "addTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "addTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: teacherTab === "addTeacher" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
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
                    padding: "10px 12px",
                    backgroundColor:
                      teacherTab === "removeTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "removeTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: teacherTab === "removeTeacher" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
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
                    padding: "10px 12px",
                    backgroundColor:
                      teacherTab === "editTeacher" ? "#007bff" : "#f0f0f0",
                    color: teacherTab === "editTeacher" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: teacherTab === "editTeacher" ? 700 : 600,
                    transition: "all 0.3s",
                    flex: "1 1 auto",
                    minWidth: "70px",
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
                  {courses.length === 0 ? (
                    <div className="list-item">
                      No courses available. Add a course first.
                    </div>
                  ) : (
                    courses
                      .map((course) => {
                        const assignedTeachers = teachers.filter(
                          (t) => t.courseId === course.id,
                        );

                        if (assignedTeachers.length === 0) {
                          return (
                            <div
                              key={course.id}
                              className="list-item"
                              style={{ backgroundColor: "#f9f9f9" }}
                            >
                              <div>{courses.indexOf(course) + 1}</div>
                              <div>{course.courseCode}</div>
                              <div>{course.subject}</div>
                              <div>-</div>
                              <div>-</div>
                            </div>
                          );
                        }

                        return assignedTeachers.map((teacher, idx) => (
                          <div
                            key={`${course.id}-${teacher.id}`}
                            className="list-item"
                          >
                            <div>
                              {courses.indexOf(course) + 1}
                              {idx > 0 && "."}
                              {idx > 0 && String.fromCharCode(97 + idx - 1)}
                            </div>
                            <div>{course.courseCode}</div>
                            <div>{course.subject}</div>
                            <div>{teacher.name}</div>
                            <div>{teacher.mobile}</div>
                          </div>
                        ));
                      })
                      .flat()
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
              {attendanceSearch.trim() && (
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

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "../attendance.css";

export default function AdminDashboard({ user, onLogout }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("management");
  const [selectedProgram, setSelectedProgram] = useState("BE");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  // State for selected class and class tab
  const [selectedClass, setSelectedClass] = useState(null);
  const [classTab, setClassTab] = useState("students");
  const [classStudents, setClassStudents] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [programs] = useState([
    { id: 1, name: "BE" },
    { id: 2, name: "BTech" },
  ]);

  // Form states for adding new items
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
  });

  // Search state for teachers
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherToRemove, setSelectedTeacherToRemove] = useState("");

  // Teacher Management
  const addTeacher = async () => {
    if (
      newTeacher.name &&
      newTeacher.email &&
      newTeacher.phone &&
      newTeacher.departmentId
    ) {
      // TODO: Implement API call to add teacher
      // After successful add, refetch teachers
      setNewTeacher({
        name: "",
        email: "",
        phone: "",
        departmentId: "",
      });
    }
  };

  const deleteTeacher = async (teacherId) => {
    // TODO: Implement API call to delete teacher
    // After successful delete, refetch teachers
  };

  // Fetch departments for selected program
  useEffect(() => {
    async function fetchDepartments() {
      const res = await fetch(`/api/departments?program=${selectedProgram}`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
        setSelectedDepartment(null);
      } else {
        setDepartments([]);
        setSelectedDepartment(null);
      }
    }
    fetchDepartments();
  }, [selectedProgram]);

  // Fetch classes for selected department
  useEffect(() => {
    async function fetchClasses() {
      if (!selectedDepartment) {
        setClasses([]);
        setSelectedClass(null);
        return;
      }
      const res = await fetch(
        `/api/classes?departmentId=${selectedDepartment.id}`,
      );
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      } else {
        setClasses([]);
      }
      setSelectedClass(null);
    }
    fetchClasses();
  }, [selectedDepartment]);

  // Fetch students and teachers for selected class
  useEffect(() => {
    if (!selectedClass) {
      setClassStudents([]);
      setClassTeachers([]);
      return;
    }
    async function fetchClassDetails() {
      // Fetch students
      const resStudents = await fetch(
        `/api/students?classId=${selectedClass.id}`,
      );
      const dataStudents = await resStudents.json();
      setClassStudents(dataStudents.success ? dataStudents.students : []);
      // Fetch teachers
      const resTeachers = await fetch(
        `/api/teachers?classId=${selectedClass.id}`,
      );
      const dataTeachers = await resTeachers.json();
      setClassTeachers(dataTeachers.success ? dataTeachers.teachers : []);
    }
    fetchClassDetails();
  }, [selectedClass]);

  // Fetch teachers
  useEffect(() => {
    async function fetchTeachers() {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      if (data.success) setTeachers(data.teachers);
    }
    fetchTeachers();
  }, []);

  // Generate Attendance Report (async)
  const generateReport = async () => {
    const report = {};
    for (const dept of departments) {
      // Fetch all classes in this department
      const resClasses = await fetch(`/api/classes?departmentId=${dept.id}`);
      const dataClasses = await resClasses.json();
      const classes = dataClasses.success ? dataClasses.classes : [];
      report[dept.name] = {};
      for (const classItem of classes) {
        // Fetch attendance for this class for today (or a selected date)
        const today = new Date().toISOString().split("T")[0];
        const resAttendance = await fetch(
          `/api/attendance?classId=${classItem.id}&from=${today}&to=${today}`,
        );
        let dataAttendance = {};
        try {
          dataAttendance = await resAttendance.json();
        } catch {
          dataAttendance = { success: false, error: "Invalid JSON response" };
        }
        let absences = [];
        if (dataAttendance.success) {
          const { students, attendanceRecords } = dataAttendance;
          // Map studentId to student info
          const studentMap = {};
          students.forEach((s) => {
            studentMap[s.id] = s;
          });
          // Group absences for this class
          attendanceRecords
            .filter((r) => r.status === "absent")
            .forEach((rec) => {
              absences.push({
                rollNo: studentMap[rec.studentId]?.rollNo || rec.studentId,
                name: studentMap[rec.studentId]?.studentName || "",
                residence: studentMap[rec.studentId]?.residence || "",
                reason: rec.absenceReason || "",
                informed: rec.informed || "",
                leavesTaken: attendanceRecords.filter(
                  (r2) =>
                    r2.studentId === rec.studentId && r2.status === "absent",
                ).length,
              });
            });
        }
        report[dept.name][classItem.name] = absences;
      }
    }
    return report;
  };

  // Print Absence Report (async)
  const printReport = async () => {
    // Fetch today's attendance data for print report
    // Fetch all attendance records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const report = await generateReport();
      let printContent = `
        <html>
          <head>
            <title>Absence Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }
              h1 {
                text-align: center;
                color: #333;
                margin-bottom: 10px;
              }
              .date {
                text-align: center;
                color: #666;
                margin-bottom: 20px;
                font-size: 14px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #34495e;
                color: white;
                padding: 12px;
                text-align: left;
                border: 1px solid #333;
                font-weight: bold;
              }
              td {
                padding: 10px 12px;
                border: 1px solid #bbb;
                text-align: left;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              tr:hover {
                background-color: #ecf0f1;
              }
              .department-header {
                background-color: #000000;
                color: black;
                font-size: 24px;
                font-weight: 900;
                padding: 15px;
                margin-top: 20px;
                margin-bottom: 10px;
              }
              @media print {
                body { margin: 10px; }
                table { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>Absence Report</h1>
            <div class="date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      `;
      Object.entries(report).forEach(([deptName, absencesByClass]) => {
        printContent += `<div class="department-header">${deptName}</div>`;
        Object.entries(absencesByClass).forEach(([className, absences]) => {
          printContent += `<div style="font-size:20px;font-weight:bold;margin:10px 0;">Class: ${className}</div>`;
          if (absences.length > 0) {
            printContent += `
              <table>
                <thead>
                  <tr>
                    <th>S No</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Residence</th>
                    <th>Absence Reason</th>
                    <th>Status</th>
                    <th>Leaves Taken</th>
                  </tr>
                </thead>
                <tbody>
            `;
            absences.forEach((student, idx) => {
              // Status: Informed or Not Informed
              let status = "Not Informed";
              if (typeof student.informed === "string") {
                status =
                  student.informed.toLowerCase() === "informed"
                    ? "Informed"
                    : "Not Informed";
              } else if (student.informed === true) {
                status = "Informed";
              }
              printContent += `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${student.rollNo}</td>
                  <td>${student.name}</td>
                  <td>${student.residence || ""}</td>
                  <td>${student.reason || ""}</td>
                  <td>${status}</td>
                  <td>${student.leavesTaken || 0}</td>
                </tr>
              `;
            });
            printContent += `
                </tbody>
              </table>
            `;
          } else {
            printContent += `<p style="color: #27ae60; padding: 10px;">No absences</p>`;
          }
        });
      });
      printContent += `
          </body>
        </html>
      `;
      // Clean up any references after printing
      setTimeout(() => {}, 0);
      const printWindow = window.open("", "", "width=900,height=600");
      if (!printWindow) {
        alert(
          "Failed to open print window. Please check your browser settings.",
        );
        return;
      }
      if (!printWindow.document) {
        alert(
          "Print window document is not accessible. Please check your browser settings.",
        );
        return;
      }
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      alert(
        "Failed to generate report. Please check attendance data and try again.",
      );
    }
    let printContent = `
      <html>
        <head>
          <title>Absence Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 10px;
            }
            .date {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #34495e;
              color: white;
              padding: 12px;
              text-align: left;
              border: 1px solid #333;
              font-weight: bold;
            }
            td {
              padding: 10px 12px;
              border: 1px solid #bbb;
              text-align: left;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #ecf0f1;
            }
            .department-header {
              background-color: #000000;
              color: black;
              font-size: 24px;
              font-weight: 900;
              padding: 15px;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            @media print {
              body { margin: 10px; }
              table { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Absence Report</h1>
          <div class="date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
    `;

    // ...existing code...

    printContent += `
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "width=900,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const report = generateReport();

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-header">
          <div>
            <h1>Administrator Dashboard</h1>
            <p className="teacher-name">Welcome, {user.name}</p>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="admin-nav">
          <button
            className={`nav-btn ${activeTab === "management" ? "active" : ""}`}
            onClick={() => setActiveTab("management")}
          >
            Management
          </button>
          <button
            className={`nav-btn ${activeTab === "teachers" ? "active" : ""}`}
            onClick={() => setActiveTab("teachers")}
          >
            Teachers
          </button>
          <button
            className={`nav-btn ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            Absence Report
          </button>
        </div>

        {/* Management Tab */}
        {activeTab === "management" && (
          <div className="admin-section">
            <h2>Management</h2>
            {/* Programs Navigation */}
            <div className="programs-nav">
              <h3>Programs</h3>
              <div className="program-buttons">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    className={`program-btn ${selectedProgram === program.name ? "active" : ""}`}
                    onClick={() => {
                      setSelectedProgram(program.name);
                      setSelectedDepartment(null);
                    }}
                  >
                    {program.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Departments Navigation */}
            {selectedProgram && (
              <div className="departments-nav">
                <h3>Departments - {selectedProgram}</h3>
                <div className="department-buttons">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      className={`dept-btn ${selectedDepartment?.id === dept.id ? "active" : ""}`}
                      onClick={() => setSelectedDepartment(dept)}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Classes Navigation (if applicable) */}
            {selectedDepartment && classes.length > 0 && (
              <div className="classes-nav">
                <h3>Classes - {selectedDepartment.name}</h3>
                <div className="class-buttons">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.id}
                      className="class-btn"
                      onClick={() => router.push(`/class/${classItem.id}`)}
                    >
                      {classItem.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Class Details Tabs moved to new page */}
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === "teachers" && (
          <div className="admin-section">
            <h2>Teachers</h2>

            {/* Search Teachers */}
            <div className="search-section" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teachers by name, email, or department..."
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

            {/* Teacher List */}
            <div className="data-list">
              <div className="list-header">
                <div>Teacher Name</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Department</div>
              </div>
              {teachers
                .filter((teacher) => {
                  const search = teacherSearch.toLowerCase();
                  const dept = departments.find(
                    (d) => d.id === teacher.departmentId,
                  );
                  return (
                    teacher.name.toLowerCase().includes(search) ||
                    teacher.email.toLowerCase().includes(search) ||
                    dept?.name.toLowerCase().includes(search)
                  );
                })
                .map((teacher) => (
                  <div key={teacher.id} className="list-item">
                    <div>{teacher.name}</div>
                    <div>{teacher.email}</div>
                    <div>{teacher.phone}</div>
                    <div>
                      {departments.find((d) => d.id === teacher.departmentId)
                        ?.name || "Unknown"}
                    </div>
                  </div>
                ))}
            </div>

            {/* Add New Teacher - At the bottom */}
            <div className="form-section" style={{ marginTop: "30px" }}>
              <h3>Add New Teacher</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Teacher Name</label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter teacher name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={newTeacher.phone}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={newTeacher.departmentId}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        departmentId: e.target.value,
                      })
                    }
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} - {dept.program}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={addTeacher} className="add-btn">
                Add Teacher
              </button>
            </div>

            {/* Remove Teacher Section */}
            <div className="form-section" style={{ marginTop: "30px" }}>
              <h3>Remove Teacher</h3>
              <div className="form-group">
                <label>Teacher Name to Remove</label>
                <input
                  type="text"
                  value={selectedTeacherToRemove}
                  onChange={(e) => setSelectedTeacherToRemove(e.target.value)}
                  placeholder="Enter teacher name to remove"
                />
                {/* Matching teachers list */}
                {selectedTeacherToRemove.trim() && (
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
                          .includes(selectedTeacherToRemove.toLowerCase()),
                      )
                      .map((teacher) => (
                        <div
                          key={teacher.id}
                          onClick={() =>
                            setSelectedTeacherToRemove(teacher.name)
                          }
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            backgroundColor:
                              selectedTeacherToRemove.toLowerCase() ===
                              teacher.name.toLowerCase()
                                ? "#e3f2fd"
                                : "#fff",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#f5f5f5")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor =
                              selectedTeacherToRemove.toLowerCase() ===
                              teacher.name.toLowerCase()
                                ? "#e3f2fd"
                                : "#fff")
                          }
                        >
                          {teacher.name} ({teacher.email})
                        </div>
                      ))}
                    {teachers.filter((teacher) =>
                      teacher.name
                        .toLowerCase()
                        .includes(selectedTeacherToRemove.toLowerCase()),
                    ).length === 0 && (
                      <div style={{ padding: "10px", color: "#999" }}>
                        No teachers found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const teacherToDelete = teachers.find(
                    (t) =>
                      t.name.toLowerCase() ===
                      selectedTeacherToRemove.toLowerCase(),
                  );
                  if (teacherToDelete) {
                    deleteTeacher(teacherToDelete.id);
                    setSelectedTeacherToRemove("");
                  } else if (selectedTeacherToRemove.trim()) {
                    alert("Teacher not found");
                  }
                }}
                className="delete-btn"
                disabled={!selectedTeacherToRemove.trim()}
              >
                Remove Teacher
              </button>
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="admin-section">
            <h2>Absence Report</h2>
            <button onClick={printReport} className="export-btn">
              Print Report
            </button>

            <div className="report-container">
              {Object.entries(report).map(([deptName, absences]) => (
                <div key={deptName} className="report-section">
                  <div className="report-department-title">{deptName}</div>
                  <div className="report-class">
                    <div className="report-class-title">
                      Total Students:{" "}
                      {getStudentsByDepartment(
                        departments.find((d) => d.name === deptName)?.id,
                      )?.length || 0}
                      , Absent: {absences.length}
                    </div>
                    {absences.length > 0 ? (
                      absences.map((student, idx) => (
                        <div key={idx} className="report-student">
                          {student.rollNo} - {student.name} ({student.reason})
                        </div>
                      ))
                    ) : (
                      <div
                        className="report-student"
                        style={{ color: "#27ae60" }}
                      >
                        No absences
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

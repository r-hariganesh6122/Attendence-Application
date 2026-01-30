import { useState } from "react";
import {
  mockData,
  getStudentsByDepartment,
  getDepartmentById,
  getTeacherById,
} from "../../lib/mockData";
import "../attendance.css";

const ClassManagement = ({ department, className, onBack }) => {
  const [activeTab, setActiveTab] = useState("students");

  // Get students for this department
  const students = getStudentsByDepartment(department.id);

  // Get teachers for this department
  const teachers = mockData.teachers.filter((teacher) =>
    mockData.teacherDepartmentAssignments.some(
      (assignment) =>
        assignment.teacherId === teacher.id &&
        assignment.departmentId === department.id,
    ),
  );

  return (
    <div className="class-management">
      <div
        className="management-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3>
          {department.name} {className ? `- Class ${className}` : ""} Management
        </h3>
        <button
          onClick={onBack}
          className="back-btn"
          style={{ padding: "5px 10px", cursor: "pointer" }}
        >
          Back
        </button>
      </div>

      <div className="admin-nav">
        <button
          className={`nav-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Student Details
        </button>
        <button
          className={`nav-btn ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Teachers Assigned
        </button>
      </div>

      {activeTab === "students" && (
        <div className="data-list">
          <div className="list-header">
            <div>Roll No</div>
            <div>Name</div>
          </div>
          {students.length > 0 ? (
            students.map((student) => (
              <div key={student.id} className="list-item">
                <div>{student.rollNo}</div>
                <div>{student.name}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: "10px" }}>No students found</div>
          )}
        </div>
      )}

      {activeTab === "teachers" && (
        <div className="data-list">
          <div className="list-header">
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
          </div>
          {teachers.length > 0 ? (
            teachers.map((teacher) => (
              <div key={teacher.id} className="list-item">
                <div>{teacher.name}</div>
                <div>{teacher.email}</div>
                <div>{teacher.phone}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: "10px" }}>No teachers assigned</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("management");
  const [managementView, setManagementView] = useState("selection");
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState("BE");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [programs, setPrograms] = useState(mockData.programs);
  const [departments, setDepartments] = useState(mockData.departments);
  const [teachers, setTeachers] = useState(mockData.teachers);
  const [assignments, setAssignments] = useState(
    mockData.teacherDepartmentAssignments,
  );

  // Form states for adding new items
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: departments[0]?.id || "",
  });

  // Search state for teachers
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherToRemove, setSelectedTeacherToRemove] = useState("");

  // Teacher Management
  const addTeacher = () => {
    if (
      newTeacher.name &&
      newTeacher.email &&
      newTeacher.phone &&
      newTeacher.departmentId
    ) {
      const teacher = {
        id: `teach-${Date.now()}`,
        ...newTeacher,
      };
      setTeachers([...teachers, teacher]);
      setNewTeacher({
        name: "",
        email: "",
        phone: "",
        departmentId: departments[0]?.id || "",
      });
    }
  };

  const deleteTeacher = (teacherId) => {
    setTeachers(teachers.filter((t) => t.id !== teacherId));
    // Also remove from assignments
    setAssignments(assignments.filter((a) => a.teacherId !== teacherId));
  };

  const getTeacherClasses = (teacherId) => {
    return assignments
      .filter((a) => a.teacherId === teacherId)
      .map((a) => {
        const dept = departments.find((d) => d.id === a.departmentId);
        return dept?.name || "Unknown";
      });
  };

  // Generate Attendance Report
  const generateReport = () => {
    const report = {};

    // Group by department
    departments.forEach((dept) => {
      const students = getStudentsByDepartment(dept.id);
      if (students.length > 0) {
        // Simulate some absences
        const absences = students
          .filter((_, idx) => idx % 3 === 0)
          .map((s) => ({
            name: s.name,
            rollNo: s.rollNo,
            reason: "Medical leave",
          }));
        report[dept.name] = absences;
      }
    });

    return report;
  };

  // Print Absence Report
  const printReport = () => {
    const report = generateReport();
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

    Object.entries(report).forEach(([deptName, absences]) => {
      printContent += `<div class="department-header">${deptName}</div>`;

      if (absences.length > 0) {
        printContent += `
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Reason for Absence</th>
              </tr>
            </thead>
            <tbody>
        `;

        absences.forEach((student) => {
          printContent += `
            <tr>
              <td>${student.rollNo}</td>
              <td>${student.name}</td>
              <td>${student.reason}</td>
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
            {managementView === "selection" ? (
              <>
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
                      {departments
                        .filter((d) => d.program === selectedProgram)
                        .map((dept) => (
                          <button
                            key={dept.id}
                            className={`dept-btn ${selectedDepartment?.id === dept.id ? "active" : ""}`}
                            onClick={() => {
                              setSelectedDepartment(dept);
                              // If department has no classes, go directly to class management
                              if (dept.classes.length === 0) {
                                setManagementView("class-details");
                                setSelectedClass(null);
                              }
                            }}
                          >
                            {dept.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Classes Navigation (if applicable) */}
                {selectedDepartment &&
                  selectedDepartment.classes.length > 0 && (
                    <div className="classes-nav">
                      <h3>Classes - {selectedDepartment.name}</h3>
                      <div className="class-buttons">
                        {selectedDepartment.classes.map((classItem) => (
                          <button
                            key={classItem}
                            className="class-btn"
                            onClick={() => {
                              setSelectedClass(classItem);
                              setManagementView("class-details");
                            }}
                          >
                            Class {classItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <ClassManagement
                department={selectedDepartment}
                className={selectedClass}
                onBack={() => {
                  setManagementView("selection");
                  setSelectedClass(null);
                  // Keep selected department selected so user doesn't lose context
                }}
              />
            )}
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

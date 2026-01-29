"use client";

import { useState } from "react";
import {
  mockData,
  getClassesByDepartment,
  getStudentsByClass,
  getDepartmentById,
  getCollegeById,
  getTeacherById,
} from "../../lib/mockData";
import "../attendance.css";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("colleges");
  const [colleges, setColleges] = useState(mockData.colleges);
  const [departments, setDepartments] = useState(mockData.departments);
  const [classes, setClasses] = useState(mockData.classes);
  const [teachers, setTeachers] = useState(mockData.teachers);
  const [assignments, setAssignments] = useState(
    mockData.teacherClassAssignments,
  );

  // Form states for adding new items
  const [newCollege, setNewCollege] = useState({ name: "", location: "" });
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    collegeId: colleges[0]?.id || "",
  });
  const [newClass, setNewClass] = useState({
    name: "",
    departmentId: departments[0]?.id || "",
    semester: "1",
    strength: "",
  });
  const [newAssignment, setNewAssignment] = useState({
    teacherId: teachers[0]?.id || "",
    classId: classes[0]?.id || "",
  });

  // College Management
  const addCollege = () => {
    if (newCollege.name && newCollege.location) {
      const college = {
        id: `col-${Date.now()}`,
        ...newCollege,
      };
      setColleges([...colleges, college]);
      setNewCollege({ name: "", location: "" });
    }
  };

  const deleteCollege = (collegeId) => {
    setColleges(colleges.filter((c) => c.id !== collegeId));
  };

  // Department Management
  const addDepartment = () => {
    if (newDepartment.name && newDepartment.collegeId) {
      const dept = {
        id: `dept-${Date.now()}`,
        ...newDepartment,
      };
      setDepartments([...departments, dept]);
      setNewDepartment({ name: "", collegeId: colleges[0]?.id || "" });
    }
  };

  const deleteDepartment = (deptId) => {
    setDepartments(departments.filter((d) => d.id !== deptId));
  };

  // Class Management
  const addClass = () => {
    if (newClass.name && newClass.departmentId && newClass.strength) {
      const cls = {
        id: `class-${Date.now()}`,
        ...newClass,
        strength: parseInt(newClass.strength),
      };
      setClasses([...classes, cls]);
      setNewClass({
        name: "",
        departmentId: departments[0]?.id || "",
        semester: "1",
        strength: "",
      });
    }
  };

  const deleteClass = (classId) => {
    setClasses(classes.filter((c) => c.id !== classId));
  };

  // Teacher Assignment
  const addAssignment = () => {
    if (newAssignment.teacherId && newAssignment.classId) {
      const assignment = {
        id: `assign-${Date.now()}`,
        ...newAssignment,
      };
      setAssignments([...assignments, assignment]);
      setNewAssignment({
        teacherId: teachers[0]?.id || "",
        classId: classes[0]?.id || "",
      });
    }
  };

  const deleteAssignment = (assignmentId) => {
    setAssignments(assignments.filter((a) => a.id !== assignmentId));
  };

  // Generate Attendance Report
  const generateReport = () => {
    const report = {};

    // Group by department
    departments.forEach((dept) => {
      const deptClasses = classes.filter((c) => c.departmentId === dept.id);
      if (deptClasses.length > 0) {
        report[dept.name] = {};

        // Group by class within department
        deptClasses.forEach((cls) => {
          const students = mockData.students.filter(
            (s) => s.classId === cls.id,
          );
          // Simulate some absences
          const absences = students
            .filter((_, idx) => idx % 3 === 0)
            .map((s) => ({
              name: s.name,
              rollNo: s.rollNo,
              reason: "Medical leave",
            }));
          report[dept.name][cls.name] = absences;
        });
      }
    });

    return report;
  };

  // Export to CSV
  const exportToCSV = () => {
    const report = generateReport();
    let csv = "Department,Class,Roll No,Student Name,Reason\n";

    Object.entries(report).forEach(([deptName, deptClasses]) => {
      Object.entries(deptClasses).forEach(([className, absences]) => {
        absences.forEach((student) => {
          csv += `${deptName},${className},${student.rollNo},${student.name},${student.reason}\n`;
        });
      });
    });

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absence_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const report = generateReport();
  const getCollegeName = (collegeId) =>
    colleges.find((c) => c.id === collegeId)?.name || "Unknown";
  const getDeptName = (deptId) =>
    departments.find((d) => d.id === deptId)?.name || "Unknown";
  const getClassName = (classId) =>
    classes.find((c) => c.id === classId)?.name || "Unknown";
  const getTeacherName = (teacherId) =>
    teachers.find((t) => t.id === teacherId)?.name || "Unknown";

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
            className={`nav-btn ${activeTab === "colleges" ? "active" : ""}`}
            onClick={() => setActiveTab("colleges")}
          >
            Colleges
          </button>
          <button
            className={`nav-btn ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            Departments
          </button>
          <button
            className={`nav-btn ${activeTab === "classes" ? "active" : ""}`}
            onClick={() => setActiveTab("classes")}
          >
            Classes
          </button>
          <button
            className={`nav-btn ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => setActiveTab("assignments")}
          >
            Teacher Assignments
          </button>
          <button
            className={`nav-btn ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            Absence Report
          </button>
        </div>

        {/* Colleges Tab */}
        {activeTab === "colleges" && (
          <div className="admin-section">
            <h2>Manage Colleges</h2>
            <div className="form-section">
              <h3>Add New College</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>College Name</label>
                  <input
                    type="text"
                    value={newCollege.name}
                    onChange={(e) =>
                      setNewCollege({ ...newCollege, name: e.target.value })
                    }
                    placeholder="Enter college name"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newCollege.location}
                    onChange={(e) =>
                      setNewCollege({ ...newCollege, location: e.target.value })
                    }
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <button onClick={addCollege} className="add-btn">
                Add College
              </button>
            </div>

            <div className="data-list">
              <div className="list-header">
                <div>College Name</div>
                <div>Location</div>
                <div>Action</div>
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="list-item">
                  <div>{college.name}</div>
                  <div>{college.location}</div>
                  <button
                    onClick={() => deleteCollege(college.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div className="admin-section">
            <h2>Manage Departments</h2>
            <div className="form-section">
              <h3>Add New Department</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter department name"
                  />
                </div>
                <div className="form-group">
                  <label>College</label>
                  <select
                    value={newDepartment.collegeId}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        collegeId: e.target.value,
                      })
                    }
                  >
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={addDepartment} className="add-btn">
                Add Department
              </button>
            </div>

            <div className="data-list">
              <div className="list-header">
                <div>Department Name</div>
                <div>College</div>
                <div>Action</div>
              </div>
              {departments.map((dept) => (
                <div key={dept.id} className="list-item">
                  <div>{dept.name}</div>
                  <div>{getCollegeName(dept.collegeId)}</div>
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <div className="admin-section">
            <h2>Manage Classes</h2>
            <div className="form-section">
              <h3>Add New Class</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Class Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) =>
                      setNewClass({ ...newClass, name: e.target.value })
                    }
                    placeholder="e.g., CSE-A"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={newClass.departmentId}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        departmentId: e.target.value,
                      })
                    }
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select
                    value={newClass.semester}
                    onChange={(e) =>
                      setNewClass({ ...newClass, semester: e.target.value })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Strength</label>
                  <input
                    type="number"
                    value={newClass.strength}
                    onChange={(e) =>
                      setNewClass({ ...newClass, strength: e.target.value })
                    }
                    placeholder="Number of students"
                  />
                </div>
              </div>
              <button onClick={addClass} className="add-btn">
                Add Class
              </button>
            </div>

            <div className="data-list">
              <div className="list-header">
                <div>Class Name</div>
                <div>Department</div>
                <div>Semester</div>
                <div>Strength</div>
                <div>Action</div>
              </div>
              {classes.map((cls) => (
                <div key={cls.id} className="list-item">
                  <div>{cls.name}</div>
                  <div>{getDeptName(cls.departmentId)}</div>
                  <div>{cls.semester}</div>
                  <div>{cls.strength}</div>
                  <button
                    onClick={() => deleteClass(cls.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teacher Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="admin-section">
            <h2>Assign Teachers to Classes</h2>
            <div className="form-section">
              <h3>Add Teacher Assignment</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Teacher</label>
                  <select
                    value={newAssignment.teacherId}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        teacherId: e.target.value,
                      })
                    }
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select
                    value={newAssignment.classId}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        classId: e.target.value,
                      })
                    }
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {getDeptName(cls.departmentId)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={addAssignment} className="add-btn">
                Assign Teacher
              </button>
            </div>

            <div className="data-list">
              <div className="list-header">
                <div>Teacher Name</div>
                <div>Class</div>
                <div>Department</div>
                <div>Action</div>
              </div>
              {assignments.map((assignment) => (
                <div key={assignment.id} className="list-item">
                  <div>{getTeacherName(assignment.teacherId)}</div>
                  <div>{getClassName(assignment.classId)}</div>
                  <div>
                    {getDeptName(
                      classes.find((c) => c.id === assignment.classId)
                        ?.departmentId,
                    )}
                  </div>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="admin-section">
            <h2>Absence Report</h2>
            <button onClick={exportToCSV} className="export-btn">
              Export to CSV
            </button>

            <div className="report-container">
              {Object.entries(report).map(([deptName, deptClasses]) => (
                <div key={deptName} className="report-section">
                  <div className="report-department-title">{deptName}</div>
                  {Object.entries(deptClasses).map(([className, absences]) => (
                    <div key={className} className="report-class">
                      <div className="report-class-title">
                        {className} ({absences.length} absent)
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
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

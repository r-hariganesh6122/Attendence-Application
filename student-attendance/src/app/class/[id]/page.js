"use client";

import { useEffect, useState, use } from "react";

export default function ClassDetailsPage({ params }) {
  const { id } = use(params);
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [tab, setTab] = useState("students");

  useEffect(() => {
    async function fetchClassData() {
      // Fetch class info (optional, if you want to show class name, etc.)
      // const resClass = await fetch(`/api/classes/${id}`);
      // const dataClass = await resClass.json();
      // setClassInfo(dataClass.class);

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
          <button onClick={() => window.history.back()} className="back-btn">
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
          </div>
          {tab === "students" && (
            <div className="data-list">
              <div className="list-header">
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
                students.map((student) => (
                  <div key={student.id} className="list-item">
                    <div>{student.rollNo || "-"}</div>
                    <div>{student.regNo || "-"}</div>
                    <div>{student.name}</div>
                    <div>{student.residence || "-"}</div>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "teachers" && (
            <div className="data-list">
              <div className="list-header">
                <div>Name</div>
                <div>Subject</div>
              </div>
              {teachers.length === 0 ? (
                <div className="list-item">
                  No teachers assigned to this class.
                </div>
              ) : (
                teachers.map((teacher) => (
                  <div key={teacher.id} className="list-item">
                    <div>{teacher.name}</div>
                    <div>{teacher.subject || "-"}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

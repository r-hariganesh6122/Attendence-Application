import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/apiUtils";
import "../attendance.css";

export default function AdminDashboard({ user, onLogout }) {
  // State for change password form
  const [changePasswordMobile, setChangePasswordMobile] = useState("");
  const [changePasswordOld, setChangePasswordOld] = useState("");
  const [changePasswordNew, setChangePasswordNew] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handler for change password
  const handleChangePassword = async () => {
    if (
      !changePasswordMobile.trim() ||
      !changePasswordOld.trim() ||
      !changePasswordNew.trim() ||
      !changePasswordConfirm.trim()
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (changePasswordNew !== changePasswordConfirm) {
      alert("New password and confirmation password do not match");
      return;
    }

    if (changePasswordNew.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    try {
      const res = await apiCall("/api/teachers", {
        method: "PUT",
        body: JSON.stringify({
          teacherId: parseInt(changePasswordMobile),
          oldPassword: changePasswordOld,
          password: changePasswordNew,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Password changed successfully!");
        setChangePasswordMobile("");
        setChangePasswordOld("");
        setChangePasswordNew("");
        setChangePasswordConfirm("");
        fetchTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to change password: " + error.message);
    }
  };
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

  // State for teacher subtabs
  const [teacherTab, setTeacherTab] = useState("list");
  const [programs] = useState([
    { id: 1, name: "BE" },
    { id: 2, name: "BTech" },
  ]);

  // Form states for adding new items
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  // Search state for teachers
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherToRemove, setSelectedTeacherToRemove] = useState("");

  // Report state
  const [reportProgram, setReportProgram] = useState("BE");
  const [reportDepartments, setReportDepartments] = useState([]);
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportType, setReportType] = useState("whole"); // 'whole', 'department', 'class'
  const [reportDepartment, setReportDepartment] = useState(null);
  const [reportClass, setReportClass] = useState(null);
  const [reportClasses, setReportClasses] = useState([]);
  const [report, setReport] = useState({});
  const [reportTotalStudents, setReportTotalStudents] = useState({}); // Map of deptId to student count
  const [expandedTeacherId, setExpandedTeacherId] = useState(null); // Track which teacher's courses are expanded
  const [teacherCourses, setTeacherCourses] = useState({}); // Cache of teacher courses

  // Attendance Lock Management States
  const [lockManagementTab, setLockManagementTab] = useState("list");
  const [lockProgram, setLockProgram] = useState(null);
  const [lockDepartment, setLockDepartment] = useState(null);
  const [lockClass, setLockClass] = useState(null);
  const [lockDate, setLockDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lockReason, setLockReason] = useState("");
  const [lockedDates, setLockedDates] = useState([]); // List of locked dates for viewing
  const [lockDepartments, setLockDepartments] = useState([]);
  const [lockClasses, setLockClasses] = useState([]);
  const [isCurrentDateLocked, setIsCurrentDateLocked] = useState(false);

  // Fetch teacher courses when expanding a teacher
  const fetchTeacherCourses = async (teacherId) => {
    if (teacherCourses[teacherId]) {
      // Already cached, just toggle
      setExpandedTeacherId(expandedTeacherId === teacherId ? null : teacherId);
      return;
    }

    try {
      const res = await apiCall(`/api/class-teachers?teacherId=${teacherId}`);
      const data = await res.json();
      if (data.success) {
        setTeacherCourses((prev) => ({
          ...prev,
          [teacherId]: data.assignments,
        }));
        setExpandedTeacherId(
          expandedTeacherId === teacherId ? null : teacherId,
        );
      }
    } catch (error) {
      console.error("Failed to fetch teacher courses:", error);
    }
  };

  // Teacher Management
  const fetchTeachers = async () => {
    try {
      const res = await apiCall("/api/teachers");
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);

        // Pre-fetch courses for all teachers in parallel
        const coursePromises = data.teachers.map((teacher) =>
          apiCall(`/api/class-teachers?teacherId=${teacher.id}`)
            .then((res) => res.json())
            .then((courseData) => {
              if (courseData.success) {
                setTeacherCourses((prev) => ({
                  ...prev,
                  [teacher.id]: courseData.assignments,
                }));
              }
            })
            .catch((error) =>
              console.error(
                `Failed to fetch courses for teacher ${teacher.id}:`,
                error,
              ),
            ),
        );

        // Wait for all course fetches to complete
        await Promise.all(coursePromises);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const addTeacher = async () => {
    if (
      !newTeacher.name.trim() ||
      !newTeacher.mobile.trim() ||
      !newTeacher.password.trim()
    ) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await apiCall("/api/teachers", {
        method: "POST",
        body: JSON.stringify(newTeacher),
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher added successfully!");
        setNewTeacher({
          name: "",
          mobile: "",
          password: "",
        });
        fetchTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to add teacher: " + error.message);
    }
  };

  const deleteTeacher = async (teacherId) => {
    if (!confirm("Are you sure you want to delete this teacher?")) {
      return;
    }

    try {
      const res = await apiCall(`/api/teachers?teacherId=${teacherId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher deleted successfully!");
        setSelectedTeacherToRemove("");
        fetchTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to delete teacher: " + error.message);
    }
  };

  // Fetch teachers on component mount
  useEffect(() => {
    if (activeTab === "teachers") {
      fetchTeachers();
    }
  }, [activeTab]);

  // Fetch departments for selected program
  useEffect(() => {
    async function fetchDepartments() {
      const res = await apiCall(`/api/departments?program=${selectedProgram}`);
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
      const res = await apiCall(
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
      const resStudents = await apiCall(
        `/api/students?classId=${selectedClass.id}`,
      );
      const dataStudents = await resStudents.json();
      setClassStudents(dataStudents.success ? dataStudents.students : []);
      // Fetch teachers
      const resTeachers = await apiCall(
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
      const res = await apiCall("/api/teachers");
      const data = await res.json();
      if (data.success) setTeachers(data.teachers);
    }
    fetchTeachers();
  }, []);

  // Fetch departments for report based on selected program
  useEffect(() => {
    async function fetchReportDepartments() {
      const res = await apiCall(`/api/departments?program=${reportProgram}`);
      const data = await res.json();
      if (data.success) {
        setReportDepartments(data.departments);
        setReportDepartment(null);
        setReportClass(null);
      } else {
        setReportDepartments([]);
        setReportDepartment(null);
        setReportClass(null);
      }
    }
    fetchReportDepartments();
  }, [reportProgram]);

  // Fetch classes for report filter based on selected department
  useEffect(() => {
    async function fetchClassesForReport() {
      let allClasses = [];
      if (reportDepartment) {
        // If a specific department is selected, fetch only its classes
        const res = await apiCall(
          `/api/classes?departmentId=${reportDepartment.id}`,
        );
        const data = await res.json();
        if (data.success) {
          allClasses = data.classes.map((c) => ({
            ...c,
            departmentId: reportDepartment.id,
          }));
        }
      } else {
        // If no specific department, fetch all classes for all report departments
        for (const dept of reportDepartments) {
          const res = await apiCall(`/api/classes?departmentId=${dept.id}`);
          const data = await res.json();
          if (data.success) {
            allClasses = [
              ...allClasses,
              ...data.classes.map((c) => ({ ...c, departmentId: dept.id })),
            ];
          }
        }
      }
      setReportClasses(allClasses);
      if (reportDepartment && allClasses.length === 0) {
        setReportClass(null);
      }
    }
    if (reportDepartments.length > 0 || reportDepartment) {
      fetchClassesForReport();
    }
  }, [reportDepartments, reportDepartment]);

  // Update report preview when filters change
  useEffect(() => {
    async function updateReportPreview() {
      if (activeTab === "report") {
        const newReport = await generateReport(
          reportDate,
          reportType,
          reportDepartment,
          reportClass,
        );
        setReport(newReport);
      }
    }
    updateReportPreview();
  }, [
    activeTab,
    reportDate,
    reportType,
    reportDepartment,
    reportClass,
    reportDepartments,
  ]);

  // Fetch locked dates when lock tab or class changes
  useEffect(() => {
    if (activeTab === "attendance-lock" && lockClass) {
      fetchLockedDates();
    }
  }, [activeTab, lockClass]);

  // Fetch lock departments based on selected lock program
  useEffect(() => {
    async function fetchLockDeptList() {
      if (!lockProgram) {
        setLockDepartments([]);
        setLockDepartment(null);
        setLockClass(null);
        return;
      }
      try {
        const res = await apiCall(`/api/departments?program=${lockProgram}`);
        const data = await res.json();
        if (data.success) {
          setLockDepartments(data.departments);
          setLockDepartment(null);
          setLockClass(null);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setLockDepartments([]);
      }
    }
    fetchLockDeptList();
  }, [lockProgram]);

  // Fetch lock classes based on selected lock department
  useEffect(() => {
    async function fetchLockClassList() {
      if (!lockDepartment) {
        setLockClasses([]);
        setLockClass(null);
        return;
      }
      try {
        const res = await apiCall(
          `/api/classes?departmentId=${lockDepartment.id}`,
        );
        const data = await res.json();
        if (data.success) {
          setLockClasses(data.classes);
          setLockClass(null);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        setLockClasses([]);
      }
    }
    fetchLockClassList();
  }, [lockDepartment]);

  // Check if current lock date is locked
  useEffect(() => {
    async function checkCurrentDateLock() {
      if (!lockClass || !lockDate) {
        setIsCurrentDateLocked(false);
        return;
      }
      try {
        const res = await apiCall(
          `/api/attendance-lock?classId=${lockClass.id}&date=${lockDate}`,
        );
        const data = await res.json();
        setIsCurrentDateLocked(data.isLocked || false);
      } catch (error) {
        console.error("Failed to check lock status:", error);
        setIsCurrentDateLocked(false);
      }
    }
    checkCurrentDateLock();
  }, [lockClass, lockDate]);

  // Auto-lock past dates when class is selected
  useEffect(() => {
    if (lockClass) {
      ensurePastDatesLocked(lockClass.id);
      fetchLockedDates();
    }
  }, [lockClass]);

  // Get all students by department
  const getStudentsByDepartment = (departmentId) => {
    if (!departmentId) return [];

    // Return an array-like object with length property
    // The length represents the total count of students in the department
    const count = reportTotalStudents[departmentId] || 0;
    return new Array(count).fill({});
  };

  // Generate Attendance Report (async)
  const generateReport = async (
    selectedDate = reportDate,
    type = reportType,
    dept = reportDepartment,
    cls = reportClass,
  ) => {
    const report = {};
    const totalStudentsMap = {};
    const dateStr = new Date(selectedDate).toISOString().split("T")[0];

    let deptsToProcess = [];
    if (type === "whole") {
      deptsToProcess = reportDepartments;
    } else if (type === "department" && dept) {
      deptsToProcess = reportDepartments.filter((d) => d.id === dept.id);
    } else if (type === "class" && cls) {
      const dept = reportDepartments.find((d) => d.id === cls.departmentId);
      if (dept) deptsToProcess = [dept];
    }

    for (const dept of deptsToProcess) {
      // Initialize total students for this department
      if (!totalStudentsMap[dept.id]) {
        totalStudentsMap[dept.id] = new Set();
      }

      // Fetch all classes in this department
      const resClasses = await apiCall(`/api/classes?departmentId=${dept.id}`);
      const dataClasses = await resClasses.json();
      let classes = dataClasses.success ? dataClasses.classes : [];

      // Filter by class if report type is 'class'
      if (type === "class" && cls) {
        classes = classes.filter((c) => c.id === cls.id);
      }

      report[dept.name] = {};
      for (const classItem of classes) {
        // Fetch attendance for this class for selected date
        const resAttendance = await apiCall(
          `/api/attendance?classId=${classItem.id}&from=${dateStr}&to=${dateStr}`,
        );
        // Fetch ALL attendance for this class to calculate total leaves
        const resAllAttendance = await apiCall(
          `/api/attendance?classId=${classItem.id}`,
        );
        let dataAttendance = {};
        let dataAllAttendance = {};
        try {
          dataAttendance = await resAttendance.json();
          dataAllAttendance = await resAllAttendance.json();
        } catch {
          dataAttendance = { success: false, error: "Invalid JSON response" };
          dataAllAttendance = {
            success: false,
            error: "Invalid JSON response",
          };
        }
        let absences = [];
        if (dataAttendance.success) {
          const { students, attendanceRecords } = dataAttendance;
          // Get all attendance records for total leaves calculation
          const allAttendanceRecords = dataAllAttendance.success
            ? dataAllAttendance.attendanceRecords || []
            : [];

          // Add all students from this class to the total count
          students.forEach((s) => {
            totalStudentsMap[dept.id].add(s.id);
          });
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
                leavesTaken: allAttendanceRecords.filter(
                  (r2) =>
                    r2.studentId === rec.studentId && r2.status === "absent",
                ).length,
              });
            });
        }
        report[dept.name][classItem.name] = absences;
      }
    }

    // Convert Sets to counts
    const totalStudentsCount = {};
    Object.entries(totalStudentsMap).forEach(([deptId, studentSet]) => {
      totalStudentsCount[deptId] = studentSet.size;
    });
    setReportTotalStudents(totalStudentsCount);

    return report;
  };

  // Print Absence Report
  const printReport = async () => {
    try {
      const report = await generateReport();
      const dateStr = new Date(reportDate).toLocaleDateString();
      const reportTypeLabel =
        reportType === "whole"
          ? "All Departments"
          : reportType === "department"
            ? reportDepartment?.name || "Department"
            : reportClass?.name || "Class";

      let printContent = `
        <html>
          <head>
            <title>Absence Report - ${dateStr}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 30px 15px;
                line-height: 1.4;
              }
              h1 {
                text-align: center;
                color: #333;
                margin: 0 0 3px 0;
                font-size: 24px;
              }
              .report-info {
                text-align: center;
                color: #666;
                margin: 0 0 2px 0;
                font-size: 13px;
              }
              .date {
                text-align: center;
                color: #999;
                margin-bottom: 15px;
                font-size: 11px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0 8px 0;
                font-size: 13px;
              }
              th {
                background-color: #34495e;
                color: #000;
                padding: 8px 10px;
                text-align: left;
                border: 1px solid #333;
                font-weight: bold;
              }
              td {
                padding: 7px 10px;
                border: 1px solid #bbb;
                text-align: left;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .department-wrapper {
                page-break-after: always;
                margin-bottom: 0;
                padding-bottom: 20px;
              }
              .department-header {
                background-color: #f0f0f0;
                color: #000;
                font-size: 20px;
                font-weight: bold;
                padding: 12px 12px;
                margin: 0 0 8px 0;
                border-bottom: 2px solid #667eea;
              }
              .class-header {
                background-color: #f9f9f9;
                color: #333;
                font-size: 16px;
                font-weight: bold;
                padding: 10px 10px;
                margin: 8px 0 1px 0;
                border-left: 3px solid #764ba2;
              }
              .no-absences {
                color: #27ae60;
                padding: 8px 10px;
                font-style: italic;
                font-size: 13px;
                margin: 8px 0 0 0;
              }
              @media print {
                body { margin: 30px 15px; }
                table { page-break-inside: auto; margin: 12px 0 8px 0; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                .department-wrapper { page-break-after: always; margin-bottom: 0; padding-bottom: 20px; }
              }
            </style>
          </head>
          <body>
            <h1>Absence Report</h1>
            <div class="report-info">Report Type: ${reportTypeLabel}</div>
            <div class="date">Date: ${dateStr} | Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      `;

      Object.entries(report).forEach(([deptName, absencesByClass]) => {
        printContent += `<div class="department-wrapper">`;
        printContent += `<div class="department-header">${deptName}</div>`;
        Object.entries(absencesByClass).forEach(([className, absences]) => {
          printContent += `<div class="class-header">Class: ${className}</div>`;
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
            printContent += `<div class="no-absences">No absences</div>`;
          }
        });
        printContent += `</div>`;
      });

      printContent += `
          </body>
        </html>
      `;

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
  };

  // Attendance Lock Management Functions
  const toggleAttendanceLock = async () => {
    if (!lockClass || !lockDate) {
      alert("Please select both class and date");
      return;
    }

    try {
      const res = await apiCall("/api/attendance-lock", {
        method: "POST",
        body: JSON.stringify({
          classId: lockClass.id,
          date: lockDate,
          isLocked: true,
          reason: lockReason || "Locked by admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Attendance locked successfully!");
        setLockDate(new Date().toISOString().split("T")[0]);
        setLockReason("");
        fetchLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to lock attendance: " + error.message);
    }
  };

  const unlockAttendance = async (classId, date) => {
    if (!confirm("Are you sure you want to unlock attendance for this date?")) {
      return;
    }

    try {
      const res = await apiCall("/api/attendance-lock", {
        method: "POST",
        body: JSON.stringify({
          classId,
          date,
          isLocked: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Attendance unlocked successfully!");
        // Refresh locked dates list
        fetchLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to unlock attendance: " + error.message);
    }
  };

  const fetchLockedDates = async () => {
    if (!lockClass) {
      setLockedDates([]);
      return;
    }

    try {
      // Fetch all locked dates for the selected class
      const res = await apiCall(
        `/api/attendance-lock?classId=${lockClass.id}&listAll=true`,
      );
      const data = await res.json();
      if (data.success && data.locks) {
        setLockedDates(data.locks);
      } else {
        setLockedDates([]);
      }
    } catch (error) {
      console.error("Failed to fetch locked dates:", error);
      setLockedDates([]);
    }
  };

  const ensurePastDatesLocked = async (classId) => {
    try {
      const res = await apiCall("/api/attendance-lock/lock-past-dates", {
        method: "POST",
        body: JSON.stringify({
          classId: classId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`Auto-locked ${data.lockedCount} past dates`);
      }
    } catch (error) {
      console.error("Failed to auto-lock past dates:", error);
    }
  };

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
          <button
            className={`nav-btn ${activeTab === "attendance-lock" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance-lock")}
          >
            Attendance Lock
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

            {/* Teacher Sub-tabs Navigation */}
            <div className="admin-tabs">
              <button
                onClick={() => setTeacherTab("list")}
                className={`tab-btn ${teacherTab === "list" ? "active" : ""}`}
              >
                List
              </button>
              <button
                onClick={() => setTeacherTab("addTeacher")}
                className={`tab-btn ${teacherTab === "addTeacher" ? "active" : ""}`}
              >
                Add Teacher
              </button>
              <button
                onClick={() => setTeacherTab("removeTeacher")}
                className={`tab-btn ${teacherTab === "removeTeacher" ? "active" : ""}`}
              >
                Remove Teacher
              </button>
              <button
                onClick={() => setTeacherTab("changePassword")}
                className={`tab-btn ${teacherTab === "changePassword" ? "active" : ""}`}
              >
                Change Password
              </button>
            </div>

            {/* List Tab */}
            {teacherTab === "list" && (
              <div>
                {/* Search Teachers */}
                <div
                  className="search-section"
                  style={{ marginBottom: "20px" }}
                >
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search teachers by name or mobile..."
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
                    <div>S.No</div>
                    <div>Teacher Name</div>
                    <div>Mobile</div>
                    <div>Courses Taught</div>
                  </div>
                  {teachers
                    .filter((teacher) => {
                      const search = teacherSearch.toLowerCase();
                      return (
                        teacher.name.toLowerCase().includes(search) ||
                        teacher.mobile.toLowerCase().includes(search)
                      );
                    })
                    .map((teacher, idx) => (
                      <div key={teacher.id}>
                        <div className="list-item">
                          <div>{idx + 1}</div>
                          <div>{teacher.name}</div>
                          <div>{teacher.mobile}</div>
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {teacherCourses[teacher.id]?.length || 0} course
                              {(teacherCourses[teacher.id]?.length || 0) !== 1
                                ? "s"
                                : ""}
                            </span>
                            <button
                              onClick={() => fetchTeacherCourses(teacher.id)}
                              style={{
                                padding: "5px 10px",
                                backgroundColor: "#e0e0e0",
                                color: "#333",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                              }}
                            >
                              {expandedTeacherId === teacher.id ? "v" : "^"}
                            </button>
                          </div>
                        </div>
                        {/* Expanded courses list */}
                        {expandedTeacherId === teacher.id &&
                          teacherCourses[teacher.id] && (
                            <div
                              style={{
                                padding: "10px 20px",
                                backgroundColor: "#f5f5f5",
                                borderLeft: "4px solid #4CAF50",
                              }}
                            >
                              <strong>Courses Taught:</strong>
                              {teacherCourses[teacher.id].length === 0 ? (
                                <p style={{ marginTop: "5px", color: "#999" }}>
                                  No courses assigned
                                </p>
                              ) : (
                                <ul
                                  style={{
                                    marginTop: "8px",
                                    paddingLeft: "20px",
                                  }}
                                >
                                  {teacherCourses[teacher.id].map(
                                    (assignment) => (
                                      <li key={assignment.id}>
                                        <strong>
                                          {assignment.course.subject}
                                        </strong>{" "}
                                        ({assignment.course.courseCode}) -
                                        Class:{" "}
                                        <strong>{assignment.class.name}</strong>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {teacherTab === "changePassword" && (
              <div className="form-section">
                <h3>Change Password</h3>
                <div className="form-grid change-password-grid">
                  <div className="form-group">
                    <label>Teacher Mobile Number</label>
                    <input
                      type="tel"
                      value={changePasswordMobile || ""}
                      onChange={(e) => setChangePasswordMobile(e.target.value)}
                      placeholder="Enter teacher mobile number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Old Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={changePasswordOld || ""}
                        onChange={(e) => setChangePasswordOld(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="eye-icon-btn"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        title={
                          showOldPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showOldPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={changePasswordNew || ""}
                        onChange={(e) => setChangePasswordNew(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        className="eye-icon-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={changePasswordConfirm || ""}
                        onChange={(e) =>
                          setChangePasswordConfirm(e.target.value)
                        }
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        className="eye-icon-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        title={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={handleChangePassword} className="add-btn">
                  Change Password
                </button>
              </div>
            )}

            {/* Add Teacher Tab */}
            {teacherTab === "addTeacher" && (
              <div className="form-section">
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
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      value={newTeacher.mobile}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          mobile: e.target.value,
                        })
                      }
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <button onClick={addTeacher} className="add-btn">
                  Add Teacher
                </button>
              </div>
            )}

            {/* Remove Teacher Tab */}
            {teacherTab === "removeTeacher" && (
              <div className="form-section">
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
                            {teacher.name} ({teacher.mobile})
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
                  className="add-btn"
                  disabled={!selectedTeacherToRemove.trim()}
                >
                  Remove Teacher
                </button>
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="admin-section">
            <h2>Absence Report</h2>

            {/* Program Selector */}
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Select Program:
              </label>
              <select
                value={reportProgram}
                onChange={(e) => setReportProgram(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  width: "200px",
                }}
              >
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.name}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Filters */}
            <div className="filter-section" style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                {/* Date Picker */}
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Select Date:
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                {/* Report Type */}
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Report Type:
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      setReportDepartment(null);
                      setReportClass(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="whole">Whole Institution</option>
                    <option value="department">By Department</option>
                    <option value="class">By Class</option>
                  </select>
                </div>

                {/* Department Filter - shows for department and class types */}
                {(reportType === "department" || reportType === "class") && (
                  <div>
                    <label
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      {reportType === "class"
                        ? "Select Department:"
                        : "Select Department:"}
                    </label>
                    <select
                      value={reportDepartment?.id || ""}
                      onChange={(e) => {
                        const dept = reportDepartments.find(
                          (d) => d.id === parseInt(e.target.value),
                        );
                        setReportDepartment(dept || null);
                        if (reportType === "class") {
                          setReportClass(null);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <option value="">-- Select Department --</option>
                      {reportDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class Filter - only shows when department is selected and type is class */}
                {reportType === "class" && reportDepartment && (
                  <div>
                    <label
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Select Class:
                    </label>
                    <select
                      value={reportClass?.id || ""}
                      onChange={(e) => {
                        const cls = reportClasses.find(
                          (c) => c.id === parseInt(e.target.value),
                        );
                        setReportClass(cls || null);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    >
                      <option value="">-- Select Class --</option>
                      {reportClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <button
                onClick={printReport}
                className="export-btn"
                style={{ marginTop: "10px" }}
              >
                Print Report
              </button>
            </div>

            {/* Report Preview */}
            <div className="report-container">
              <h3>Report Preview</h3>
              {Object.keys(report).length === 0 ? (
                <div style={{ color: "#999", padding: "20px" }}>
                  No data available for the selected filters.
                </div>
              ) : (
                Object.entries(report).map(([deptName, classesByName]) => (
                  <div key={deptName} className="report-section">
                    <div className="report-department-title">{deptName}</div>
                    {Object.entries(classesByName).map(
                      ([className, absences]) => (
                        <div key={className} className="report-class">
                          <div className="report-class-title">
                            Class: {className} | Total Absences:{" "}
                            {absences.length}
                          </div>
                          {absences.length > 0 ? (
                            absences.map((student, idx) => (
                              <div key={idx} className="report-student">
                                {student.rollNo} - {student.name} (
                                {student.reason})
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
                      ),
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Attendance Lock Tab */}
        {activeTab === "attendance-lock" && (
          <div className="admin-section">
            <h2>Attendance Lock Management</h2>

            {/* Program Selector */}
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Select Program:
              </label>
              <select
                value={lockProgram || ""}
                onChange={(e) => {
                  setLockProgram(e.target.value);
                  setLockDepartment(null);
                  setLockClass(null);
                }}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  width: "100%",
                  maxWidth: "300px",
                }}
              >
                <option value="">-- Select Program --</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.name}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selector */}
            {lockProgram && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Select Department:
                </label>
                <select
                  value={lockDepartment?.id || ""}
                  onChange={(e) => {
                    const dept = lockDepartments.find(
                      (d) => d.id === parseInt(e.target.value),
                    );
                    setLockDepartment(dept || null);
                    setLockClass(null);
                  }}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    width: "100%",
                    maxWidth: "300px",
                  }}
                >
                  <option value="">-- Select Department --</option>
                  {lockDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Class Selector */}
            {lockDepartment && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Select Class:
                </label>
                <select
                  value={lockClass?.id || ""}
                  onChange={(e) => {
                    const cls = lockClasses.find(
                      (c) => c.id === parseInt(e.target.value),
                    );
                    setLockClass(cls || null);
                  }}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    width: "100%",
                    maxWidth: "300px",
                  }}
                >
                  <option value="">-- Select Class --</option>
                  {lockClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Selector and Lock Controls */}
            {lockClass && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "15px",
                  }}
                >
                  {/* Date Input */}
                  <div>
                    <label
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Select Date:
                    </label>
                    <input
                      type="date"
                      value={lockDate}
                      onChange={(e) => setLockDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  {/* Reason Input */}
                  <div>
                    <label
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Reason (optional):
                    </label>
                    <input
                      type="text"
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="e.g., Holiday, System Issue"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                </div>

                {/* Lock/Unlock Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <button
                    onClick={() => toggleAttendanceLock()}
                    disabled={isCurrentDateLocked}
                    className="export-btn"
                    style={{
                      backgroundColor: isCurrentDateLocked
                        ? "#bdc3c7"
                        : "#3498db",
                      cursor: isCurrentDateLocked ? "not-allowed" : "pointer",
                      opacity: isCurrentDateLocked ? 0.6 : 1,
                    }}
                  >
                    {isCurrentDateLocked ? "✓ Date Locked" : "Lock Attendance"}
                  </button>
                  <button
                    onClick={() => unlockAttendance(lockClass.id, lockDate)}
                    disabled={!isCurrentDateLocked}
                    className="export-btn"
                    style={{
                      backgroundColor: !isCurrentDateLocked
                        ? "#bdc3c7"
                        : "#e74c3c",
                      cursor: !isCurrentDateLocked ? "not-allowed" : "pointer",
                      opacity: !isCurrentDateLocked ? 0.6 : 1,
                    }}
                  >
                    {!isCurrentDateLocked
                      ? "Date Unlocked"
                      : "Unlock Attendance"}
                  </button>
                </div>
              </div>
            )}

            {/* Locked Dates List */}
            {lockClass && lockedDates.length > 0 && (
              <div>
                <h3>Locked Dates for {lockClass.name}</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {lockedDates.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Date:</strong> {item.date}
                      </div>
                      {item.reason && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Reason:</strong> {item.reason}
                        </div>
                      )}
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Locked by:</strong> {item.lockedBy}
                      </div>
                      <button
                        onClick={() =>
                          unlockAttendance(lockClass.id, item.date)
                        }
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Unlock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

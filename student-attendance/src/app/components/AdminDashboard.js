import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/apiUtils";
import * as XLSX from "xlsx";
import "../attendance.css";
import DashboardBarChart from "./DashboardBarChart";
import DashboardPieChart from "./DashboardPieChart";

// Helper function to sort array by search match position
function sortByMatchPosition(items, searchQuery, fieldNames = []) {
  if (!searchQuery.trim()) return items;

  const search = searchQuery.toLowerCase();

  return [...items].sort((a, b) => {
    // Get all possible values to search in for each item
    let aValues = fieldNames.map((field) => {
      const value = a[field];
      return value ? String(value).toLowerCase() : "";
    });

    let bValues = fieldNames.map((field) => {
      const value = b[field];
      return value ? String(value).toLowerCase() : "";
    });

    // Find the minimum position of match for item a
    let aMinPos = Math.min(
      ...aValues.map((val) => {
        const pos = val.indexOf(search);
        return pos === -1 ? Infinity : pos;
      }),
    );

    // Find the minimum position of match for item b
    let bMinPos = Math.min(
      ...bValues.map((val) => {
        const pos = val.indexOf(search);
        return pos === -1 ? Infinity : pos;
      }),
    );

    // If positions are different, sort by position
    if (aMinPos !== bMinPos) {
      return aMinPos - bMinPos;
    }

    // If positions are the same, sort alphabetically by the first field
    const aFirst = aValues[0] || "";
    const bFirst = bValues[0] || "";
    return aFirst.localeCompare(bFirst);
  });
}

export default function AdminDashboard({ user, onLogout }) {
  // State for change password form
  const [changePasswordMobile, setChangePasswordMobile] = useState("");
  const [changePasswordTeacherInput, setChangePasswordTeacherInput] =
    useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
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
          mobile: changePasswordMobile,
          oldPassword: changePasswordOld,
          password: changePasswordNew,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Password changed successfully!");
        setChangePasswordMobile("");
        setChangePasswordTeacherInput("");
        setChangePasswordOld("");
        setChangePasswordNew("");
        setChangePasswordConfirm("");
        setShowTeacherDropdown(false);
        fetchTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to change password: " + error.message);
    }
  };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
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

  // Dashboard date selection state
  const [dashboardDateMode, setDashboardDateMode] = useState("specific"); // "range" or "specific"
  const [dashboardDate, setDashboardDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dashboardDateFrom, setDashboardDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  ); // 30 days ago
  const [dashboardDateTo, setDashboardDateTo] = useState(
    new Date().toISOString().split("T")[0],
  ); // Today

  // Dashboard hierarchy selection state
  const [dashboardType, setDashboardType] = useState("whole"); // whole, department, class
  const [dashboardProgram, setDashboardProgram] = useState("all");
  const [dashboardDepartment, setDashboardDepartment] = useState(null);
  const [dashboardClass, setDashboardClass] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    studentsFromClassesOnHoliday: 0,
    present: 0,
    absent: 0,
    avgPresent: 0,
    avgAbsent: 0,
    studentsNotOnHoliday: 0,
    avgAttendancePercent: 0,
  });

  // Chart data states
  const [dashboardBreakdownData, setDashboardBreakdownData] = useState([]);
  const [dashboardHolidayData, setDashboardHolidayData] = useState({
    presentDays: 0,
    absentDays: 0,
    holidayDays: 0,
  });

  // Dashboard-specific department/class lists
  const [dashboardDepartments, setDashboardDepartments] = useState([]);
  const [dashboardClasses, setDashboardClasses] = useState([]);

  // Report state
  const [reportProgram, setReportProgram] = useState("all");
  const [reportDepartments, setReportDepartments] = useState([]);
  const [reportDateMode, setReportDateMode] = useState("range"); // "range" or "specific"
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportDateFrom, setReportDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  ); // 30 days ago
  const [reportDateTo, setReportDateTo] = useState(
    new Date().toISOString().split("T")[0],
  ); // Today
  const [reportType, setReportType] = useState("whole"); // 'whole', 'department', 'class'
  const [reportDepartment, setReportDepartment] = useState(null);
  const [reportClass, setReportClass] = useState(null);
  const [reportResidence, setReportResidence] = useState("all");
  const [reportInformedStatus, setReportInformedStatus] = useState("all");

  const [reportClasses, setReportClasses] = useState([]);
  const [report, setReport] = useState({});
  const [reportTotalStudents, setReportTotalStudents] = useState({}); // Map of deptId to student count
  const [expandedTeacherId, setExpandedTeacherId] = useState(null); // Track which teacher's courses are expanded
  const [teacherCourses, setTeacherCourses] = useState({}); // Cache of teacher courses

  // Teacher Modal States
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [modalTeacher, setModalTeacher] = useState(null);

  // Attendance Lock Management States
  const [lockManagementTab, setLockManagementTab] = useState("list");
  const [lockManagementSubTab, setLockManagementSubTab] =
    useState("attendance"); // "attendance" or "holiday"
  const [lockType, setLockType] = useState("whole"); // whole, department, class
  const [lockProgram, setLockProgram] = useState("all");
  const [lockDepartment, setLockDepartment] = useState(null);
  const [lockClass, setLockClass] = useState(null);
  const [lockDateMode, setLockDateMode] = useState("specific"); // "range" or "specific"
  const [lockDate, setLockDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lockDateFrom, setLockDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  ); // 30 days ago
  const [lockDateTo, setLockDateTo] = useState(
    new Date().toISOString().split("T")[0],
  ); // Today

  const [lockedDates, setLockedDates] = useState([]); // List of locked dates for viewing
  const [lockDepartments, setLockDepartments] = useState([]);
  const [lockClasses, setLockClasses] = useState([]);
  const [isCurrentDateLocked, setIsCurrentDateLocked] = useState(false);

  // Holiday Lock Management States
  const [holidayLockType, setHolidayLockType] = useState("whole");
  const [holidayLockProgram, setHolidayLockProgram] = useState("all");
  const [holidayLockDepartment, setHolidayLockDepartment] = useState(null);
  const [holidayLockClass, setHolidayLockClass] = useState(null);
  const [holidayLockDateMode, setHolidayLockDateMode] = useState("specific");
  const [holidayLockDate, setHolidayLockDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [holidayLockDateFrom, setHolidayLockDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [holidayLockDateTo, setHolidayLockDateTo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [holidayLockReason, setHolidayLockReason] = useState("");
  const [holidayLockedDates, setHolidayLockedDates] = useState([]);
  const [holidayLockDepartments, setHolidayLockDepartments] = useState([]);
  const [holidayLockClasses, setHolidayLockClasses] = useState([]);
  const [holidayLockScopeClasses, setHolidayLockScopeClasses] = useState([]);
  const [isCurrentHolidayDateLocked, setIsCurrentHolidayDateLocked] =
    useState(false);

  // State for attendance submission check
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [unsubmittedClasses, setUnsubmittedClasses] = useState([]);
  const [proceedWithPrint, setProceedWithPrint] = useState(false);

  // State for lock confirmation modal
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [lockConfirmAction, setLockConfirmAction] = useState(null); // 'print' or 'export'

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Helper function to validate that the selected date is not in the future
  const validateDateNotInFuture = (dateStr, setterFunction) => {
    const newDate = dateStr;

    // Validate that the date is not empty
    if (!newDate) {
      alert("Please select a valid date.");
      return false;
    }

    // Parse the date and validate it's actually a valid date
    const [year, month, day] = newDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);

    // Check if the date is valid by comparing back
    // (e.g., 31 Feb will become 3 Mar, which doesn't match input)
    if (
      selectedDateObj.getFullYear() !== year ||
      selectedDateObj.getMonth() !== month - 1 ||
      selectedDateObj.getDate() !== day
    ) {
      alert(
        "Invalid date. Please enter a valid date (e.g., 28 Feb, not 31 Feb).",
      );
      return false;
    }

    // Validate that the selected date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj > today) {
      alert(
        "Future dates are not allowed. Please select today or a past date.",
      );
      return false;
    }

    setterFunction(newDate);
    return true;
  };

  // Dashboard date handlers - prevent future dates
  const handleDashboardDateChange = (newDate) => {
    validateDateNotInFuture(newDate, setDashboardDate);
  };

  const handleDashboardDateFromChange = (newDate) => {
    validateDateNotInFuture(newDate, setDashboardDateFrom);
  };

  const handleDashboardDateToChange = (newDate) => {
    validateDateNotInFuture(newDate, setDashboardDateTo);
  };

  // Report date handlers - prevent future dates
  const handleReportDateChange = (newDate) => {
    validateDateNotInFuture(newDate, setReportDate);
  };

  const handleReportDateFromChange = (newDate) => {
    validateDateNotInFuture(newDate, setReportDateFrom);
  };

  const handleReportDateToChange = (newDate) => {
    validateDateNotInFuture(newDate, setReportDateTo);
  };

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

  // Open Teacher Modal for editing
  const openTeacherModal = (teacher) => {
    setModalTeacher({
      id: teacher.id,
      name: teacher.name,
      mobile: teacher.mobile,
    });
    setShowTeacherModal(true);
  };

  // Save Teacher from Modal
  const saveModalTeacher = async () => {
    if (!modalTeacher.name.trim() || !modalTeacher.mobile.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await apiCall("/api/teachers", {
        method: "PUT",
        body: JSON.stringify({
          teacherId: modalTeacher.id,
          name: modalTeacher.name,
          mobile: modalTeacher.mobile,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher updated successfully!");
        setShowTeacherModal(false);
        setModalTeacher(null);
        fetchTeachers();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to update teacher: " + error.message);
    }
  };

  // Delete Teacher from Modal
  const deleteModalTeacher = async () => {
    if (!confirm("Are you sure you want to delete this teacher?")) {
      return;
    }

    try {
      const res = await apiCall(`/api/teachers?teacherId=${modalTeacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        alert("Teacher deleted successfully!");
        setShowTeacherModal(false);
        setModalTeacher(null);
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
      let url = "/api/departments";
      if (reportProgram !== "all") {
        url += `?program=${reportProgram}`;
      }
      const res = await apiCall(url);
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

  // Fetch departments for dashboard based on selected program
  useEffect(() => {
    async function fetchDashboardDepartments() {
      let url = "/api/departments";
      if (dashboardProgram !== "all") {
        url += `?program=${dashboardProgram}`;
      }
      const res = await apiCall(url);
      const data = await res.json();
      if (data.success) {
        setDashboardDepartments(data.departments);
        setDashboardDepartment(null);
        setDashboardClass(null);
      } else {
        setDashboardDepartments([]);
        setDashboardDepartment(null);
        setDashboardClass(null);
      }
    }
    fetchDashboardDepartments();
  }, [dashboardProgram]);

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

  // Fetch classes for dashboard based on selected department
  useEffect(() => {
    async function fetchDashboardClasses() {
      let allClasses = [];
      if (dashboardDepartment) {
        const res = await apiCall(
          `/api/classes?departmentId=${dashboardDepartment.id}`,
        );
        const data = await res.json();
        if (data.success) {
          allClasses = data.classes.map((c) => ({
            ...c,
            departmentId: dashboardDepartment.id,
          }));
        }
      }
      setDashboardClasses(allClasses);
      if (dashboardDepartment && allClasses.length === 0) {
        setDashboardClass(null);
      }
    }
    if (dashboardDepartment) {
      fetchDashboardClasses();
    }
  }, [dashboardDepartment]);

  // Update report preview when filters change
  useEffect(() => {
    async function updateReportPreview() {
      if (activeTab === "report") {
        if (reportDateMode === "range") {
          const newReport = await generateReport(
            null,
            reportDateFrom,
            reportDateTo,
            reportType,
            reportDepartment,
            reportClass,
            reportResidence,
            reportInformedStatus,
          );
          setReport(newReport);
        } else {
          const newReport = await generateReport(
            reportDate,
            null,
            null,
            reportType,
            reportDepartment,
            reportClass,
            reportResidence,
            reportInformedStatus,
          );
          setReport(newReport);
        }
      }
    }
    updateReportPreview();
  }, [
    activeTab,
    reportProgram,
    reportDepartments,
    reportDateMode,
    reportDate,
    reportDateFrom,
    reportDateTo,
    reportType,
    reportDepartment,
    reportClass,
    reportResidence,
    reportInformedStatus,
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
        let url = "/api/departments";
        if (lockProgram !== "all") {
          url += `?program=${lockProgram}`;
        }
        const res = await apiCall(url);
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

  // Fetch all classes for whole institution lock
  useEffect(() => {
    async function fetchAllClasses() {
      if (lockType !== "whole") {
        return;
      }
      try {
        const res = await apiCall("/api/classes");
        const data = await res.json();
        if (data.success) {
          setLockClasses(data.classes);
        }
      } catch (error) {
        console.error("Failed to fetch all classes:", error);
        setLockClasses([]);
      }
    }
    fetchAllClasses();
  }, [lockType]);

  // Fetch holiday lock departments based on selected program
  useEffect(() => {
    async function fetchHolidayLockDeptList() {
      if (!holidayLockProgram) {
        setHolidayLockDepartments([]);
        setHolidayLockDepartment(null);
        setHolidayLockClass(null);
        return;
      }
      try {
        const res = await apiCall(
          holidayLockProgram === "all"
            ? "/api/departments"
            : `/api/departments?program=${holidayLockProgram}`,
        );
        const data = await res.json();
        if (data.success) {
          setHolidayLockDepartments(data.departments);
          setHolidayLockDepartment(null);
          setHolidayLockClass(null);
        }
      } catch (error) {
        console.error("Failed to fetch holiday lock departments:", error);
        setHolidayLockDepartments([]);
      }
    }
    fetchHolidayLockDeptList();
  }, [holidayLockProgram]);

  // Fetch holiday lock classes based on selected department
  useEffect(() => {
    async function fetchHolidayLockClassList() {
      if (!holidayLockDepartment) {
        setHolidayLockClasses([]);
        setHolidayLockClass(null);
        return;
      }
      try {
        const res = await apiCall(
          `/api/classes?departmentId=${holidayLockDepartment.id}`,
        );
        const data = await res.json();
        if (data.success) {
          setHolidayLockClasses(data.classes);
          setHolidayLockClass(null);
        }
      } catch (error) {
        console.error("Failed to fetch holiday lock classes:", error);
        setHolidayLockClasses([]);
      }
    }
    fetchHolidayLockClassList();
  }, [holidayLockDepartment]);

  // Fetch holiday lock classes for whole institution
  useEffect(() => {
    async function fetchAllHolidayLockClasses() {
      if (holidayLockType !== "whole") {
        return;
      }
      try {
        const res = await apiCall("/api/classes");
        const data = await res.json();
        if (data.success) {
          setHolidayLockClasses(data.classes);
        }
      } catch (error) {
        console.error("Failed to fetch all holiday lock classes:", error);
        setHolidayLockClasses([]);
      }
    }
    fetchAllHolidayLockClasses();
  }, [holidayLockType]);

  // Fetch holiday locked dates when holiday lock tab or class changes
  useEffect(() => {
    if (activeTab === "attendance-lock" && lockManagementSubTab === "holiday") {
      fetchHolidayLockedDates();
    }
  }, [
    activeTab,
    lockManagementSubTab,
    holidayLockType,
    holidayLockDepartment,
    holidayLockClass,
    holidayLockClasses.length,
  ]);

  // Check if current selected holiday date is locked (ALL classes in scope must be locked)
  useEffect(() => {
    if (holidayLockScopeClasses.length === 0) {
      setIsCurrentHolidayDateLocked(false);
      return;
    }

    let dateToCheck = null;
    if (holidayLockDateMode === "specific" && holidayLockDate) {
      dateToCheck = holidayLockDate;
    } else if (
      holidayLockDateMode === "range" &&
      holidayLockDateFrom &&
      holidayLockDateTo
    ) {
      dateToCheck = holidayLockDateFrom;
    }

    if (!dateToCheck) {
      setIsCurrentHolidayDateLocked(false);
      return;
    }

    // Check if ALL classes in the current scope have a lock on this date
    const allClassesLocked = holidayLockScopeClasses.every((scopeClass) => {
      return holidayLockedDates.some((lock) => {
        const lockDate = new Date(lock.date).toISOString().split("T")[0];
        return lockDate === dateToCheck && lock.classId === scopeClass.id;
      });
    });

    setIsCurrentHolidayDateLocked(allClassesLocked);
  }, [
    holidayLockDateMode,
    holidayLockDate,
    holidayLockDateFrom,
    holidayLockDateTo,
    holidayLockedDates,
    holidayLockScopeClasses,
  ]);

  // Check if current lock date is locked
  useEffect(() => {
    async function checkCurrentDateLock() {
      if (!lockDate) {
        setIsCurrentDateLocked(false);
        return;
      }

      // For class-level locks, check the specific class
      if (lockType === "class" && !lockClass) {
        setIsCurrentDateLocked(false);
        return;
      }

      // For department-level locks, check the first class in the department
      if (lockType === "department" && !lockDepartment) {
        setIsCurrentDateLocked(false);
        return;
      }

      // For whole institution, we need at least one class to check
      if (lockType === "whole" && lockClasses.length === 0) {
        setIsCurrentDateLocked(false);
        return;
      }

      try {
        let classIdToCheck = null;

        if (lockType === "class" && lockClass) {
          classIdToCheck = lockClass.id;
        } else if (
          lockType === "department" &&
          lockDepartment &&
          lockClasses.length > 0
        ) {
          classIdToCheck = lockClasses[0].id;
        } else if (lockType === "whole" && lockClasses.length > 0) {
          // For whole institution, check any available class (preferably first)
          classIdToCheck = lockClasses[0].id;
        }

        if (!classIdToCheck || !lockDate) {
          setIsCurrentDateLocked(false);
          return;
        }

        // Check attendance lock status
        const res = await apiCall(
          `/api/attendance-lock?classId=${classIdToCheck}&date=${lockDate}`,
        );

        const data = await res.json();
        let isLocked = data.isLocked || false;

        // Also check if this date is a holiday - if so, attendance is effectively locked
        if (!isLocked) {
          try {
            const holidayRes = await apiCall(
              `/api/holiday-lock?classId=${classIdToCheck}&date=${lockDate}`,
            );
            const holidayData = await holidayRes.json();
            isLocked = isLocked || holidayData.isLocked || false;
          } catch (error) {
            // If holiday check fails, continue with attendance lock status
          }
        }

        setIsCurrentDateLocked(isLocked);
      } catch (error) {
        console.error("Failed to check lock status:", error);
        setIsCurrentDateLocked(false);
      }
    }
    checkCurrentDateLock();
  }, [lockType, lockClass, lockDepartment, lockDate, lockClasses]);

  // Auto-lock past dates when class is selected (only for admins)
  useEffect(() => {
    if (lockClass && user?.role === "admin") {
      ensurePastDatesLocked(lockClass.id);
      fetchLockedDates();
    } else if (lockClass) {
      // Still fetch locked dates for non-admins
      fetchLockedDates();
    }
  }, [lockClass, user?.role]);

  // Auto-lock past dates for whole institution or department (only for admins)
  useEffect(() => {
    async function autoLockForScope() {
      if (user?.role !== "admin") {
        return; // Skip auto-lock for non-admins
      }

      if (lockType === "whole" && lockClasses.length > 0) {
        // Auto-lock all classes for whole institution
        for (const cls of lockClasses) {
          await ensurePastDatesLocked(cls.id);
        }
      } else if (
        lockType === "department" &&
        lockDepartment &&
        lockClasses.length > 0
      ) {
        // Auto-lock all classes in department
        for (const cls of lockClasses) {
          await ensurePastDatesLocked(cls.id);
        }
      }
    }
    autoLockForScope();
  }, [lockType, lockDepartment, lockClasses, user?.role]);

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
    dateFrom = reportDateFrom,
    dateTo = reportDateTo,
    type = reportType,
    dept = reportDepartment,
    cls = reportClass,
    residence = reportResidence,
    informedStatus = reportInformedStatus,
  ) => {
    const report = {};
    const totalStudentsMap = {};
    let dateStr = selectedDate;
    let fromStr = dateFrom;
    let toStr = dateTo;

    // Determine if using date range or single date
    const isDateRange = selectedDate === null || selectedDate === undefined;

    if (isDateRange) {
      // Handle date strings directly without timezone conversion
      fromStr =
        typeof dateFrom === "string" && dateFrom.includes("-")
          ? dateFrom
          : new Date(dateFrom).toISOString().split("T")[0];
      toStr =
        typeof dateTo === "string" && dateTo.includes("-")
          ? dateTo
          : new Date(dateTo).toISOString().split("T")[0];
    } else {
      dateStr = new Date(selectedDate).toISOString().split("T")[0];

      // Check if this is a whole-institution holiday
      if (type === "whole") {
        const allClasses = reportClasses;
        const resHolidayLocks = await apiCall(
          `/api/holiday-lock?classId=${allClasses[0]?.id}&listAll=true`,
        );
        let dataHolidayLocks = {};
        try {
          dataHolidayLocks = await resHolidayLocks.json();
        } catch {
          dataHolidayLocks = { success: false };
        }

        // Check if all classes have a holiday lock on this date
        if (dataHolidayLocks.success && dataHolidayLocks.locks) {
          const holidayOnDate = dataHolidayLocks.locks.find(
            (lock) => lock.date === dateStr,
          );
          if (holidayOnDate) {
            // This is a whole-institution holiday
            return {
              "🔒 INSTITUTION HOLIDAY": {
                "": [
                  {
                    rollNo: "HOLIDAY",
                    name: `Holiday - ${holidayOnDate.reason}`,
                    residence: "",
                    reason: holidayOnDate.reason,
                    informed: "",
                    absenceCount: 0,
                    date: dateStr,
                    isHoliday: true,
                  },
                ],
              },
            };
          }
        }
      }

      // Check if this is a department-level holiday
      if (type === "department" && dept) {
        const deptClasses = reportClasses.filter(
          (c) => c.departmentId === dept.id,
        );
        if (deptClasses.length > 0) {
          const resHolidayLocks = await apiCall(
            `/api/holiday-lock?classId=${deptClasses[0]?.id}&listAll=true`,
          );
          let dataHolidayLocks = {};
          try {
            dataHolidayLocks = await resHolidayLocks.json();
          } catch {
            dataHolidayLocks = { success: false };
          }

          // Check if the date is a holiday
          if (dataHolidayLocks.success && dataHolidayLocks.locks) {
            const holidayOnDate = dataHolidayLocks.locks.find(
              (lock) => lock.date === dateStr,
            );
            if (holidayOnDate) {
              // This is a department-level holiday
              return {
                "🔒 DEPARTMENT HOLIDAY": {
                  "": [
                    {
                      rollNo: "HOLIDAY",
                      name: `Holiday - ${holidayOnDate.reason}`,
                      residence: "",
                      reason: holidayOnDate.reason,
                      informed: "",
                      absenceCount: 0,
                      date: dateStr,
                      isHoliday: true,
                    },
                  ],
                },
              };
            }
          }
        }
      }
    }

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
      report[dept.name].__totalStudents = {};
      for (const classItem of classes) {
        // Initialize total students count to 0
        report[dept.name].__totalStudents[classItem.name] = 0;

        // Fetch all holiday locks for this class
        const resHolidayLocks = await apiCall(
          `/api/holiday-lock?classId=${classItem.id}&listAll=true`,
        );
        let dataHolidayLocks = {};
        try {
          dataHolidayLocks = await resHolidayLocks.json();
        } catch {
          dataHolidayLocks = { success: false };
        }

        // Filter holiday locks based on date range
        let filteredHolidayLocks = [];
        if (dataHolidayLocks.success && dataHolidayLocks.locks) {
          filteredHolidayLocks = dataHolidayLocks.locks.filter((lock) => {
            if (isDateRange) {
              // Check if lock date is within range
              const lockDate = new Date(lock.date);
              const fromDate = new Date(fromStr);
              const toDate = new Date(toStr);
              return lockDate >= fromDate && lockDate <= toDate;
            } else {
              // Check if lock date matches specific date
              return lock.date === dateStr;
            }
          });
        }

        // Fetch attendance for this class
        let resAttendance;
        if (isDateRange) {
          resAttendance = await apiCall(
            `/api/attendance?classId=${classItem.id}&from=${fromStr}&to=${toStr}`,
          );
        } else {
          resAttendance = await apiCall(
            `/api/attendance?classId=${classItem.id}&from=${dateStr}&to=${dateStr}`,
          );
        }
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

        // Add filtered holiday lock information to the report
        filteredHolidayLocks.forEach((lock) => {
          absences.push({
            rollNo: "HOLIDAY",
            name: `🔒 Holiday - ${lock.reason || "No Reason"}`,
            residence: "",
            reason: lock.reason || "No Reason",
            informed: "",
            absenceCount: 0,
            date: lock.date,
            isHoliday: true,
          });
        });

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
              const studentResidence =
                studentMap[rec.studentId]?.residence || "";
              // Filter by residence
              if (residence !== "all" && studentResidence !== residence) {
                return;
              }
              // Filter by informed status
              let studentInformed = rec.informed || false;
              if (informedStatus !== "all") {
                const isInformed =
                  typeof studentInformed === "string"
                    ? studentInformed.toLowerCase() === "informed"
                    : studentInformed === true;
                if (informedStatus === "informed" && !isInformed) return;
                if (informedStatus === "not-informed" && isInformed) return;
              }

              // Check if date is a Sunday
              let absenceReason = rec.absenceReason || "";
              if (rec.date) {
                const dateObj = new Date(rec.date);
                if (dateObj.getUTCDay() === 0) {
                  // 0 = Sunday
                  absenceReason = "Sunday";
                }
              }

              absences.push({
                rollNo: studentMap[rec.studentId]?.rollNo || rec.studentId,
                name: studentMap[rec.studentId]?.studentName || "",
                residence: studentResidence,
                reason: absenceReason,
                informed: rec.informed || "",
                absenceCount: allAttendanceRecords.filter(
                  (r2) =>
                    r2.studentId === rec.studentId && r2.status === "absent",
                ).length,
                date: isDateRange ? rec.date : undefined,
              });
            });
        }
        report[dept.name][classItem.name] = absences;
        // Store total students count for this class
        if (dataAttendance.success && dataAttendance.students) {
          const { students } = dataAttendance;
          report[dept.name].__totalStudents[classItem.name] = students.length;
        } else {
          // Ensure count is set to 0 if API call failed
          report[dept.name].__totalStudents[classItem.name] =
            report[dept.name].__totalStudents[classItem.name] || 0;
        }
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

  // Check which classes have not submitted attendance for the selected date
  const checkAttendanceSubmissions = async (dateToCheck) => {
    try {
      const unsubmitted = [];
      let classesToCheck = [];

      // Determine classes to check based on report type
      if (reportType === "whole") {
        classesToCheck = reportClasses;
      } else if (reportType === "department" && reportDepartment) {
        classesToCheck = reportClasses.filter(
          (c) => c.departmentId === reportDepartment.id,
        );
      } else if (reportType === "class" && reportClass) {
        classesToCheck = [reportClass];
      }

      // Handle date conversion - account for timezone issues
      let dateStr;
      if (typeof dateToCheck === "string" && dateToCheck.includes("-")) {
        // Already in YYYY-MM-DD format
        dateStr = dateToCheck;
      } else {
        // Convert Date object to YYYY-MM-DD in UTC
        const dateObj = new Date(dateToCheck);
        dateStr = `${dateObj.getUTCFullYear()}-${String(
          dateObj.getUTCMonth() + 1,
        ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;
      }

      // Check if the selected date is a Sunday
      const selectedDateObj = new Date(dateStr + "T00:00:00.000Z");
      const isSunday = selectedDateObj.getUTCDay() === 0;
      console.log(`Checking attendance for ${dateStr}. Is Sunday: ${isSunday}`);

      // Get holiday locks for all classes to determine scope
      const holidayLocksMap = {}; // Map: classId -> boolean (has holiday on this date)

      for (const classItem of reportClasses) {
        try {
          const holidayLockRes = await apiCall(
            `/api/holiday-lock?classId=${classItem.id}&date=${dateStr}`,
          );
          const holidayLockData = await holidayLockRes.json();
          holidayLocksMap[classItem.id] =
            holidayLockData.success && holidayLockData.isLocked;
          if (holidayLockData.success && holidayLockData.isLocked) {
            console.log(
              `Class ${classItem.name} has holiday lock on ${dateStr}:`,
              holidayLockData.lock?.reason || "Unknown",
            );
          }
        } catch (error) {
          console.error(
            `Failed to check holiday lock for class ${classItem.id}:`,
            error,
          );
          holidayLocksMap[classItem.id] = false;
        }
      }

      // Count how many classes have holiday locks on this date
      const classesWithHoliday = Object.values(holidayLocksMap).filter(
        (has) => has,
      ).length;
      console.log(
        `Total classes with holiday on ${dateStr}: ${classesWithHoliday}/${reportClasses.length}`,
      );

      // If it's a Sunday and ALL classes are locked, return empty
      if (isSunday && classesWithHoliday === reportClasses.length) {
        console.log(
          `${dateStr} is a Sunday with all classes locked - skipping attendance checks`,
        );
        return []; // Institution-wide Sunday closure - no attendance needed
      }

      // If institution-wide holiday (all classes have holiday locks for non-Sunday dates), skip all checks
      if (
        !isSunday &&
        classesWithHoliday === reportClasses.length &&
        classesWithHoliday > 0
      ) {
        console.log("Institution-wide holiday detected, returning empty");
        return []; // Institution-wide holiday - show only holiday message
      }

      // Check each class for attendance records on the selected date
      for (const classItem of classesToCheck) {
        try {
          // Check if this class has a holiday lock on this date (use already-fetched map)
          if (holidayLocksMap[classItem.id]) {
            console.log(
              `Skipping ${classItem.name} - has holiday lock on ${dateStr}`,
            );
            continue; // Skip this class, it's submitted as a holiday
          }

          // If not a holiday, check for attendance records
          const res = await apiCall(
            `/api/attendance?classId=${classItem.id}&from=${dateStr}&to=${dateStr}`,
          );
          const data = await res.json();

          // If no attendance records found, class has not submitted
          if (
            !data.success ||
            !data.attendanceRecords ||
            data.attendanceRecords.length === 0
          ) {
            console.log(`${classItem.name} has not submitted on ${dateStr}`);
            unsubmitted.push({
              id: classItem.id,
              name: classItem.name,
              departmentId: classItem.departmentId,
            });
          }
        } catch (error) {
          console.error(
            `Failed to check attendance for class ${classItem.id}:`,
            error,
          );
          unsubmitted.push({
            id: classItem.id,
            name: classItem.name,
            departmentId: classItem.departmentId,
          });
        }
      }

      console.log(
        `Final unsubmitted count for ${dateStr}: ${unsubmitted.length}`,
      );
      return unsubmitted;
    } catch (error) {
      console.error("Failed to check attendance submissions:", error);
      return [];
    }
  };

  // Print Absence Report
  const printReport = async () => {
    try {
      // Show lock confirmation modal first
      setLockConfirmAction("print");
      setShowLockConfirmModal(true);
    } catch (error) {
      alert(
        "Failed to generate report. Please check attendance data and try again.",
      );
    }
  };

  // Handle lock confirmation and proceed with print
  const handleLockConfirmAndPrint = async () => {
    setShowLockConfirmModal(false);

    try {
      // Check submissions based on date mode
      const dateToCheck =
        reportDateMode === "range" ? reportDateFrom : reportDate;
      const unsubmitted = await checkAttendanceSubmissions(dateToCheck);

      if (unsubmitted.length > 0) {
        setUnsubmittedClasses(unsubmitted);
        setShowSubmissionModal(true);
        setProceedWithPrint(false);
        return;
      }

      // Proceed with report generation and printing
      await performPrintReport();
    } catch (error) {
      alert(
        "Failed to generate report. Please check attendance data and try again.",
      );
    }
  };

  // Perform actual report printing (separated to be called after modal confirmation)
  const performPrintReport = async () => {
    try {
      // Load logo as base64 first with retry logic
      let logoDataUrl = "";
      let logoAttempts = 0;
      const maxAttempts = 3;

      while (!logoDataUrl && logoAttempts < maxAttempts) {
        try {
          logoAttempts++;
          console.log(`Loading logo, attempt ${logoAttempts}/${maxAttempts}`);
          const response = await fetch("/2.PEC.png", { cache: "no-cache" });

          if (!response.ok) {
            console.warn(`HTTP Error: ${response.status}`);
            continue;
          }

          const blob = await response.blob();
          console.log(`Blob loaded, size: ${blob.size} bytes`);

          logoDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              console.log(
                `FileReader completed, data URL length: ${result.length}`,
              );
              resolve(result);
            };
            reader.onerror = (error) => {
              console.error("FileReader error:", error);
              reject(error);
            };
            reader.readAsDataURL(blob);
          });

          console.log("Logo loaded successfully as data URL");
        } catch (error) {
          console.error(`Logo load attempt ${logoAttempts} failed:`, error);
          if (logoAttempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }
      }

      if (!logoDataUrl) {
        console.warn("Could not load logo after all attempts");
      }

      let report;
      let dateStr;

      if (reportDateMode === "range") {
        report = await generateReport(null, reportDateFrom, reportDateTo);
        dateStr = `${new Date(reportDateFrom).toLocaleDateString()} to ${new Date(reportDateTo).toLocaleDateString()}`;
      } else {
        report = await generateReport(reportDate, null, null);
        dateStr = new Date(reportDate).toLocaleDateString();
      }

      const reportTypeLabel =
        reportType === "whole"
          ? "All Departments"
          : reportType === "department"
            ? reportDepartment?.name || "Department"
            : reportClass?.name || "Class";

      // Prepare logo HTML with fallback
      const logoImg = logoDataUrl
        ? `<img src="${logoDataUrl}" alt="PEC Logo" style="width: 80px; height: 80px; object-fit: contain;">`
        : '<img src="/2.PEC.png" alt="PEC Logo" style="width: 80px; height: 80px; object-fit: contain;">';

      let printContent = "";
      printContent = `
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
              .header-section {
                display: flex;
                align-items: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #333;
                gap: 20px;
              }
              .header-logo {
                flex-shrink: 0;
              }
              .header-logo img {
                width: 80px;
                height: 80px;
                object-fit: contain;
              }
              .header-content {
                flex: 1;
                text-align: center;
              }
              .college-name {
                font-size: 22px;
                font-weight: bold;
                color: #8b1538;
                margin-bottom: 5px;
              }
              .college-address {
                font-size: 12px;
                color: #333;
                margin-bottom: 2px;
              }
              .college-subtitle {
                font-size: 11px;
                color: #666;
                font-style: italic;
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
              .date-header {
                background-color: transparent;
                color: #000;
                font-size: 20px;
                font-weight: bold;
                padding: 12px 12px;
                margin: 20px 0 12px 0;
                border-radius: 0;
              }
              @media print {
                body { margin: 30px 15px; }
                table { page-break-inside: auto; margin: 12px 0 8px 0; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                .department-wrapper { page-break-after: always; margin-bottom: 0; padding-bottom: 20px; }
                .header-section { display: flex; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333; gap: 20px; page-break-after: avoid; }
                .header-logo { flex-shrink: 0; display: block; }
                .header-logo img { width: 80px; height: 80px; object-fit: contain; display: block; }
                .header-content { flex: 1; text-align: center; }
              }
            </style>
          </head>
          <body>
            <div class="header-section">
              <div class="header-logo">
                ${logoImg}
              </div>
              <div class="header-content">
                <div class="college-name">PAAVAI ENGINEERING COLLEGE</div>
                <div class="college-address">NH-44 Pachal Namakkal Tamil Nadu India 637 018</div>
                <div class="college-subtitle">Autonomous Institution | Approved By AICTE | Affiliated To Anna University, Chennai</div>
              </div>
            </div>
            <h1>Absence Report</h1>
            <div class="report-info">Report Type: ${reportTypeLabel}</div>
            <div class="date">Date: ${dateStr} | Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      `;

      if (reportDateMode === "range") {
        // For date range - organize by date first, then departments and classes
        const reportByDate = {};
        const classStudentCountMap = {}; // Map to store total students per class

        // Extract totalStudents metadata first
        Object.entries(report).forEach(([deptName, absencesByClass]) => {
          if (absencesByClass && absencesByClass.__totalStudents) {
            classStudentCountMap[deptName] = absencesByClass.__totalStudents;
          }
        });

        // Reorganize data by date
        Object.entries(report).forEach(([deptName, absencesByClass]) => {
          if (!absencesByClass || typeof absencesByClass !== "object") return;

          Object.entries(absencesByClass).forEach(([className, absences]) => {
            // Skip metadata keys
            if (className === "__totalStudents" || !Array.isArray(absences))
              return;

            absences.forEach((student) => {
              // Extract just the date part (YYYY-MM-DD format)
              let dateKey = "Unknown";
              if (student.date) {
                try {
                  // If it's an ISO string, extract the date part
                  const datePart = student.date.includes("T")
                    ? student.date.split("T")[0]
                    : student.date;
                  dateKey = datePart;
                } catch (e) {
                  console.error("Date parsing error:", e);
                }
              }
              if (!reportByDate[dateKey]) {
                reportByDate[dateKey] = {};
              }
              if (!reportByDate[dateKey][deptName]) {
                reportByDate[dateKey][deptName] = {};
              }
              if (!reportByDate[dateKey][deptName][className]) {
                reportByDate[dateKey][deptName][className] = [];
              }
              reportByDate[dateKey][deptName][className].push(student);
            });
          });
        });

        // Sort dates in ascending order
        const sortedDates = Object.keys(reportByDate).sort();
        sortedDates.forEach((dateKey, idx) => {
          // Parse date - dateKey should be in YYYY-MM-DD format
          let dateDisplay = dateKey;
          if (dateKey !== "Unknown") {
            try {
              // Parse YYYY-MM-DD format and format as DD-MM-YYYY
              const date = new Date(dateKey + "T00:00:00Z");
              const day = String(date.getUTCDate()).padStart(2, "0");
              const month = String(date.getUTCMonth() + 1).padStart(2, "0");
              const year = date.getUTCFullYear();
              dateDisplay = `${day}-${month}-${year}`;
            } catch (e) {
              console.error("Date display error:", e);
              dateDisplay = dateKey;
            }
          }
          const pageBreak = idx > 0 ? 'style="page-break-before: always;"' : "";
          printContent += `<div class="date-header" ${pageBreak}>Date: ${dateDisplay}</div>`;

          const deptsOnDate = reportByDate[dateKey];

          // Check if entire date is a holiday for whole institution
          let dateHolidayReason = null;
          if (reportType === "whole") {
            let allHolidays = true;
            let holidayReason = null;
            Object.entries(deptsOnDate).forEach(([deptName, classesOnDate]) => {
              Object.entries(classesOnDate).forEach(([className, absences]) => {
                absences.forEach((student) => {
                  if (student.isHoliday) {
                    holidayReason = student.reason || holidayReason;
                  } else {
                    allHolidays = false;
                  }
                });
              });
            });
            if (allHolidays && holidayReason) {
              dateHolidayReason = holidayReason;
            }
          }

          // If entire date is holiday, show simplified display
          if (dateHolidayReason) {
            printContent += `<div style="padding: 10px; background-color: #ffffcc; border-left: 3px solid #ffcc00; font-weight: 500; font-size: 18px;">🔒 Holiday - ${dateHolidayReason}</div>`;
          } else {
            // Add summary for this date first (only if not all holidays)
            if (reportType !== "class") {
              const summaryData = {};
              let totalAbsencesThisDate = 0;
              let totalStrengthThisDate = 0;
              let totalPresentThisDate = 0;

              Object.entries(deptsOnDate).forEach(
                ([deptName, classesOnDate]) => {
                  let deptAbsent = 0;
                  let deptStrength = 0;
                  let deptPresent = 0;
                  Object.entries(classesOnDate).forEach(
                    ([className, absences]) => {
                      if (!Array.isArray(absences)) return;

                      // Check if this class is all holidays
                      const allClassHolidays = absences.every(
                        (s) => s.isHoliday,
                      );

                      // Get total students for this class from map
                      const totalStudents =
                        (classStudentCountMap[deptName] &&
                          classStudentCountMap[deptName][className]) ||
                        0;
                      const absentCount = allClassHolidays
                        ? 0
                        : absences.filter((s) => !s.isHoliday).length;
                      const presentCount = totalStudents - absentCount;

                      if (!summaryData[deptName]) {
                        summaryData[deptName] = {};
                      }
                      summaryData[deptName][className] = {
                        totalStrength: totalStudents,
                        present: presentCount,
                        absent: absentCount,
                        isHoliday: allClassHolidays,
                      };

                      if (!allClassHolidays) {
                        deptAbsent += absentCount;
                        deptStrength += totalStudents;
                        deptPresent += presentCount;
                        totalAbsencesThisDate += absentCount;
                        totalStrengthThisDate += totalStudents;
                        totalPresentThisDate += presentCount;
                      }
                    },
                  );
                  summaryData[deptName]["__total"] = {
                    totalStrength: deptStrength,
                    present: deptPresent,
                    absent: deptAbsent,
                  };
                },
              );

              printContent += `
                <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #333;">Summary - ${dateDisplay}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Class</th>
                        <th>Total Strength</th>
                        <th>Present</th>
                        <th>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
              `;

              if (reportType === "whole") {
                Object.entries(summaryData).forEach(([deptName, classData]) => {
                  const deptTotal = classData["__total"];
                  const classes = Object.entries(classData)
                    .filter(([key]) => key !== "__total")
                    .sort();

                  classes.forEach(([className, classStats], idx) => {
                    const displayStrength = classStats.isHoliday
                      ? "Holiday"
                      : classStats.totalStrength;
                    const displayPresent = classStats.isHoliday
                      ? "-"
                      : classStats.present;
                    const displayAbsent = classStats.isHoliday
                      ? "-"
                      : classStats.absent;

                    printContent += `
                      <tr>
                        <td>${idx === 0 ? deptName : ""}</td>
                        <td>${className}</td>
                        <td>${displayStrength}</td>
                        <td>${displayPresent}</td>
                        <td>${displayAbsent}</td>
                      </tr>
                    `;
                  });

                  printContent += `
                    <tr style="background-color: #e8e8e8; font-weight: bold;">
                      <td>${deptName} Total</td>
                      <td></td>
                      <td>${deptTotal.totalStrength}</td>
                      <td>${deptTotal.present}</td>
                      <td>${deptTotal.absent}</td>
                    </tr>
                  `;
                });

                printContent += `
                  <tr style="background-color: #d0d0d0; font-weight: bold; font-size: 14px;">
                    <td>Date Total</td>
                    <td></td>
                    <td>${totalStrengthThisDate}</td>
                    <td>${totalPresentThisDate}</td>
                    <td>${totalAbsencesThisDate}</td>
                  </tr>
                `;
              } else if (reportType === "department") {
                Object.entries(summaryData).forEach(([deptName, classData]) => {
                  const deptTotal = classData["__total"];
                  const classes = Object.entries(classData)
                    .filter(([key]) => key !== "__total")
                    .sort();

                  classes.forEach(([className, classStats]) => {
                    const displayStrength = classStats.isHoliday
                      ? "Holiday"
                      : classStats.totalStrength;
                    const displayPresent = classStats.isHoliday
                      ? "-"
                      : classStats.present;
                    const displayAbsent = classStats.isHoliday
                      ? "-"
                      : classStats.absent;

                    printContent += `
                      <tr>
                        <td>${deptName}</td>
                        <td>${className}</td>
                        <td>${displayStrength}</td>
                        <td>${displayPresent}</td>
                        <td>${displayAbsent}</td>
                      </tr>
                    `;
                  });

                  printContent += `
                    <tr style="background-color: #e8e8e8; font-weight: bold;">
                      <td>${deptName} Total</td>
                      <td></td>
                      <td>${deptTotal.totalStrength}</td>
                      <td>${deptTotal.present}</td>
                      <td>${deptTotal.absent}</td>
                    </tr>
                  `;
                });
              }

              printContent += `
                    </tbody>
                  </table>
                </div>
              `;
            }

            // Now add detailed data for this date
            Object.entries(deptsOnDate).forEach(([deptName, classesOnDate]) => {
              // Check if entire department is holiday
              let deptHolidayReason = null;
              let allDeptHolidays = true;
              Object.entries(classesOnDate).forEach(([className, absences]) => {
                absences.forEach((student) => {
                  if (student.isHoliday) {
                    deptHolidayReason = student.reason || deptHolidayReason;
                  } else {
                    allDeptHolidays = false;
                  }
                });
              });

              if (
                allDeptHolidays &&
                deptHolidayReason &&
                reportType !== "class"
              ) {
                printContent += `<div style="padding: 10px; background-color: #ffffcc; border-left: 3px solid #ffcc00; font-weight: 500; font-size: 18px;"><strong>${deptName}: 🔒 Holiday - ${deptHolidayReason}</strong></div>`;
              } else {
                printContent += `<div class="department-wrapper">`;
                printContent += `<div class="department-header">${deptName}</div>`;
                Object.entries(classesOnDate).forEach(
                  ([className, absences]) => {
                    // Check if this class is all holidays
                    const allClassHolidays = absences.every((s) => s.isHoliday);
                    const holidayEntry = absences.find((s) => s.isHoliday);

                    printContent += `<div class="class-header">Class: ${className}</div>`;
                    if (allClassHolidays && holidayEntry) {
                      printContent += `<div style="padding: 10px; background-color: #ffffcc; border-left: 3px solid #ffcc00; font-size: 16px;">🔒 Holiday - ${holidayEntry.reason}</div>`;
                    } else if (absences.length > 0) {
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
                            <th>Absence Count</th>
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
                          <td>${student.absenceCount || 0}</td>
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
                  },
                );
                printContent += `</div>`;
              }
            });
          }
        });
      } else {
        // For specific date - Build summary first, then data

        // Calculate summary data
        const summaryData = {};
        let totalInstitutionAbsences = 0;
        let totalInstitutionStrength = 0;
        let totalInstitutionPresent = 0;

        Object.entries(report).forEach(([deptName, absencesByClass]) => {
          let deptAbsent = 0;
          let deptStrength = 0;
          let deptPresent = 0;
          Object.entries(absencesByClass).forEach(([className, absences]) => {
            // Skip metadata keys
            if (className === "__totalStudents" || !Array.isArray(absences))
              return;

            // Check if this class is all holidays
            const allClassHolidays = absences.every((s) => s.isHoliday);

            // Get total students for this class from report metadata
            const totalStudents =
              report[deptName].__totalStudents?.[className] || 0;
            const absentCount = allClassHolidays
              ? 0
              : absences.filter((a) => !a.isHoliday).length;
            const presentCount = totalStudents - absentCount;

            if (!summaryData[deptName]) {
              summaryData[deptName] = {};
            }

            if (allClassHolidays) {
              const holidayEntry = absences.find((s) => s.isHoliday);
              summaryData[deptName][className] = {
                totalStrength: `🔒 ${holidayEntry?.reason || "Holiday"}`,
                present: "-",
                absent: "-",
                isHoliday: true,
              };
            } else {
              summaryData[deptName][className] = {
                totalStrength: totalStudents,
                present: presentCount,
                absent: absentCount,
                isHoliday: false,
              };
              deptAbsent += absentCount;
              deptStrength += totalStudents;
              deptPresent += presentCount;
              totalInstitutionAbsences += absentCount;
              totalInstitutionStrength += totalStudents;
              totalInstitutionPresent += presentCount;
            }
          });
          summaryData[deptName]["__total"] = {
            totalStrength: deptStrength,
            present: deptPresent,
            absent: deptAbsent,
          };
        });

        // Check if entire institution is on holiday
        let institutionHolidayReason = null;
        let allInstitutionHoliday = true;
        Object.entries(report).forEach(([deptName, absencesByClass]) => {
          Object.entries(absencesByClass).forEach(([className, absences]) => {
            // Skip metadata keys
            if (className === "__totalStudents" || !Array.isArray(absences))
              return;

            absences.forEach((student) => {
              if (student.isHoliday) {
                institutionHolidayReason =
                  student.reason || institutionHolidayReason;
              } else {
                allInstitutionHoliday = false;
              }
            });
          });
        });

        if (
          allInstitutionHoliday &&
          institutionHolidayReason &&
          reportType === "whole"
        ) {
          // For whole institution holiday
          printContent += `<div style="padding: 15px; background-color: #ffffcc; border-left: 3px solid #ffcc00; font-weight: 500; font-size: 20px;">🔒 Holiday - ${institutionHolidayReason}</div>`;
        } else {
          // Add summary page first (only if not all institution holiday)
          if (reportType !== "class") {
            printContent += `
              <div class="department-wrapper">
                <div class="department-header">Summary of Absences</div>
                <table>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Class</th>
                      <th>Total Strength</th>
                      <th>Present</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
            `;

            if (reportType === "whole") {
              // For whole institution, show all departments, classes, and institution total
              Object.entries(summaryData).forEach(([deptName, classData]) => {
                const deptTotal = classData["__total"];
                const classes = Object.entries(classData)
                  .filter(([key]) => key !== "__total")
                  .sort();

                classes.forEach(([className, classStats], idx) => {
                  printContent += `
                    <tr>
                      <td>${idx === 0 ? deptName : ""}</td>
                      <td>${className}</td>
                      <td>${classStats.totalStrength}</td>
                      <td>${classStats.present}</td>
                      <td>${classStats.absent}</td>
                    </tr>
                  `;
                });

                // Add department total row
                printContent += `
                  <tr style="background-color: #e8e8e8; font-weight: bold;">
                    <td>${deptName} Total</td>
                    <td></td>
                    <td>${deptTotal.totalStrength}</td>
                    <td>${deptTotal.present}</td>
                    <td>${deptTotal.absent}</td>
                  </tr>
                `;
              });

              // Add institution total row
              printContent += `
                <tr style="background-color: #d0d0d0; font-weight: bold; font-size: 14px;">
                  <td>Institution Total</td>
                  <td></td>
                  <td>${totalInstitutionStrength}</td>
                  <td>${totalInstitutionPresent}</td>
                  <td>${totalInstitutionAbsences}</td>
                </tr>
              `;
            } else if (reportType === "department") {
              // For department, show classes and department total
              Object.entries(summaryData).forEach(([deptName, classData]) => {
                const deptTotal = classData["__total"];
                const classes = Object.entries(classData)
                  .filter(([key]) => key !== "__total")
                  .sort();

                classes.forEach(([className, classStats]) => {
                  printContent += `
                    <tr>
                      <td>${deptName}</td>
                      <td>${className}</td>
                      <td>${classStats.totalStrength}</td>
                      <td>${classStats.present}</td>
                      <td>${classStats.absent}</td>
                    </tr>
                  `;
                });

                // Add department total row
                printContent += `
                  <tr style="background-color: #e8e8e8; font-weight: bold;">
                    <td>${deptName} Total</td>
                    <td></td>
                    <td>${deptTotal.totalStrength}</td>
                    <td>${deptTotal.present}</td>
                    <td>${deptTotal.absent}</td>
                  </tr>
                `;
              });
            }

            printContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Add page break before data
          printContent += `<div style="page-break-before: always;"></div>`;

          // Now add data sections
          Object.entries(report).forEach(
            ([deptName, absencesByClass], deptIdx) => {
              // Add page break before each department (except first)
              if (deptIdx > 0) {
                printContent += `<div style="page-break-before: always;"></div>`;
              }

              // Check if entire department is holiday
              let deptHolidayReason = null;
              let allDeptHoliday = true;
              Object.entries(absencesByClass).forEach(
                ([className, absences]) => {
                  // Skip metadata keys
                  if (
                    className === "__totalStudents" ||
                    !Array.isArray(absences)
                  )
                    return;

                  absences.forEach((student) => {
                    if (student.isHoliday) {
                      deptHolidayReason = student.reason || deptHolidayReason;
                    } else {
                      allDeptHoliday = false;
                    }
                  });
                },
              );

              if (
                allDeptHoliday &&
                deptHolidayReason &&
                reportType !== "class"
              ) {
                // Department is all holiday
                printContent += `<div style="margin: 40px 0; padding: 30px; background-color: #ffffcc; border-left: 5px solid #ffcc00; border-radius: 4px; font-weight: 500; font-size: 22px; text-align: center;" data-holiday-type="department" data-holiday-reason="${deptHolidayReason}" data-department="${deptName}"><strong>${deptName}: 🔒 Holiday - ${deptHolidayReason}</strong></div>`;
              } else {
                printContent += `<div class="department-wrapper">`;
                printContent += `<div class="department-header">${deptName}</div>`;
                Object.entries(absencesByClass).forEach(
                  ([className, absences]) => {
                    // Skip metadata keys
                    if (
                      className === "__totalStudents" ||
                      !Array.isArray(absences)
                    )
                      return;

                    // Check if this class is all holidays
                    const allClassHolidays = absences.every((s) => s.isHoliday);
                    const holidayEntry = absences.find((s) => s.isHoliday);

                    printContent += `<div class="class-header">Class: ${className}</div>`;
                    if (allClassHolidays && holidayEntry) {
                      printContent += `<div style="padding: 10px; background-color: #ffffcc; border-left: 3px solid #ffcc00; font-size: 16px;" data-holiday-type="class" data-holiday-reason="${holidayEntry.reason}" data-class="${className}">🔒 Holiday - ${holidayEntry.reason}</div>`;
                    } else if (absences.length > 0) {
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
                          <th>Absence Count</th>
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
                        const isHolidayRow = student.rollNo === "HOLIDAY";
                        printContent += `
                      <tr${isHolidayRow ? ' data-type="holiday" data-holiday-reason="' + (student.reason || "") + '"' : ""}>
                        <td>${idx + 1}</td>
                        <td>${student.rollNo}</td>
                        <td>${student.name}</td>
                        <td>${student.residence || ""}</td>
                        <td>${student.reason || ""}</td>
                        <td>${status}</td>
                        <td>${student.absenceCount || 0}</td>
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
                  },
                );
                printContent += `</div>`;
              }
            },
          );
        }
      }

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

      // Wait for images to render before opening print dialog
      setTimeout(() => {
        console.log("Opening print dialog");
        printWindow.print();
      }, 1000);
    } catch (error) {
      alert(
        "Failed to generate report. Please check attendance data and try again.",
      );
    }
  };

  // Export Report to Excel
  const exportToExcel = async () => {
    try {
      // Show lock confirmation modal first
      setLockConfirmAction("export");
      setShowLockConfirmModal(true);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report to Excel. Please try again.");
    }
  };

  // Handle lock confirmation and proceed with export
  const handleLockConfirmAndExport = async () => {
    setShowLockConfirmModal(false);

    try {
      let report;
      let dateStr;

      if (reportDateMode === "range") {
        report = await generateReport(null, reportDateFrom, reportDateTo);
        dateStr = `${new Date(reportDateFrom).toISOString().split("T")[0]}_to_${new Date(reportDateTo).toISOString().split("T")[0]}`;
      } else {
        report = await generateReport(reportDate, null, null);
        dateStr = new Date(reportDate).toISOString().split("T")[0];
      }

      const workbook = XLSX.utils.book_new();
      const worksheets = {};

      // Calculate summary data first
      const summaryData = {};
      let totalAbsences = 0;
      Object.entries(report).forEach(([deptName, classesByName]) => {
        let deptTotal = 0;
        Object.entries(classesByName).forEach(([className, absences]) => {
          const classAbsences = absences.length;
          if (!summaryData[deptName]) {
            summaryData[deptName] = {};
          }
          summaryData[deptName][className] = classAbsences;
          deptTotal += classAbsences;
          totalAbsences += classAbsences;
        });
        summaryData[deptName]["__total"] = deptTotal;
      });

      // Create summary sheet first
      const summaryRows = [["Absence Report Summary"]];
      summaryRows.push(["Generated on", new Date().toLocaleString()]);
      summaryRows.push(["Report Date", dateStr]);
      summaryRows.push(["Report Type", reportType]);
      summaryRows.push([]);

      summaryRows.push(["Department", "Class", "Number of Absentees"]);
      Object.entries(summaryData).forEach(([deptName, classData]) => {
        const deptTotal = classData["__total"];
        const classes = Object.entries(classData)
          .filter(([key]) => key !== "__total")
          .sort();

        // Add all classes with department name on each row
        classes.forEach(([className, count]) => {
          summaryRows.push([deptName, className, count]);
        });

        // Add subtotal row with department name (so it filters with the department)
        summaryRows.push([deptName, "--- Department Total ---", deptTotal]);
        summaryRows.push([]); // Empty row for visual separation
      });

      summaryRows.push(["Institution Total", "", totalAbsences]);

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
      summaryWs["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }];
      // Enable auto-filter on summary sheet (header row at row 6: Department, Class, Number of Absentees)
      summaryWs["!autofilter"] = { ref: "A6:C499" };
      // Add summary sheet first
      XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");

      // Create worksheets for each department
      Object.entries(report).forEach(([deptName, classesByName]) => {
        const rows = [];

        // Add header
        rows.push([
          "Department",
          deptName,
          "",
          "",
          "",
          "",
          new Date().toLocaleDateString(),
        ]);
        rows.push([]); // Empty row

        // Add class data
        Object.entries(classesByName).forEach(([className, absences]) => {
          rows.push([`Class: ${className}`, "", "", "", "", "", ""]);
          rows.push([
            "S No",
            "Roll No",
            "Name",
            "Residence",
            "Absence Reason",
            "Status",
            "Leaves Taken",
          ]);

          if (absences.length > 0) {
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

              rows.push([
                idx + 1,
                student.rollNo,
                student.name,
                student.residence || "",
                student.reason || "",
                status,
                student.leavesTaken || 0,
              ]);
            });
          } else {
            rows.push(["", "", "No absences", "", "", "", ""]);
          }

          rows.push([]); // Empty row between classes
        });

        // Create worksheet from rows
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Set column widths
        ws["!cols"] = [
          { wch: 8 },
          { wch: 12 },
          { wch: 20 },
          { wch: 12 },
          { wch: 20 },
          { wch: 12 },
          { wch: 12 },
        ];

        // Enable auto-filter on first class header row (row 4: S No, Roll No, Name, etc.)
        ws["!autofilter"] = { ref: "A4:G999" };

        // Use sanitized department name for sheet name (Excel has limitations)
        const sheetName = deptName
          .substring(0, 31)
          .replace(/[\/\\?*\[\]]/g, "");
        worksheets[sheetName] = ws;
      });

      // Add all worksheets to workbook (after summary)
      Object.entries(worksheets).forEach(([sheetName, ws]) => {
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      // Write file
      XLSX.writeFile(
        workbook,
        `Attendance-Report-${dateStr}-${new Date().getTime()}.xlsx`,
      );
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report to Excel. Please try again.");
    }
  };

  // Attendance Lock Management Functions
  const toggleAttendanceLock = async () => {
    const dateToCheck = lockDateMode === "specific" ? lockDate : lockDateFrom;
    if (!dateToCheck) {
      alert("Please select a date");
      return;
    }

    if (lockType === "class" && !lockClass) {
      alert("Please select a class");
      return;
    }

    if (
      (lockType === "department" || lockType === "class") &&
      !lockDepartment
    ) {
      alert("Please select a department");
      return;
    }

    if (lockDateMode === "range" && !lockDateTo) {
      alert("Please select an end date for the range");
      return;
    }

    try {
      const res = await apiCall("/api/attendance-lock/bulk-lock", {
        method: "POST",
        body: JSON.stringify({
          lockType: lockType, // "whole", "department", or "class"
          departmentId: lockDepartment?.id || null,
          classId: lockClass?.id || null,
          date: lockDateMode === "specific" ? lockDate : null,
          dateFrom: lockDateMode === "range" ? lockDateFrom : null,
          dateTo: lockDateMode === "range" ? lockDateTo : null,
          isLocked: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Attendance locked successfully for ${data.lockedCount} class(es)!`,
        );
        setLockDate(new Date().toISOString().split("T")[0]);
        fetchLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to lock attendance: " + error.message);
    }
  };

  const toggleAttendanceUnlock = async () => {
    const dateToCheck = lockDateMode === "specific" ? lockDate : lockDateFrom;
    if (!dateToCheck) {
      alert("Please select a date");
      return;
    }

    if (lockType === "class" && !lockClass) {
      alert("Please select a class");
      return;
    }

    if (
      (lockType === "department" || lockType === "class") &&
      !lockDepartment
    ) {
      alert("Please select a department");
      return;
    }

    if (lockDateMode === "range" && !lockDateTo) {
      alert("Please select an end date for the range");
      return;
    }

    if (!confirm("Are you sure you want to unlock attendance for this date?")) {
      return;
    }

    try {
      const res = await apiCall("/api/attendance-lock/bulk-lock", {
        method: "POST",
        body: JSON.stringify({
          lockType: lockType, // "whole", "department", or "class"
          departmentId: lockDepartment?.id || null,
          classId: lockClass?.id || null,
          date: lockDateMode === "specific" ? lockDate : null,
          dateFrom: lockDateMode === "range" ? lockDateFrom : null,
          dateTo: lockDateMode === "range" ? lockDateTo : null,
          isLocked: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Attendance unlocked successfully for ${data.lockedCount} class(es)!`,
        );
        fetchLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to unlock attendance: " + error.message);
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

  // Holiday Lock Management Functions
  const toggleHolidayLock = async () => {
    const dateToCheck =
      holidayLockDateMode === "specific"
        ? holidayLockDate
        : holidayLockDateFrom;
    if (!dateToCheck) {
      alert("Please select a date");
      return;
    }

    if (!holidayLockReason.trim()) {
      alert("Please enter a reason for the holiday");
      return;
    }

    console.log("Holiday Lock - Sending reason:", holidayLockReason);

    // Derive the effective lock type based on what's actually selected
    // This avoids relying on async state updates
    let effectiveLockType = "whole";
    let effectiveDepartmentId = null;
    let effectiveClassId = null;

    if (holidayLockClass) {
      effectiveLockType = "class";
      effectiveClassId = holidayLockClass.id;
      effectiveDepartmentId = holidayLockDepartment?.id || null;
    } else if (holidayLockDepartment) {
      effectiveLockType = "department";
      effectiveDepartmentId = holidayLockDepartment.id;
    }

    if (effectiveLockType === "class" && !effectiveClassId) {
      alert("Please select a class");
      return;
    }

    if (
      (effectiveLockType === "department" || effectiveLockType === "class") &&
      !effectiveDepartmentId
    ) {
      alert("Please select a department");
      return;
    }

    if (holidayLockDateMode === "range" && !holidayLockDateTo) {
      alert("Please select an end date for the range");
      return;
    }

    console.log("Holiday Lock - Effective settings:", {
      lockType: effectiveLockType,
      departmentId: effectiveDepartmentId,
      classId: effectiveClassId,
      reason: holidayLockReason,
      selectedClass: holidayLockClass,
      selectedDept: holidayLockDepartment,
      stateType: holidayLockType,
    });

    try {
      const res = await apiCall("/api/holiday-lock/bulk-lock", {
        method: "POST",
        body: JSON.stringify({
          lockType: effectiveLockType,
          departmentId: effectiveDepartmentId,
          classId: effectiveClassId,
          date: holidayLockDateMode === "specific" ? holidayLockDate : null,
          dateFrom:
            holidayLockDateMode === "range" ? holidayLockDateFrom : null,
          dateTo: holidayLockDateMode === "range" ? holidayLockDateTo : null,
          reason: holidayLockReason,
          action: "lock",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Holiday locked successfully for ${data.affectedClasses} class(es)!`,
        );
        setHolidayLockReason("");
        // Wait a moment for database to sync, then fetch
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchHolidayLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to lock holiday: " + error.message);
    }
  };

  const toggleHolidayUnlock = async () => {
    const dateToCheck =
      holidayLockDateMode === "specific"
        ? holidayLockDate
        : holidayLockDateFrom;
    if (!dateToCheck) {
      alert("Please select a date");
      return;
    }

    // Derive the effective lock type based on what's actually selected
    let effectiveLockType = "whole";
    let effectiveDepartmentId = null;
    let effectiveClassId = null;

    if (holidayLockClass) {
      effectiveLockType = "class";
      effectiveClassId = holidayLockClass.id;
      effectiveDepartmentId = holidayLockDepartment?.id || null;
    } else if (holidayLockDepartment) {
      effectiveLockType = "department";
      effectiveDepartmentId = holidayLockDepartment.id;
    }

    if (effectiveLockType === "class" && !effectiveClassId) {
      alert("Please select a class");
      return;
    }

    if (
      (effectiveLockType === "department" || effectiveLockType === "class") &&
      !effectiveDepartmentId
    ) {
      alert("Please select a department");
      return;
    }

    if (holidayLockDateMode === "range" && !holidayLockDateTo) {
      alert("Please select an end date for the range");
      return;
    }

    if (!confirm("Are you sure you want to unlock this holiday?")) {
      return;
    }

    try {
      const res = await apiCall("/api/holiday-lock/bulk-lock", {
        method: "POST",
        body: JSON.stringify({
          lockType: effectiveLockType,
          departmentId: effectiveDepartmentId,
          classId: effectiveClassId,
          date: holidayLockDateMode === "specific" ? holidayLockDate : null,
          dateFrom:
            holidayLockDateMode === "range" ? holidayLockDateFrom : null,
          dateTo: holidayLockDateMode === "range" ? holidayLockDateTo : null,
          reason: "N/A",
          action: "unlock",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Holiday unlocked successfully for ${data.affectedClasses} class(es)!`,
        );
        fetchHolidayLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to unlock holiday: " + error.message);
    }
  };

  const unlockHoliday = async (classId, date) => {
    if (!confirm("Are you sure you want to unlock this holiday?")) {
      return;
    }

    try {
      const res = await apiCall("/api/holiday-lock", {
        method: "DELETE",
        body: JSON.stringify({ classId, date }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Holiday unlocked successfully!");
        fetchHolidayLockedDates();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Failed to unlock holiday: " + error.message);
    }
  };

  const fetchHolidayLockedDates = async () => {
    try {
      let classesToFetch = [];

      // Determine which classes to fetch locks for based on type
      if (holidayLockType === "whole") {
        // For whole institution, fetch all available classes
        if (holidayLockClasses.length > 0) {
          classesToFetch = holidayLockClasses;
        } else {
          setHolidayLockedDates([]);
          setHolidayLockScopeClasses([]);
          return;
        }
      } else if (holidayLockType === "department") {
        // For department, use the classes already filtered
        if (holidayLockDepartment && holidayLockClasses.length > 0) {
          classesToFetch = holidayLockClasses;
        } else {
          setHolidayLockedDates([]);
          setHolidayLockScopeClasses([]);
          return;
        }
      } else if (holidayLockType === "class") {
        // For class, fetch just that class
        if (holidayLockClass) {
          classesToFetch = [holidayLockClass];
        } else {
          setHolidayLockedDates([]);
          setHolidayLockScopeClasses([]);
          return;
        }
      } else {
        setHolidayLockedDates([]);
        setHolidayLockScopeClasses([]);
        return;
      }

      // Store the classes in the current scope for later comparison
      setHolidayLockScopeClasses(classesToFetch);

      // Fetch locks for all relevant classes
      let allLocks = [];
      for (const cls of classesToFetch) {
        try {
          console.log(
            `Fetching holiday locks for class ${cls.id} (${cls.name})`,
          );
          const res = await apiCall(
            `/api/holiday-lock?classId=${cls.id}&listAll=true`,
          );
          const data = await res.json();
          console.log(
            `Got ${data.locks?.length || 0} locks for class ${cls.id}:`,
            data.locks,
          );
          if (data.success && data.locks) {
            allLocks = allLocks.concat(data.locks);
          }
        } catch (error) {
          console.error(
            `Failed to fetch holiday locks for class ${cls.id}:`,
            error,
          );
        }
      }

      console.log(`Fetched total ${allLocks.length} holiday locks`, allLocks);
      setHolidayLockedDates(allLocks);
    } catch (error) {
      console.error("Failed to fetch holiday locked dates:", error);
      setHolidayLockedDates([]);
      setHolidayLockScopeClasses([]);
    }
  };

  const fetchLockedDates = async () => {
    // Only fetch for class-level locks
    if (lockType !== "class" || !lockClass) {
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

  // Fetch and calculate dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        let startDate, endDate;
        if (dashboardDateMode === "specific") {
          startDate = dashboardDate;
          endDate = dashboardDate;
        } else {
          startDate = dashboardDateFrom;
          endDate = dashboardDateTo;
        }

        // Determine which classes to fetch data for based on type
        let classesToFetch = [];
        if (dashboardType === "whole") {
          // Fetch all classes, optionally filtered by program
          if (dashboardProgram !== "all") {
            // If program is selected, fetch departments for that program fresh from API, then their classes
            const resDepts = await apiCall(
              `/api/departments?program=${dashboardProgram}`,
            );
            const dataDepts = await resDepts.json();
            let relevantDepts = dataDepts.success ? dataDepts.departments : [];

            // Now fetch classes for all relevant departments in parallel
            let allClassesForProgram = [];
            const classPromises = relevantDepts.map((dept) =>
              apiCall(`/api/classes?departmentId=${dept.id}`).then((res) =>
                res.json().then((data) =>
                  data.success
                    ? data.classes.map((c) => ({
                        ...c,
                        departmentId: dept.id,
                        departmentName: dept.name,
                        programName: dashboardProgram,
                      }))
                    : [],
                ),
              ),
            );
            const classResults = await Promise.all(classPromises);
            allClassesForProgram = classResults.flat();
            classesToFetch = allClassesForProgram;
          } else {
            // No program filter - fetch all classes through each program
            const allPrograms = [
              { id: 1, name: "BE" },
              { id: 2, name: "BTech" },
            ];
            let allClassesWithMetadata = [];

            // Fetch departments and classes for each program
            const programPromises = allPrograms.map((prog) =>
              apiCall(`/api/departments?program=${prog.name}`)
                .then((res) => res.json())
                .then((data) => {
                  if (!data.success || !data.departments) return [];
                  const depts = data.departments;

                  // Fetch classes for all departments in this program
                  const classPromises = depts.map((dept) =>
                    apiCall(`/api/classes?departmentId=${dept.id}`)
                      .then((res) => res.json())
                      .then((classData) => {
                        if (!classData.success || !classData.classes) return [];
                        return classData.classes.map((c) => ({
                          ...c,
                          departmentId: dept.id,
                          departmentName: dept.name,
                          programName: prog.name,
                        }));
                      })
                      .catch(() => []),
                  );
                  return Promise.all(classPromises);
                })
                .then((classResults) => classResults.flat())
                .catch(() => []),
            );

            const allResults = await Promise.all(programPromises);
            allClassesWithMetadata = allResults.flat();
            classesToFetch = allClassesWithMetadata;
          }
        } else if (dashboardType === "program" && dashboardProgram !== "all") {
          // Fetch departments for the selected program fresh from API, then their classes
          const resDepts = await apiCall(
            `/api/departments?program=${dashboardProgram}`,
          );
          const dataDepts = await resDepts.json();
          let relevantDepts = dataDepts.success ? dataDepts.departments : [];

          // Now fetch classes for all relevant departments in parallel
          let allClassesForProgram = [];
          const classPromises = relevantDepts.map((dept) =>
            apiCall(`/api/classes?departmentId=${dept.id}`).then((res) =>
              res.json().then((data) =>
                data.success
                  ? data.classes.map((c) => ({
                      ...c,
                      departmentId: dept.id,
                      departmentName: dept.name,
                      programName: dashboardProgram,
                    }))
                  : [],
              ),
            ),
          );
          const classResults = await Promise.all(classPromises);
          allClassesForProgram = classResults.flat();
          classesToFetch = allClassesForProgram;
        } else if (dashboardType === "department" && dashboardDepartment) {
          // Fetch classes for the selected department
          const res = await apiCall(
            `/api/classes?departmentId=${dashboardDepartment.id}`,
          );
          const data = await res.json();
          if (data.success) {
            classesToFetch = data.classes.map((c) => ({
              ...c,
              departmentId: dashboardDepartment.id,
              departmentName: dashboardDepartment.name,
              programName: dashboardProgram,
            }));
          }
        } else if (dashboardType === "class" && dashboardClass) {
          classesToFetch = [
            {
              ...dashboardClass,
              departmentId: dashboardClass.departmentId,
              departmentName: dashboardDepartment?.name || "Unknown",
              programName: dashboardProgram,
            },
          ];
        }

        // Build a set of Sundays ONLY (applies to all classes)
        const sundayDates = new Set();
        if (dashboardDateMode === "range") {
          const [startYear, startMonth, startDay] = startDate
            .split("-")
            .map(Number);
          const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
          const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
          const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

          let current = new Date(start);
          while (current <= end) {
            // Check if it's a Sunday (0 = Sunday in JavaScript)
            if (current.getUTCDay() === 0) {
              const sundayStr = current.toISOString().split("T")[0];
              sundayDates.add(sundayStr);
            }
            current.setDate(current.getDate() + 1);
          }
        } else if (dashboardDateMode === "specific") {
          // For specific date, check if it's a Sunday
          const [year, month, day] = dashboardDate.split("-").map(Number);
          const dateObj = new Date(Date.UTC(year, month - 1, day));
          if (dateObj.getUTCDay() === 0) {
            sundayDates.add(dashboardDate);
          }
        }

        // Fetch all students and attendance data
        let totalStudents = new Set();
        let studentsFromClassesOnHoliday = new Set(); // Track students whose class is on holiday
        let totalAbsent = 0;
        let totalPresent = 0;
        let totalPresentSum = 0; // For accumulating across all classes
        let totalAbsentSum = 0; // For accumulating across all classes
        let studentsNotOnHoliday = 0; // For specific date mode OR TR (Total Records) for date range
        let dayCount = 0; // Number of days in range (pre-calculated)
        const distinctDaysSet = new Set(); // Track distinct class days for date range mode
        const globalDailyStats = {}; // Accumulate daily stats from all classes

        // Calculate number of working days (excluding Sundays ONLY, not class-specific holidays)
        if (dashboardDateMode === "range") {
          const [startYear, startMonth, startDay] = startDate
            .split("-")
            .map(Number);
          const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
          const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
          const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

          let workingDays = 0;
          const current = new Date(start);
          while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            // Only exclude Sundays for institution-wide day count
            if (!sundayDates.has(dateStr)) {
              workingDays++;
            }
            current.setDate(current.getDate() + 1);
          }
          dayCount = workingDays;
        }

        // Initialize breakdown data structures
        const breakdownMap = {}; // Map to track students per parent entity
        const breakdownPresentMap = {}; // Map to track present count per parent entity
        const globalHolidayDates = new Set(); // Track all holiday dates

        for (const classItem of classesToFetch) {
          // Fetch students
          const resStudents = await apiCall(
            `/api/students?classId=${classItem.id}`,
          );
          const dataStudents = await resStudents.json();
          const students = dataStudents.success ? dataStudents.students : [];

          // Fetch class-specific holidays
          const classHolidayDates = new Set(sundayDates); // Start with Sundays
          try {
            const resHolidays = await apiCall(
              `/api/holiday-lock?classId=${classItem.id}&listAll=true`,
            );
            const dataHolidays = await resHolidays.json();
            if (dataHolidays.success && dataHolidays.locks) {
              dataHolidays.locks.forEach((lock) => {
                const lockDateStr = lock.date;
                const startDateStr = startDate;
                const endDateStr = endDate;
                if (lockDateStr >= startDateStr && lockDateStr <= endDateStr) {
                  classHolidayDates.add(lockDateStr);
                }
              });
            }
          } catch (error) {
            console.error(
              "Failed to fetch holidays for class:",
              classItem.id,
              error,
            );
          }

          // Fetch attendance
          const resAttendance = await apiCall(
            `/api/attendance?classId=${classItem.id}&from=${startDate}&to=${endDate}`,
          );
          const dataAttendance = await resAttendance.json();
          const attendanceRecords = dataAttendance.success
            ? dataAttendance.attendanceRecords
            : [];

          // Determine parent entity key for breakdown based on dashboardType and selection
          let parentKey;
          if (dashboardType === "whole") {
            // If specific program selected, drill down to departments; otherwise show programs
            if (dashboardProgram !== "all") {
              parentKey = classItem.departmentName || "Unknown";
            } else {
              parentKey = classItem.programName || "Unknown";
            }
          } else if (dashboardType === "program") {
            parentKey = classItem.departmentName || "Unknown";
          } else if (dashboardType === "department") {
            parentKey = classItem.name; // Class name
          } else if (dashboardType === "class") {
            parentKey = classItem.name; // Single class
          }

          // Initialize breakdown maps for this parent if not already exists
          if (!breakdownMap[parentKey]) {
            breakdownMap[parentKey] = new Set();
            breakdownPresentMap[parentKey] = new Set();
          }

          // Add students to breakdown tracking
          students.forEach((s) => breakdownMap[parentKey].add(s.id));

          // Track holiday dates globally
          classHolidayDates.forEach((date) => globalHolidayDates.add(date));

          if (dashboardDateMode === "specific") {
            // For specific date:
            // Total Students = students from classes operating on this date (NOT on holiday)
            // Present/Absent = only those with attendance records
            // Attendance % = Present / (Total - Holiday Students) * 100

            // Only add students from this class if it's NOT on holiday
            if (!classHolidayDates.has(dashboardDate)) {
              students.forEach((s) => totalStudents.add(s.id));
            } else {
              // Track students from classes on holiday
              students.forEach((s) => studentsFromClassesOnHoliday.add(s.id));
            }

            // Count students with attendance records on this date (not on holiday)
            const studentsWithRecords = new Set();
            attendanceRecords.forEach((record) => {
              studentsWithRecords.add(record.studentId);
              if (record.status === "absent") {
                totalAbsent++;
              } else if (record.status === "present") {
                totalPresent++;
                // Track present students for breakdown
                breakdownPresentMap[parentKey].add(record.studentId);
              }
            });

            // Calculate number of students not on holiday for this specific date
            const classStudentsNotOnHoliday = studentsWithRecords.size;
            studentsNotOnHoliday += classStudentsNotOnHoliday;
          } else {
            // For date range: accumulate daily stats from all classes
            students.forEach((s) => totalStudents.add(s.id));

            // Accumulate this class's attendance into global daily stats
            attendanceRecords.forEach((record) => {
              const dateKey = record.date;
              // Skip this class's holiday dates (including Sundays)
              if (classHolidayDates.has(dateKey)) {
                return;
              }

              if (!globalDailyStats[dateKey]) {
                globalDailyStats[dateKey] = { present: 0, absent: 0 };
                distinctDaysSet.add(dateKey);
              }

              if (record.status === "absent") {
                globalDailyStats[dateKey].absent++;
              } else if (record.status === "present") {
                globalDailyStats[dateKey].present++;
                // Track present students for breakdown
                breakdownPresentMap[parentKey].add(record.studentId);
              }
            });

            // Track total records for percentage
            studentsNotOnHoliday += attendanceRecords.filter(
              (r) => !classHolidayDates.has(r.date),
            ).length;
          }
        }

        // Calculate final stats for date range
        if (dashboardDateMode === "range") {
          const dailyValues = Object.values(globalDailyStats);
          if (dailyValues.length > 0) {
            // Sum all daily present/absent counts
            const totalPresentRecords = dailyValues.reduce(
              (sum, day) => sum + day.present,
              0,
            );
            const totalAbsentRecords = dailyValues.reduce(
              (sum, day) => sum + day.absent,
              0,
            );
            // Divide by number of distinct days to get average per day
            totalPresentSum = totalPresentRecords / dailyValues.length;
            totalAbsentSum = totalAbsentRecords / dailyValues.length;

            // Store total records for percentage calculation
            studentsNotOnHoliday = totalPresentRecords + totalAbsentRecords;
          }
        }

        // Build breakdown data for bar chart
        const breakdownData = Object.entries(breakdownMap).map(
          ([parentName, studentSet]) => ({
            name: parentName,
            total: studentSet.size,
            present: breakdownPresentMap[parentName]?.size || 0,
          }),
        );

        // Sort breakdown data for consistent display
        breakdownData.sort((a, b) => a.name.localeCompare(b.name));

        // Calculate holiday data for pie chart - use stats calculated above
        // For date range: use avgPresent, avgAbsent
        // For specific date: use present, absent
        // Holiday count: based on studentsFromClassesOnHoliday
        const pieChartData = {
          presentDays:
            dashboardDateMode === "range"
              ? Math.round(totalPresentSum)
              : totalPresent,
          absentDays:
            dashboardDateMode === "range"
              ? Math.round(totalAbsentSum)
              : totalAbsent,
          holidayDays:
            studentsFromClassesOnHoliday.size > 0
              ? studentsFromClassesOnHoliday.size
              : 0,
        };

        // Calculate final stats
        let avgAttendancePercent = 0;
        if (dashboardDateMode === "range" && studentsNotOnHoliday > 0) {
          // Avg Attendance % = (Total Present / Total Records) × 100
          // We need to calculate from the actual totals, not the averages
          const dailyValues = Object.values(globalDailyStats);
          if (dailyValues.length > 0) {
            const totalPresentRecords = dailyValues.reduce(
              (sum, day) => sum + day.present,
              0,
            );
            const totalAbsentRecords = dailyValues.reduce(
              (sum, day) => sum + day.absent,
              0,
            );
            const totalRecords = totalPresentRecords + totalAbsentRecords;
            if (totalRecords > 0) {
              avgAttendancePercent = (totalPresentRecords / totalRecords) * 100;
            }
          }
        }

        const newStats = {
          totalStudents: totalStudents.size,
          studentsFromClassesOnHoliday: studentsFromClassesOnHoliday.size,
          present: totalPresent,
          absent: totalAbsent,
          studentsNotOnHoliday: studentsNotOnHoliday,
          avgPresent: totalPresentSum, // Already calculated as average per day
          avgAbsent: totalAbsentSum, // Already calculated as average per day
          avgAttendancePercent: avgAttendancePercent,
        };

        setDashboardStats(newStats);
        setDashboardBreakdownData(breakdownData);
        setDashboardHolidayData(pieChartData);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, [
    dashboardDateMode,
    dashboardDate,
    dashboardDateFrom,
    dashboardDateTo,
    dashboardType,
    dashboardProgram,
    dashboardDepartment,
    dashboardClass,
    classes,
    departments,
  ]);

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
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
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

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="admin-section">
            <h2>Dashboard</h2>

            {/* Date Selection */}
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "20px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <select
                value={dashboardDateMode}
                onChange={(e) => setDashboardDateMode(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  minWidth: "150px",
                }}
              >
                <option value="range">Date Range</option>
                <option value="specific">Specific Date</option>
              </select>

              {dashboardDateMode === "range" && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flex: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <label style={{ fontWeight: "500", minWidth: "60px" }}>
                      From:
                    </label>
                    <input
                      type="date"
                      value={dashboardDateFrom}
                      onChange={(e) =>
                        handleDashboardDateFromChange(e.target.value)
                      }
                      max={getTodayDate()}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        width: "180px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <label style={{ fontWeight: "500", minWidth: "40px" }}>
                      To:
                    </label>
                    <input
                      type="date"
                      value={dashboardDateTo}
                      onChange={(e) =>
                        handleDashboardDateToChange(e.target.value)
                      }
                      max={getTodayDate()}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        width: "180px",
                      }}
                    />
                  </div>
                </div>
              )}

              {dashboardDateMode === "specific" && (
                <input
                  type="date"
                  value={dashboardDate}
                  onChange={(e) => handleDashboardDateChange(e.target.value)}
                  max={getTodayDate()}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    width: "180px",
                  }}
                />
              )}
            </div>

            {/* Hierarchy Selection */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {/* Type Selector */}
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
                  value={dashboardType}
                  onChange={(e) => {
                    setDashboardType(e.target.value);
                    setDashboardDepartment(null);
                    setDashboardClass(null);
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

              {/* Program Selector */}
              <div>
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
                  value={dashboardProgram}
                  onChange={(e) => {
                    setDashboardProgram(e.target.value);
                    setDashboardDepartment(null);
                    setDashboardClass(null);
                  }}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    width: "100%",
                  }}
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.name}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter - shows for department and class types */}
              {(dashboardType === "department" ||
                dashboardType === "class") && (
                <div>
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
                    value={dashboardDepartment?.id || ""}
                    onChange={(e) => {
                      const dept = dashboardDepartments.find(
                        (d) => d.id === parseInt(e.target.value),
                      );
                      setDashboardDepartment(dept || null);
                      if (dashboardType === "class") {
                        setDashboardClass(null);
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
                    {dashboardDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Filter - only shows when type is class and department is selected */}
              {dashboardType === "class" && dashboardDepartment && (
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
                    value={dashboardClass?.id || ""}
                    onChange={(e) => {
                      const cls = dashboardClasses.find(
                        (c) => c.id === parseInt(e.target.value),
                      );
                      setDashboardClass(cls || null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="">-- Select Class --</option>
                    {dashboardClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="dashboard-stats">
              {dashboardDateMode === "specific" ? (
                <>
                  <div className="stat-card">
                    <h3>Total Student</h3>
                    <p className="stat-number">
                      {dashboardStats.studentsFromClassesOnHoliday === 0
                        ? dashboardStats.totalStudents
                        : dashboardStats.totalStudents === 0
                          ? 0
                          : `${dashboardStats.totalStudents} + ${dashboardStats.studentsFromClassesOnHoliday}`}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Present</h3>
                    <p className="stat-number">{dashboardStats.present}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Absent</h3>
                    <p className="stat-number">{dashboardStats.absent}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Attendance %</h3>
                    <p className="stat-number">
                      {dashboardStats.studentsNotOnHoliday > 0
                        ? (
                            (dashboardStats.present /
                              dashboardStats.studentsNotOnHoliday) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-card">
                    <h3>Total Student</h3>
                    <p className="stat-number">
                      {dashboardStats.totalStudents}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Avg Present</h3>
                    <p className="stat-number">
                      {dashboardStats.avgPresent.toFixed(2)}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Avg Absent</h3>
                    <p className="stat-number">
                      {dashboardStats.avgAbsent.toFixed(2)}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Avg Attendance %</h3>
                    <p className="stat-number">
                      {(dashboardStats.avgAttendancePercent || 0).toFixed(2)}%
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Charts Section */}
            <div
              style={{
                display: "flex",
                gap: "30px",
                marginTop: "30px",
                justifyContent: "space-between",
              }}
            >
              <DashboardBarChart
                breakdownData={dashboardBreakdownData}
                cardTotalStudents={dashboardStats.totalStudents}
              />
              <DashboardPieChart
                presentDays={dashboardHolidayData.presentDays}
                absentDays={dashboardHolidayData.absentDays}
                holidayDays={dashboardHolidayData.holidayDays}
                totalStudents={dashboardStats.totalStudents}
                showTotalStudents={dashboardDateMode === "range"}
              />
            </div>
          </div>
        )}

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
                    <div>Action</div>
                  </div>
                  {sortByMatchPosition(
                    teachers.filter((teacher) => {
                      const search = teacherSearch.toLowerCase();
                      return (
                        teacher.name.toLowerCase().includes(search) ||
                        String(teacher.mobile || "")
                          .toLowerCase()
                          .includes(search)
                      );
                    }),
                    teacherSearch,
                    ["name", "mobile"],
                  ).map((teacher, idx) => (
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
                        <div>
                          <button
                            onClick={() => openTeacherModal(teacher)}
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
                            title="Edit Teacher"
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
                                      ({assignment.course.courseCode}) - Class:{" "}
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
                  <div className="form-group" style={{ position: "relative" }}>
                    <label>Teacher Name</label>
                    <input
                      type="text"
                      value={changePasswordTeacherInput || ""}
                      onChange={(e) => {
                        setChangePasswordTeacherInput(e.target.value);
                        setShowTeacherDropdown(true);
                      }}
                      onFocus={() => setShowTeacherDropdown(true)}
                      onBlur={() => {
                        // Close dropdown after a small delay to allow click selection
                        setTimeout(() => setShowTeacherDropdown(false), 200);
                      }}
                      placeholder="Type teacher name..."
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        width: "100%",
                      }}
                    />
                    {showTeacherDropdown && changePasswordTeacherInput && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: "white",
                          border: "1px solid #ddd",
                          borderTop: "none",
                          borderRadius: "0 0 4px 4px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 1000,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        {sortByMatchPosition(
                          teachers.filter(
                            (teacher) =>
                              teacher.name
                                .toLowerCase()
                                .includes(
                                  changePasswordTeacherInput.toLowerCase(),
                                ) ||
                              String(teacher.mobile || "")
                                .toLowerCase()
                                .includes(
                                  changePasswordTeacherInput.toLowerCase(),
                                ),
                          ),
                          changePasswordTeacherInput,
                          ["name", "mobile"],
                        ).map((teacher) => (
                          <div
                            key={teacher.id}
                            onClick={() => {
                              setChangePasswordMobile(teacher.mobile);
                              setChangePasswordTeacherInput(teacher.name);
                              setShowTeacherDropdown(false);
                            }}
                            style={{
                              padding: "10px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #eee",
                              hover: { backgroundColor: "#f5f5f5" },
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.backgroundColor = "#f5f5f5")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.backgroundColor = "white")
                            }
                          >
                            <strong>{teacher.name}</strong>
                            <span style={{ marginLeft: "8px", color: "#666" }}>
                              ({teacher.mobile})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
                      {sortByMatchPosition(
                        teachers.filter((teacher) =>
                          teacher.name
                            .toLowerCase()
                            .includes(selectedTeacherToRemove.toLowerCase()),
                        ),
                        selectedTeacherToRemove,
                        ["name"],
                      ).map((teacher) => (
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

            {/* Teacher Modal */}
            {showTeacherModal && modalTeacher && (
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
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "30px",
                    borderRadius: "8px",
                    width: "90%",
                    maxWidth: "500px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3 style={{ marginBottom: "20px" }}>Edit Teacher</h3>

                  <div className="form-group" style={{ marginBottom: "15px" }}>
                    <label>Teacher Name</label>
                    <input
                      type="text"
                      value={modalTeacher.name}
                      onChange={(e) =>
                        setModalTeacher({
                          ...modalTeacher,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter teacher name"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      value={modalTeacher.mobile}
                      onChange={(e) =>
                        setModalTeacher({
                          ...modalTeacher,
                          mobile: e.target.value,
                        })
                      }
                      placeholder="Enter mobile number"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowTeacherModal(false);
                        setModalTeacher(null);
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#f0f0f0",
                        color: "#333",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteModalTeacher}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={saveModalTeacher}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "report" && (
          <div className="admin-section">
            <h2>Absence Report</h2>

            {/* Report Filters */}
            <div className="filter-section" style={{ marginBottom: "20px" }}>
              {/* Date Picker - First Row */}
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Select Date:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <select
                    value={reportDateMode}
                    onChange={(e) => setReportDateMode(e.target.value)}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      minWidth: "150px",
                    }}
                  >
                    <option value="range">Date Range</option>
                    <option value="specific">Specific Date</option>
                  </select>

                  {reportDateMode === "range" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flex: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <label style={{ fontWeight: "500", minWidth: "60px" }}>
                          From:
                        </label>
                        <input
                          type="date"
                          value={reportDateFrom}
                          onChange={(e) =>
                            handleReportDateFromChange(e.target.value)
                          }
                          max={getTodayDate()}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "180px",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <label style={{ fontWeight: "500", minWidth: "40px" }}>
                          To:
                        </label>
                        <input
                          type="date"
                          value={reportDateTo}
                          onChange={(e) =>
                            handleReportDateToChange(e.target.value)
                          }
                          max={getTodayDate()}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "180px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {reportDateMode === "specific" && (
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => handleReportDateChange(e.target.value)}
                      max={getTodayDate()}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        width: "180px",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Other Filters - Grid Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
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

                {/* Program Selector */}
                <div>
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
                      width: "100%",
                    }}
                  >
                    <option value="all">All Programs</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.name}>
                        {prog.name}
                      </option>
                    ))}
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

                {/* Residence Filter */}
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Residence:
                  </label>
                  <select
                    value={reportResidence}
                    onChange={(e) => setReportResidence(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="all">All</option>
                    <option value="H">Hosteller (H)</option>
                    <option value="D">Day Scholar (D)</option>
                    <option value="OSS">Outside Stayer (OSS)</option>
                  </select>
                </div>

                {/* Informed Status Filter */}
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Informed Status:
                  </label>
                  <select
                    value={reportInformedStatus}
                    onChange={(e) => setReportInformedStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <option value="all">All</option>
                    <option value="informed">Informed</option>
                    <option value="not-informed">Not Informed</option>
                  </select>
                </div>
              </div>

              {/* Print and Export Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={printReport}
                  className="export-btn"
                  style={{ minWidth: "140px" }}
                >
                  Print Report
                </button>
                <button
                  onClick={exportToExcel}
                  className="export-btn"
                  style={{ backgroundColor: "#27ae60" }}
                >
                  📊 Export to Excel
                </button>
              </div>
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
                    {Object.entries(classesByName)
                      .filter(([className]) => className !== "__totalStudents")
                      .map(([className, absences]) => (
                        <div key={className} className="report-class">
                          <div className="report-class-title">
                            Class: {className} | Total Absences:{" "}
                            {Array.isArray(absences) ? absences.length : 0}
                          </div>
                          {Array.isArray(absences) && absences.length > 0 ? (
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
                      ))}
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

            {/* Sub-tabs for Attendance and Holiday Locks */}
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
                onClick={() => setLockManagementSubTab("attendance")}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    lockManagementSubTab === "attendance"
                      ? "#007bff"
                      : "#f0f0f0",
                  color:
                    lockManagementSubTab === "attendance" ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Attendance Lock
              </button>
              <button
                onClick={() => setLockManagementSubTab("holiday")}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    lockManagementSubTab === "holiday" ? "#007bff" : "#f0f0f0",
                  color: lockManagementSubTab === "holiday" ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Holiday Lock
              </button>
            </div>

            {lockManagementSubTab === "attendance" && (
              <>
                {/* Grid Layout for Selectors */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Lock Type Selector */}
                  <div>
                    <label
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Lock Scope:
                    </label>
                    <select
                      value={lockType}
                      onChange={(e) => {
                        setLockType(e.target.value);
                        setLockDepartment(null);
                        setLockClass(null);
                      }}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        width: "100%",
                      }}
                    >
                      <option value="whole">Whole Institution</option>
                      <option value="department">By Department</option>
                      <option value="class">By Class</option>
                    </select>
                  </div>

                  {/* Program Selector */}
                  <div>
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
                      value={lockProgram || "all"}
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
                      }}
                    >
                      <option value="all">All Programs</option>
                      {programs.map((prog) => (
                        <option key={prog.id} value={prog.name}>
                          {prog.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Selector - shows for department and class types */}
                  {(lockType === "department" || lockType === "class") &&
                    lockProgram && (
                      <div>
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
                            if (lockType === "class") {
                              setLockClass(null);
                            }
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "100%",
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

                  {/* Class Selector - only shows when type is class and department is selected */}
                  {lockType === "class" && lockDepartment && (
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
                </div>

                {/* Date Selector and Lock Controls */}
                {(lockType === "whole" ||
                  (lockProgram &&
                    ((lockType === "department" && lockDepartment) ||
                      (lockType === "class" && lockClass)))) && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "5px",
                        }}
                      >
                        Select Date:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <select
                          value={lockDateMode}
                          onChange={(e) => setLockDateMode(e.target.value)}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            minWidth: "150px",
                          }}
                        >
                          <option value="range">Date Range</option>
                          <option value="specific">Specific Date</option>
                        </select>

                        {lockDateMode === "range" && (
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                              flex: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <label
                                style={{ fontWeight: "500", minWidth: "60px" }}
                              >
                                From:
                              </label>
                              <input
                                type="date"
                                value={lockDateFrom}
                                onChange={(e) =>
                                  setLockDateFrom(e.target.value)
                                }
                                style={{
                                  padding: "8px",
                                  borderRadius: "4px",
                                  border: "1px solid #ddd",
                                  width: "180px",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <label
                                style={{ fontWeight: "500", minWidth: "40px" }}
                              >
                                To:
                              </label>
                              <input
                                type="date"
                                value={lockDateTo}
                                onChange={(e) => setLockDateTo(e.target.value)}
                                style={{
                                  padding: "8px",
                                  borderRadius: "4px",
                                  border: "1px solid #ddd",
                                  width: "180px",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {lockDateMode === "specific" && (
                          <input
                            type="date"
                            value={lockDate}
                            onChange={(e) => setLockDate(e.target.value)}
                            style={{
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              width: "180px",
                            }}
                          />
                        )}
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
                          cursor: isCurrentDateLocked
                            ? "not-allowed"
                            : "pointer",
                          opacity: isCurrentDateLocked ? 0.6 : 1,
                        }}
                      >
                        {isCurrentDateLocked
                          ? `✓ ${lockType === "whole" ? "Institution" : lockType === "department" ? "Department" : "Class"} Locked`
                          : `Lock ${lockType === "whole" ? "Institution" : lockType === "department" ? "Department" : "Class"}`}
                      </button>
                      <button
                        onClick={() => toggleAttendanceUnlock()}
                        disabled={!isCurrentDateLocked}
                        className="export-btn"
                        style={{
                          backgroundColor: !isCurrentDateLocked
                            ? "#bdc3c7"
                            : "#e74c3c",
                          cursor: !isCurrentDateLocked
                            ? "not-allowed"
                            : "pointer",
                          opacity: !isCurrentDateLocked ? 0.6 : 1,
                        }}
                      >
                        Unlock{" "}
                        {lockType === "whole"
                          ? "Institution"
                          : lockType === "department"
                            ? "Department"
                            : "Class"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "attendance-lock" &&
              lockManagementSubTab === "holiday" && (
                <>
                  <h2>Holiday Lock Management</h2>

                  {/* Select Date - Full Width Row - MOVED TO TOP */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "20px",
                      padding: "15px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <label
                      style={{
                        fontWeight: "bold",
                        minWidth: "120px",
                      }}
                    >
                      Select Date:
                    </label>
                    <select
                      value={holidayLockDateMode}
                      onChange={(e) => setHolidayLockDateMode(e.target.value)}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        minWidth: "150px",
                      }}
                    >
                      <option value="range">Date Range</option>
                      <option value="specific">Specific Date</option>
                    </select>

                    {holidayLockDateMode === "range" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flex: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <label
                            style={{ fontWeight: "500", minWidth: "60px" }}
                          >
                            From:
                          </label>
                          <input
                            type="date"
                            value={holidayLockDateFrom}
                            onChange={(e) =>
                              setHolidayLockDateFrom(e.target.value)
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              width: "180px",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <label
                            style={{ fontWeight: "500", minWidth: "40px" }}
                          >
                            To:
                          </label>
                          <input
                            type="date"
                            value={holidayLockDateTo}
                            onChange={(e) =>
                              setHolidayLockDateTo(e.target.value)
                            }
                            style={{
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              width: "180px",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {holidayLockDateMode === "specific" && (
                      <input
                        type="date"
                        value={holidayLockDate}
                        onChange={(e) => setHolidayLockDate(e.target.value)}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          width: "180px",
                        }}
                      />
                    )}
                  </div>

                  {/* Grid Layout for Selectors */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    {/* Lock Type Selector */}
                    <div>
                      <label
                        style={{
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "5px",
                        }}
                      >
                        Lock Scope:
                      </label>
                      <select
                        value={holidayLockType}
                        onChange={(e) => {
                          setHolidayLockType(e.target.value);
                          setHolidayLockDepartment(null);
                          setHolidayLockClass(null);
                        }}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          width: "100%",
                        }}
                      >
                        <option value="whole">Whole Institution</option>
                        <option value="department">By Department</option>
                        <option value="class">By Class</option>
                      </select>
                    </div>

                    {/* Program Selector */}
                    <div>
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
                        value={holidayLockProgram || "all"}
                        onChange={(e) => {
                          setHolidayLockProgram(e.target.value);
                          setHolidayLockDepartment(null);
                          setHolidayLockClass(null);
                        }}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          width: "100%",
                        }}
                      >
                        <option value="all">All Programs</option>
                        {programs.map((prog) => (
                          <option key={prog.id} value={prog.name}>
                            {prog.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department Selector */}
                    {(holidayLockType === "department" ||
                      holidayLockType === "class") && (
                      <div>
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
                          value={holidayLockDepartment?.id || ""}
                          onChange={(e) => {
                            const dept = holidayLockDepartments.find(
                              (d) => d.id === parseInt(e.target.value),
                            );
                            setHolidayLockDepartment(dept || null);
                            if (dept && holidayLockType !== "class") {
                              // Auto-set to department if a department is selected
                              setHolidayLockType("department");
                            }
                            if (holidayLockType === "class") {
                              setHolidayLockClass(null);
                            }
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "100%",
                          }}
                        >
                          <option value="">-- Select Department --</option>
                          {holidayLockDepartments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Class Selector - Only show when class lock type is selected */}
                    {holidayLockType === "class" && holidayLockDepartment && (
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
                          value={holidayLockClass?.id || ""}
                          onChange={(e) => {
                            const cls = holidayLockClasses.find(
                              (c) => c.id === parseInt(e.target.value),
                            );
                            if (cls) {
                              setHolidayLockClass(cls);
                            } else {
                              setHolidayLockClass(null);
                            }
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "100%",
                          }}
                        >
                          <option value="">-- Select Class --</option>
                          {holidayLockClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Reason Input */}
                    <div
                      style={{
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label
                        style={{
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "5px",
                        }}
                      >
                        Reason for Holiday:
                      </label>
                      {isCurrentHolidayDateLocked ? (
                        <div
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            backgroundColor: "#f5f5f5",
                            width: "100%",
                          }}
                        >
                          {(() => {
                            const dateToCheck =
                              holidayLockDateMode === "specific"
                                ? holidayLockDate
                                : holidayLockDateFrom;
                            const lockedReason = holidayLockedDates.find(
                              (lock) => {
                                const lockDate = new Date(lock.date)
                                  .toISOString()
                                  .split("T")[0];
                                return lockDate === dateToCheck;
                              },
                            )?.reason;
                            return (
                              <p style={{ margin: 0 }}>
                                {lockedReason || "No reason provided"}
                              </p>
                            );
                          })()}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={holidayLockReason}
                          onChange={(e) => {
                            console.log(
                              "Reason field changed to:",
                              e.target.value,
                            );
                            setHolidayLockReason(e.target.value);
                          }}
                          placeholder="e.g., National Holiday, Festival"
                          maxLength="200"
                          style={{
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            width: "100%",
                          }}
                        />
                      )}
                    </div>

                    {/* Lock/Unlock Buttons - Removed, now at top */}
                  </div>

                  {/* Action Buttons Row - MOVED TO BOTTOM */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "30px",
                      marginBottom: "30px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => toggleHolidayLock()}
                      disabled={isCurrentHolidayDateLocked}
                      className="export-btn"
                      style={{
                        backgroundColor: isCurrentHolidayDateLocked
                          ? "#bdc3c7"
                          : "#e74c3c",
                        cursor: isCurrentHolidayDateLocked
                          ? "not-allowed"
                          : "pointer",
                        opacity: isCurrentHolidayDateLocked ? 0.6 : 1,
                      }}
                    >
                      {isCurrentHolidayDateLocked
                        ? "✓ Already Locked"
                        : "🔒 Lock Holiday"}
                    </button>
                    <button
                      onClick={() => toggleHolidayUnlock()}
                      disabled={false}
                      className="export-btn"
                      style={{
                        backgroundColor: "#27ae60",
                        cursor: "pointer",
                        opacity: 1,
                      }}
                    >
                      🔓 Unlock Holiday
                    </button>
                  </div>

                  {/* View Existing Holiday Locks */}
                  {((holidayLockType === "class" && holidayLockClass) ||
                    (holidayLockType === "department" &&
                      holidayLockDepartment) ||
                    holidayLockType === "whole") && (
                    <div style={{ marginTop: "30px" }}>
                      <h3>Existing Holiday Locks</h3>
                      {holidayLockedDates.length > 0 ? (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "15px",
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: "#ecf0f1" }}>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  borderBottom: "2px solid #bdc3c7",
                                }}
                              >
                                Date
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  borderBottom: "2px solid #bdc3c7",
                                }}
                              >
                                Reason
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  borderBottom: "2px solid #bdc3c7",
                                }}
                              >
                                Locked By
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  borderBottom: "2px solid #bdc3c7",
                                }}
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {holidayLockedDates
                              .filter((lock) => {
                                // Filter out Sundays (reason === "Sunday")
                                return lock.reason !== "Sunday";
                              })
                              .map((lock) => (
                                <tr
                                  key={`${lock.classId}_${lock.date}`}
                                  style={{ borderBottom: "1px solid #ecf0f1" }}
                                >
                                  <td style={{ padding: "10px" }}>
                                    {lock.date}
                                  </td>
                                  <td style={{ padding: "10px" }}>
                                    {lock.reason}
                                  </td>
                                  <td style={{ padding: "10px" }}>
                                    {lock.lockedBy}
                                  </td>
                                  <td
                                    style={{
                                      padding: "10px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        unlockHoliday(lock.classId, lock.date)
                                      }
                                      style={{
                                        padding: "5px 10px",
                                        backgroundColor: "#e74c3c",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                      }}
                                    >
                                      Unlock
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ color: "#7f8c8d", marginTop: "15px" }}>
                          No holiday locks for{" "}
                          {holidayLockType === "whole"
                            ? "the whole institution"
                            : holidayLockType === "department"
                              ? "this department"
                              : "this class"}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
          </div>
        )}

        {/* Modal for lock confirmation */}
        {showLockConfirmModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
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
              }}
            >
              <h2
                style={{ marginTop: 0, color: "#3498db", marginBottom: "20px" }}
              >
                🔒 Lock Attendance
              </h2>
              <p
                style={{
                  color: "#666",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                Do you want to lock attendance for{" "}
                <strong>
                  {reportType === "whole"
                    ? "the Whole Institution"
                    : reportType === "department"
                      ? `Department: ${reportDepartment?.name || "Selected Department"}`
                      : `Class: ${reportClass?.name || "Selected Class"}`}
                </strong>{" "}
                before{" "}
                {lockConfirmAction === "print" ? "printing" : "exporting"} the
                report?
              </p>
              <p
                style={{
                  color: "#999",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                Locking will prevent further modifications to attendance records
                for the selected date.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setShowLockConfirmModal(false);
                    // Proceed without locking
                    if (lockConfirmAction === "print") {
                      handleLockConfirmAndPrint();
                    } else {
                      handleLockConfirmAndExport();
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #bdc3c7",
                    borderRadius: "4px",
                    backgroundColor: "#ecf0f1",
                    color: "#333",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Skip & Continue
                </button>
                <button
                  onClick={async () => {
                    // Lock attendance first
                    const dateToLock =
                      reportDateMode === "range" ? reportDateFrom : reportDate;
                    try {
                      const res = await apiCall(
                        "/api/attendance-lock/bulk-lock",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            lockType: reportType,
                            departmentId: reportDepartment?.id || null,
                            classId: reportClass?.id || null,
                            date: dateToLock,
                            isLocked: true,
                          }),
                        },
                      );
                      const data = await res.json();
                      if (data.success) {
                        alert(
                          `Attendance locked successfully for ${data.lockedCount} class(es)!`,
                        );
                      }
                    } catch (error) {
                      console.error("Failed to lock attendance:", error);
                    }

                    // Then proceed with the action
                    if (lockConfirmAction === "print") {
                      handleLockConfirmAndPrint();
                    } else {
                      handleLockConfirmAndExport();
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#3498db",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Lock & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for showing unsubmitted classes */}
        {showSubmissionModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "30px",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2
                style={{ marginTop: 0, color: "#e74c3c", marginBottom: "20px" }}
              >
                ⚠️ Attendance Not Submitted
              </h2>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                The following classes have not submitted attendance for{" "}
                <strong>
                  {reportDateMode === "range"
                    ? new Date(reportDateFrom).toLocaleDateString()
                    : new Date(reportDate).toLocaleDateString()}
                </strong>
                :
              </p>

              <div
                style={{
                  backgroundColor: "#f9f3f3",
                  border: "1px solid #e74c3c",
                  borderRadius: "4px",
                  padding: "15px",
                  marginBottom: "20px",
                }}
              >
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    listStyleType: "disc",
                  }}
                >
                  {unsubmittedClasses.map((cls) => (
                    <li
                      key={cls.id}
                      style={{
                        marginBottom: "8px",
                        color: "#333",
                        fontSize: "14px",
                      }}
                    >
                      {cls.name}
                    </li>
                  ))}
                </ul>
              </div>

              <p
                style={{
                  color: "#666",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                Do you want to continue with the report anyway?
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setUnsubmittedClasses([]);
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #bdc3c7",
                    borderRadius: "4px",
                    backgroundColor: "#ecf0f1",
                    color: "#333",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowSubmissionModal(false);
                    setUnsubmittedClasses([]);
                    setProceedWithPrint(true);
                    await performPrintReport();
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Continue & Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

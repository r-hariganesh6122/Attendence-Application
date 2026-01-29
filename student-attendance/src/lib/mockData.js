// Mock data for frontend development
// This will be replaced with real backend API calls later

export const mockData = {
  colleges: [
    {
      id: "col-001",
      name: "Engineering College",
      location: "New Delhi",
    },
    {
      id: "col-002",
      name: "Arts & Science College",
      location: "Mumbai",
    },
  ],

  departments: [
    {
      id: "dept-001",
      name: "Computer Science",
      collegeId: "col-001",
    },
    {
      id: "dept-002",
      name: "Electronics",
      collegeId: "col-001",
    },
    {
      id: "dept-003",
      name: "English",
      collegeId: "col-002",
    },
    {
      id: "dept-004",
      name: "Physics",
      collegeId: "col-002",
    },
  ],

  classes: [
    {
      id: "class-001",
      name: "CSE-A",
      departmentId: "dept-001",
      semester: "4",
      strength: 30,
    },
    {
      id: "class-002",
      name: "CSE-B",
      departmentId: "dept-001",
      semester: "4",
      strength: 28,
    },
    {
      id: "class-003",
      name: "ECE-A",
      departmentId: "dept-002",
      semester: "2",
      strength: 32,
    },
    {
      id: "class-004",
      name: "English-A",
      departmentId: "dept-003",
      semester: "1",
      strength: 35,
    },
  ],

  students: [
    // CSE-A
    {
      id: "std-001",
      name: "Aarav Sharma",
      rollNo: "001",
      classId: "class-001",
    },
    {
      id: "std-002",
      name: "Bhavna Patel",
      rollNo: "002",
      classId: "class-001",
    },
    {
      id: "std-003",
      name: "Chirag Singh",
      rollNo: "003",
      classId: "class-001",
    },
    { id: "std-004", name: "Divya Verma", rollNo: "004", classId: "class-001" },
    { id: "std-005", name: "Esha Gupta", rollNo: "005", classId: "class-001" },
    // CSE-B
    { id: "std-006", name: "Farah Khan", rollNo: "006", classId: "class-002" },
    {
      id: "std-007",
      name: "Gaurav Kapoor",
      rollNo: "007",
      classId: "class-002",
    },
    { id: "std-008", name: "Harsh Joshi", rollNo: "008", classId: "class-002" },
    {
      id: "std-009",
      name: "Ishita Malhotra",
      rollNo: "009",
      classId: "class-002",
    },
    { id: "std-010", name: "Jayesh Rao", rollNo: "010", classId: "class-002" },
    // ECE-A
    { id: "std-011", name: "Kavya Nair", rollNo: "011", classId: "class-003" },
    { id: "std-012", name: "Laxman Das", rollNo: "012", classId: "class-003" },
    { id: "std-013", name: "Meera Singh", rollNo: "013", classId: "class-003" },
    {
      id: "std-014",
      name: "Nikhil Reddy",
      rollNo: "014",
      classId: "class-003",
    },
    { id: "std-015", name: "Pia Sharma", rollNo: "015", classId: "class-003" },
    // English-A
    { id: "std-016", name: "Qasim Ali", rollNo: "016", classId: "class-004" },
    { id: "std-017", name: "Riya Dutta", rollNo: "017", classId: "class-004" },
    {
      id: "std-018",
      name: "Sanjay Kumar",
      rollNo: "018",
      classId: "class-004",
    },
    {
      id: "std-019",
      name: "Tanya Mishra",
      rollNo: "019",
      classId: "class-004",
    },
    { id: "std-020", name: "Umesh Yadav", rollNo: "020", classId: "class-004" },
  ],

  teachers: [
    {
      id: "teach-001",
      name: "Dr. Rajesh Kumar",
      email: "rajesh@college.edu",
      phone: "9876543210",
      departmentId: "dept-001",
    },
    {
      id: "teach-002",
      name: "Ms. Priya Sharma",
      email: "priya@college.edu",
      phone: "9876543211",
      departmentId: "dept-001",
    },
    {
      id: "teach-003",
      name: "Dr. Anil Singh",
      email: "anil@college.edu",
      phone: "9876543212",
      departmentId: "dept-002",
    },
    {
      id: "teach-004",
      name: "Ms. Sarah Williams",
      email: "sarah@college.edu",
      phone: "9876543213",
      departmentId: "dept-003",
    },
    {
      id: "teach-005",
      name: "Dr. James Martin",
      email: "james@college.edu",
      phone: "9876543214",
      departmentId: "dept-004",
    },
  ],

  teacherClassAssignments: [
    {
      id: "assign-001",
      teacherId: "teach-001",
      classId: "class-001",
    },
    {
      id: "assign-002",
      teacherId: "teach-002",
      classId: "class-001",
    },
    {
      id: "assign-003",
      teacherId: "teach-002",
      classId: "class-002",
    },
    {
      id: "assign-004",
      teacherId: "teach-003",
      classId: "class-003",
    },
    {
      id: "assign-005",
      teacherId: "teach-004",
      classId: "class-004",
    },
  ],

  // Admin users for login
  adminUsers: [
    {
      id: "admin-001",
      email: "admin@college.edu",
      password: "admin123", // Frontend only - mock
      name: "Admin User",
      collegeId: "col-001",
    },
  ],

  // Teacher users for login
  teacherUsers: [
    {
      id: "teach-001",
      email: "rajesh@college.edu",
      password: "teach123", // Frontend only - mock
      name: "Dr. Rajesh Kumar",
      teacherId: "teach-001",
    },
    {
      id: "teach-002",
      email: "priya@college.edu",
      password: "teach123",
      name: "Ms. Priya Sharma",
      teacherId: "teach-002",
    },
  ],
};

// Helper functions to get data
export const getClassesByDepartment = (departmentId) => {
  return mockData.classes.filter((c) => c.departmentId === departmentId);
};

export const getStudentsByClass = (classId) => {
  return mockData.students.filter((s) => s.classId === classId);
};

export const getClassesForTeacher = (teacherId) => {
  const assignments = mockData.teacherClassAssignments.filter(
    (a) => a.teacherId === teacherId,
  );
  return assignments.map((a) => {
    const cls = mockData.classes.find((c) => c.id === a.classId);
    return cls;
  });
};

export const getDepartmentById = (deptId) => {
  return mockData.departments.find((d) => d.id === deptId);
};

export const getClassById = (classId) => {
  return mockData.classes.find((c) => c.id === classId);
};

export const getCollegeById = (collegeId) => {
  return mockData.colleges.find((c) => c.id === collegeId);
};

export const getTeacherById = (teacherId) => {
  return mockData.teachers.find((t) => t.id === teacherId);
};

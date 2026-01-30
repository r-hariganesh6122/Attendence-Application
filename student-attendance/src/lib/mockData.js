// Mock data for frontend development
// This will be replaced with real backend API calls later

export const mockData = {
  programs: [
    {
      id: "prog-001",
      name: "BE",
      departments: [
        {
          id: "dept-001",
          name: "Computer Science",
        },
        {
          id: "dept-002",
          name: "Electronics",
        },
      ],
    },
    {
      id: "prog-002",
      name: "BTech",
      departments: [
        {
          id: "dept-003",
          name: "Information Technology",
        },
        {
          id: "dept-004",
          name: "Mechanical Engineering",
        },
      ],
    },
  ],

  departments: [
    // BE Program
    {
      id: "dept-001",
      name: "AERO",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-002",
      name: "BME",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-003",
      name: "CIVIL",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-004",
      name: "CSE",
      program: "BE",
      classes: ["A", "B", "C", "D", "E"],
    },
    {
      id: "dept-005",
      name: "CSE-AIML",
      program: "BE",
      classes: ["A", "B"],
    },
    {
      id: "dept-006",
      name: "CSE-IOT",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-007",
      name: "CYBER SECURITY",
      program: "BE",
      classes: ["A", "B"],
    },
    {
      id: "dept-008",
      name: "ECE",
      program: "BE",
      classes: ["A", "B", "C"],
    },
    {
      id: "dept-009",
      name: "EEE",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-010",
      name: "MECHANICAL",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-011",
      name: "MCT",
      program: "BE",
      classes: [],
    },
    {
      id: "dept-012",
      name: "R&A",
      program: "BE",
      classes: [],
    },
    // BTech Program
    {
      id: "dept-013",
      name: "AGRI",
      program: "BTech",
      classes: [],
    },
    {
      id: "dept-014",
      name: "AIDS",
      program: "BTech",
      classes: ["A", "B", "C"],
    },
    {
      id: "dept-015",
      name: "BIO-TECH",
      program: "BTech",
      classes: [],
    },
    {
      id: "dept-016",
      name: "CHEMICAL",
      program: "BTech",
      classes: [],
    },
    {
      id: "dept-017",
      name: "FOOD-TECH",
      program: "BTech",
      classes: [],
    },
    {
      id: "dept-018",
      name: "IT",
      program: "BTech",
      classes: ["A", "B", "C", "D"],
    },
    {
      id: "dept-019",
      name: "PHARMA",
      program: "BTech",
      classes: [],
    },
  ],

  students: [
    // Computer Science
    {
      id: "std-001",
      name: "Aarav Sharma",
      rollNo: "001",
      departmentId: "dept-001",
    },
    {
      id: "std-002",
      name: "Bhavna Patel",
      rollNo: "002",
      departmentId: "dept-001",
    },
    {
      id: "std-003",
      name: "Chirag Singh",
      rollNo: "003",
      departmentId: "dept-001",
    },
    {
      id: "std-004",
      name: "Divya Verma",
      rollNo: "004",
      departmentId: "dept-001",
    },
    {
      id: "std-005",
      name: "Esha Gupta",
      rollNo: "005",
      departmentId: "dept-001",
    },
    // Electronics
    {
      id: "std-006",
      name: "Farah Khan",
      rollNo: "006",
      departmentId: "dept-002",
    },
    {
      id: "std-007",
      name: "Gaurav Kapoor",
      rollNo: "007",
      departmentId: "dept-002",
    },
    {
      id: "std-008",
      name: "Harsh Joshi",
      rollNo: "008",
      departmentId: "dept-002",
    },
    {
      id: "std-009",
      name: "Ishita Malhotra",
      rollNo: "009",
      departmentId: "dept-002",
    },
    {
      id: "std-010",
      name: "Jayesh Rao",
      rollNo: "010",
      departmentId: "dept-002",
    },
    // Information Technology
    {
      id: "std-011",
      name: "Kavya Nair",
      rollNo: "011",
      departmentId: "dept-003",
    },
    {
      id: "std-012",
      name: "Laxman Das",
      rollNo: "012",
      departmentId: "dept-003",
    },
    {
      id: "std-013",
      name: "Meera Singh",
      rollNo: "013",
      departmentId: "dept-003",
    },
    {
      id: "std-014",
      name: "Nikhil Reddy",
      rollNo: "014",
      departmentId: "dept-003",
    },
    {
      id: "std-015",
      name: "Pia Sharma",
      rollNo: "015",
      departmentId: "dept-003",
    },
    // Mechanical Engineering
    {
      id: "std-016",
      name: "Qasim Ali",
      rollNo: "016",
      departmentId: "dept-004",
    },
    {
      id: "std-017",
      name: "Riya Dutta",
      rollNo: "017",
      departmentId: "dept-004",
    },
    {
      id: "std-018",
      name: "Sanjay Kumar",
      rollNo: "018",
      departmentId: "dept-004",
    },
    {
      id: "std-019",
      name: "Tanya Mishra",
      rollNo: "019",
      departmentId: "dept-004",
    },
    {
      id: "std-020",
      name: "Umesh Yadav",
      rollNo: "020",
      departmentId: "dept-004",
    },
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

  teacherDepartmentAssignments: [
    {
      id: "assign-001",
      teacherId: "teach-001",
      departmentId: "dept-001",
    },
    {
      id: "assign-002",
      teacherId: "teach-002",
      departmentId: "dept-001",
    },
    {
      id: "assign-003",
      teacherId: "teach-003",
      departmentId: "dept-002",
    },
    {
      id: "assign-004",
      teacherId: "teach-004",
      departmentId: "dept-003",
    },
    {
      id: "assign-005",
      teacherId: "teach-005",
      departmentId: "dept-004",
    },
  ],

  // Admin users for login
  adminUsers: [
    {
      id: "admin-001",
      email: "admin@college.edu",
      password: "admin123", // Frontend only - mock
      name: "Admin User",
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
export const getStudentsByDepartment = (departmentId) => {
  return mockData.students.filter((s) => s.departmentId === departmentId);
};

export const getDepartmentById = (deptId) => {
  return mockData.departments.find((d) => d.id === deptId);
};

export const getTeacherById = (teacherId) => {
  return mockData.teachers.find((t) => t.id === teacherId);
};

export const getDepartmentsForTeacher = (teacherId) => {
  const assignments = mockData.teacherDepartmentAssignments.filter(
    (a) => a.teacherId === teacherId,
  );
  return assignments.map((a) => {
    const dept = mockData.departments.find((d) => d.id === a.departmentId);
    return dept;
  });
};

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
    // Computer Science (no classes)
    {
      id: "std-001",
      name: "Aarav Sharma",
      rollNo: "001",
      departmentId: "dept-001",
      residenceType: "days scholar",
    },
    {
      id: "std-002",
      name: "Bhavna Patel",
      rollNo: "002",
      departmentId: "dept-001",
      residenceType: "hosteller",
    },
    {
      id: "std-003",
      name: "Chirag Singh",
      rollNo: "003",
      departmentId: "dept-001",
      residenceType: "outsider",
    },
    {
      id: "std-004",
      name: "Divya Verma",
      rollNo: "004",
      departmentId: "dept-001",
      residenceType: "days scholar",
    },
    {
      id: "std-005",
      name: "Esha Gupta",
      rollNo: "005",
      departmentId: "dept-001",
      residenceType: "hosteller",
    },
    // Electronics (no classes)
    {
      id: "std-006",
      name: "Farah Khan",
      rollNo: "006",
      departmentId: "dept-002",
      residenceType: "outsider",
    },
    {
      id: "std-007",
      name: "Gaurav Kapoor",
      rollNo: "007",
      departmentId: "dept-002",
      residenceType: "days scholar",
    },
    {
      id: "std-008",
      name: "Harsh Joshi",
      rollNo: "008",
      departmentId: "dept-002",
      residenceType: "hosteller",
    },
    {
      id: "std-009",
      name: "Ishita Malhotra",
      rollNo: "009",
      departmentId: "dept-002",
      residenceType: "outsider",
    },
    {
      id: "std-010",
      name: "Jayesh Rao",
      rollNo: "010",
      departmentId: "dept-002",
      residenceType: "days scholar",
    },
    // Information Technology (no classes)
    {
      id: "std-011",
      name: "Kavya Nair",
      rollNo: "011",
      departmentId: "dept-003",
      residenceType: "hosteller",
    },
    {
      id: "std-012",
      name: "Laxman Das",
      rollNo: "012",
      departmentId: "dept-003",
      residenceType: "outsider",
    },
    {
      id: "std-013",
      name: "Meera Singh",
      rollNo: "013",
      departmentId: "dept-003",
      residenceType: "days scholar",
    },
    {
      id: "std-014",
      name: "Nikhil Reddy",
      rollNo: "014",
      departmentId: "dept-003",
      residenceType: "hosteller",
    },
    {
      id: "std-015",
      name: "Pia Sharma",
      rollNo: "015",
      departmentId: "dept-003",
      residenceType: "outsider",
    },
    // Mechanical Engineering (no classes)
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
    // CSE Department (has classes A, B, C, D, E)
    {
      id: "std-021",
      name: "Vikram Singh",
      rollNo: "021",
      departmentId: "dept-004",
      class: "A",
      residenceType: "outsider",
    },
    {
      id: "std-022",
      name: "Priya Sharma",
      rollNo: "022",
      departmentId: "dept-004",
      class: "A",
      residenceType: "days scholar",
    },
    {
      id: "std-023",
      name: "Rahul Kumar",
      rollNo: "023",
      departmentId: "dept-004",
      class: "B",
      residenceType: "hosteller",
    },
    {
      id: "std-024",
      name: "Anjali Gupta",
      rollNo: "024",
      departmentId: "dept-004",
      class: "B",
      residenceType: "outsider",
    },
    {
      id: "std-025",
      name: "Arjun Patel",
      rollNo: "025",
      departmentId: "dept-004",
      class: "C",
      residenceType: "days scholar",
    },
    {
      id: "std-026",
      name: "Sneha Reddy",
      rollNo: "026",
      departmentId: "dept-004",
      class: "C",
      residenceType: "hosteller",
    },
    {
      id: "std-027",
      name: "Karan Singh",
      rollNo: "027",
      departmentId: "dept-004",
      class: "D",
      residenceType: "outsider",
    },
    {
      id: "std-028",
      name: "Megha Jain",
      rollNo: "028",
      departmentId: "dept-004",
      class: "D",
      residenceType: "days scholar",
    },
    {
      id: "std-029",
      name: "Rohit Verma",
      rollNo: "029",
      departmentId: "dept-004",
      class: "E",
      residenceType: "hosteller",
    },
    {
      id: "std-030",
      name: "Pooja Sharma",
      rollNo: "030",
      departmentId: "dept-004",
      class: "E",
      residenceType: "outsider",
    },
    // CSE-AIML Department (has classes A, B)
    {
      id: "std-031",
      name: "Amit Kumar",
      rollNo: "031",
      departmentId: "dept-005",
      class: "A",
      residenceType: "outsider",
    },
    {
      id: "std-032",
      name: "Neha Singh",
      rollNo: "032",
      departmentId: "dept-005",
      class: "A",
      residenceType: "days scholar",
    },
    {
      id: "std-033",
      name: "Suresh Patel",
      rollNo: "033",
      departmentId: "dept-005",
      class: "B",
      residenceType: "hosteller",
    },
    {
      id: "std-034",
      name: "Kavita Reddy",
      rollNo: "034",
      departmentId: "dept-005",
      class: "B",
      residenceType: "outsider",
    },
    // CYBER SECURITY Department (has classes A, B)
    {
      id: "std-035",
      name: "Rajesh Gupta",
      rollNo: "035",
      departmentId: "dept-007",
      class: "A",
      residenceType: "days scholar",
    },
    {
      id: "std-036",
      name: "Sunita Sharma",
      rollNo: "036",
      departmentId: "dept-007",
      class: "A",
      residenceType: "hosteller",
    },
    {
      id: "std-037",
      name: "Vijay Kumar",
      rollNo: "037",
      departmentId: "dept-007",
      class: "B",
      residenceType: "outsider",
    },
    {
      id: "std-038",
      name: "Rekha Singh",
      rollNo: "038",
      departmentId: "dept-007",
      class: "B",
      residenceType: "days scholar",
    },
    // ECE Department (has classes A, B, C)
    {
      id: "std-039",
      name: "Manoj Patel",
      rollNo: "039",
      departmentId: "dept-008",
      class: "A",
      residenceType: "hosteller",
    },
    {
      id: "std-040",
      name: "Anita Gupta",
      rollNo: "040",
      departmentId: "dept-008",
      class: "A",
      residenceType: "outsider",
    },
    {
      id: "std-041",
      name: "Sandeep Kumar",
      rollNo: "041",
      departmentId: "dept-008",
      class: "B",
      residenceType: "days scholar",
    },
    {
      id: "std-042",
      name: "Preeti Sharma",
      rollNo: "042",
      departmentId: "dept-008",
      class: "B",
      residenceType: "hosteller",
    },
    {
      id: "std-043",
      name: "Ravi Singh",
      rollNo: "043",
      departmentId: "dept-008",
      class: "C",
      residenceType: "outsider",
    },
    {
      id: "std-044",
      name: "Kiran Reddy",
      rollNo: "044",
      departmentId: "dept-008",
      class: "C",
      residenceType: "days scholar",
    },
    // AIDS Department (has classes A, B, C)
    {
      id: "std-045",
      name: "Deepak Kumar",
      rollNo: "045",
      departmentId: "dept-014",
      class: "A",
      residenceType: "hosteller",
    },
    {
      id: "std-046",
      name: "Swati Sharma",
      rollNo: "046",
      departmentId: "dept-014",
      class: "A",
      residenceType: "outsider",
    },
    {
      id: "std-047",
      name: "Naveen Patel",
      rollNo: "047",
      departmentId: "dept-014",
      class: "B",
      residenceType: "days scholar",
    },
    {
      id: "std-048",
      name: "Geeta Singh",
      rollNo: "048",
      departmentId: "dept-014",
      class: "B",
      residenceType: "hosteller",
    },
    {
      id: "std-049",
      name: "Ajay Gupta",
      rollNo: "049",
      departmentId: "dept-014",
      class: "C",
      residenceType: "outsider",
    },
    {
      id: "std-050",
      name: "Rina Reddy",
      rollNo: "050",
      departmentId: "dept-014",
      class: "C",
      residenceType: "days scholar",
    },
    // IT Department (has classes A, B, C, D)
    {
      id: "std-051",
      name: "Vinod Kumar",
      rollNo: "051",
      departmentId: "dept-018",
      class: "A",
      residenceType: "hosteller",
    },
    {
      id: "std-052",
      name: "Maya Sharma",
      rollNo: "052",
      departmentId: "dept-018",
      class: "A",
      residenceType: "outsider",
    },
    {
      id: "std-053",
      name: "Prakash Singh",
      rollNo: "053",
      departmentId: "dept-018",
      class: "B",
      residenceType: "days scholar",
    },
    {
      id: "std-054",
      name: "Lata Patel",
      rollNo: "054",
      departmentId: "dept-018",
      class: "B",
      residenceType: "hosteller",
    },
    {
      id: "std-055",
      name: "Rakesh Gupta",
      rollNo: "055",
      departmentId: "dept-018",
      class: "C",
      residenceType: "outsider",
    },
    {
      id: "std-056",
      name: "Seema Reddy",
      rollNo: "056",
      departmentId: "dept-018",
      class: "C",
      residenceType: "days scholar",
    },
    {
      id: "std-057",
      name: "Mohan Kumar",
      rollNo: "057",
      departmentId: "dept-018",
      class: "D",
      residenceType: "hosteller",
    },
    {
      id: "std-058",
      name: "Usha Sharma",
      rollNo: "058",
      departmentId: "dept-018",
      class: "D",
      residenceType: "outsider",
    },
  ],

  teachers: [
    {
      id: "teach-001",
      name: "Dr. Rajesh Kumar",
      email: "rajesh@college.edu",
      phone: "9876543210",
      departmentId: "dept-001",
      subject: "Computer Science",
    },
    {
      id: "teach-002",
      name: "Ms. Priya Sharma",
      email: "priya@college.edu",
      phone: "9876543211",
      departmentId: "dept-001",
      subject: "Mathematics",
    },
    {
      id: "teach-003",
      name: "Dr. Anil Singh",
      email: "anil@college.edu",
      phone: "9876543212",
      departmentId: "dept-002",
      subject: "Electronics",
    },
    {
      id: "teach-004",
      name: "Ms. Sarah Williams",
      email: "sarah@college.edu",
      phone: "9876543213",
      departmentId: "dept-003",
      subject: "Information Technology",
    },
    {
      id: "teach-005",
      name: "Dr. James Martin",
      email: "james@college.edu",
      phone: "9876543214",
      departmentId: "dept-004",
      subject: "Computer Science",
    },
  ],

  teacherDepartmentAssignments: [
    {
      id: "assign-001",
      teacherId: "teach-001",
      departmentId: "dept-001",
      subject: "Computer Science",
    },
    {
      id: "assign-002",
      teacherId: "teach-002",
      departmentId: "dept-001",
      subject: "Mathematics",
    },
    {
      id: "assign-003",
      teacherId: "teach-003",
      departmentId: "dept-002",
      subject: "Electronics",
    },
    {
      id: "assign-004",
      teacherId: "teach-004",
      departmentId: "dept-003",
      subject: "Information Technology",
    },
    {
      id: "assign-005",
      teacherId: "teach-005",
      departmentId: "dept-004",
      subject: "Computer Science",
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
export const getStudentsByDepartment = (departmentId, className = null) => {
  let students = mockData.students.filter(
    (s) => s.departmentId === departmentId,
  );
  if (className) {
    students = students.filter((s) => s.class === className);
  }
  return students;
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

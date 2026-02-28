import * as XLSX from "xlsx";

/**
 * STUDENT EXCEL TEMPLATE GENERATION & VALIDATION
 */

export const STUDENT_TEMPLATE_COLUMNS = [
  "Roll No",
  "Reg No",
  "Student Name",
  "Residence",
];

export const STUDENT_RESIDENCE_OPTIONS = ["H", "D", "OSS"];

export function generateStudentTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    STUDENT_TEMPLATE_COLUMNS,
    ["S001", "REG001", "John Doe", "H"],
    ["S002", "REG002", "Jane Smith", "D"],
  ]);

  // Set column widths
  ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];

  // Add autofilter to header row (A1:D1 for 4 columns)
  ws["!autofilter"] = { ref: "A1:D1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return wb;
}

export function validateStudentExcel(file, classStudents = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const errors = [];
        const validData = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +2 because row 1 is header and index starts at 0
          const rowErrors = [];

          // Check Roll No
          if (!row["Roll No"] || String(row["Roll No"]).trim() === "") {
            rowErrors.push("Roll No is required");
          } else if (String(row["Roll No"]).length > 50) {
            rowErrors.push("Roll No exceeds 50 characters");
          }

          // Check Reg No
          if (!row["Reg No"] || String(row["Reg No"]).trim() === "") {
            rowErrors.push("Reg No is required");
          } else {
            const regNo = String(row["Reg No"]).trim();
            if (regNo.length > 50) {
              rowErrors.push("Reg No exceeds 50 characters");
            }
            if (!/^\d+$/.test(regNo)) {
              rowErrors.push(
                "Reg No must contain only numbers (no letters or special characters)",
              );
            }
          }

          // Check Student Name
          if (
            !row["Student Name"] ||
            String(row["Student Name"]).trim() === ""
          ) {
            rowErrors.push("Student Name is required");
          } else if (String(row["Student Name"]).length > 255) {
            rowErrors.push("Student Name exceeds 255 characters");
          }

          // Check Residence
          const residence = row["Residence"]
            ? String(row["Residence"]).trim()
            : "";
          if (residence && !STUDENT_RESIDENCE_OPTIONS.includes(residence)) {
            rowErrors.push(
              `Residence must be one of: ${STUDENT_RESIDENCE_OPTIONS.join(", ")}`,
            );
          } else if (residence.length > 255) {
            rowErrors.push("Residence exceeds 255 characters");
          }

          // Check for duplication within the same upload
          const rollNo = String(row["Roll No"]).trim();
          const regNo = String(row["Reg No"]).trim();
          const isDuplicate = validData.some(
            (v) => v.rollNo === rollNo && v.regNo === regNo,
          );
          if (isDuplicate && rollNo && regNo) {
            rowErrors.push("Duplicate entry with same Roll No and Reg No");
          }

          // Check if student already exists in class
          const existsInClass = classStudents.some(
            (s) => s.rollNo === rollNo && s.regNo === regNo,
          );
          if (existsInClass && rollNo && regNo) {
            rowErrors.push(
              "Student with this Roll No and Reg No already exists in class",
            );
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: rowNum,
              errors: rowErrors,
            });
          } else {
            validData.push({
              rollNo: String(row["Roll No"]).trim(),
              regNo: String(row["Reg No"]).trim(),
              studentName: String(row["Student Name"]).trim(),
              residence: residence || "",
            });
          }
        });

        resolve({
          success: errors.length === 0,
          validData,
          errors,
          totalRows: rows.length,
        });
      } catch (error) {
        resolve({
          success: false,
          validData: [],
          errors: [
            {
              row: 0,
              errors: [`File parsing error: ${error.message}`],
            },
          ],
          totalRows: 0,
        });
      }
    };
    reader.readAsBinaryString(file);
  });
}

/**
 * TEACHER EXCEL TEMPLATE GENERATION & VALIDATION
 */

export const TEACHER_TEMPLATE_COLUMNS = [
  "Teacher Name",
  "Mobile Number",
  "Password",
];

export function generateTeacherTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    TEACHER_TEMPLATE_COLUMNS,
    ["Dr. Smith", "9876543210", "password123"],
    ["Prof. Johnson", "9876543211", "password456"],
  ]);

  ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }];

  // Add autofilter to header row (A1:C1 for 3 columns)
  ws["!autofilter"] = { ref: "A1:C1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Teachers");
  return wb;
}

export function validateTeacherExcel(file, existingTeachers = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const errors = [];
        const validData = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2;
          const rowErrors = [];

          // Check Teacher Name
          if (
            !row["Teacher Name"] ||
            String(row["Teacher Name"]).trim() === ""
          ) {
            rowErrors.push("Teacher Name is required");
          } else if (String(row["Teacher Name"]).length > 255) {
            rowErrors.push("Teacher Name exceeds 255 characters");
          }

          // Check Mobile Number
          if (
            !row["Mobile Number"] ||
            String(row["Mobile Number"]).trim() === ""
          ) {
            rowErrors.push("Mobile Number is required");
          } else {
            const mobile = String(row["Mobile Number"]).trim();
            if (!/^\d{10}$/.test(mobile)) {
              rowErrors.push("Mobile Number must be exactly 10 digits");
            }

            // Check if mobile already exists
            const existingMobile = existingTeachers.find(
              (t) => t.mobile === mobile,
            );
            if (existingMobile) {
              rowErrors.push("Teacher with this mobile number already exists");
            }

            // Check for duplicates within the same upload
            const isDuplicate = validData.some((v) => v.mobile === mobile);
            if (isDuplicate) {
              rowErrors.push("Duplicate mobile number in upload");
            }
          }

          // Check Password
          if (!row["Password"] || String(row["Password"]).trim() === "") {
            rowErrors.push("Password is required");
          } else {
            const password = String(row["Password"]).trim();
            if (password.length < 6) {
              rowErrors.push("Password must be at least 6 characters");
            }
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: rowNum,
              errors: rowErrors,
            });
          } else {
            validData.push({
              name: String(row["Teacher Name"]).trim(),
              mobile: String(row["Mobile Number"]).trim(),
              password: String(row["Password"]).trim(),
            });
          }
        });

        resolve({
          success: errors.length === 0,
          validData,
          errors,
          totalRows: rows.length,
        });
      } catch (error) {
        resolve({
          success: false,
          validData: [],
          errors: [
            {
              row: 0,
              errors: [`File parsing error: ${error.message}`],
            },
          ],
          totalRows: 0,
        });
      }
    };
    reader.readAsBinaryString(file);
  });
}

/**
 * CLASS TEACHER (TEACHER ASSIGNMENT) EXCEL TEMPLATE GENERATION & VALIDATION
 */

export const CLASS_TEACHER_TEMPLATE_COLUMNS = [
  "Course Code",
  "Course Name",
  "Teacher Name",
  "Teacher Mobile",
];

export function generateClassTeacherTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    CLASS_TEACHER_TEMPLATE_COLUMNS,
    ["CS101", "Data Structures", "Dr. Smith", "9876543210"],
    ["CS102", "Algorithms", "Prof. Johnson", "9876543211"],
    ["", "", "", ""], // Empty row showing teacher can be left empty
  ]);

  ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];

  // Add autofilter to header row (A1:D1 for 4 columns)
  ws["!autofilter"] = { ref: "A1:D1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ClassTeachers");
  return wb;
}

export function validateClassTeacherExcel(file, courses = [], teachers = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const errors = [];
        const validData = [];

        // Create lookup maps for efficiency
        const courseMap = {};
        courses.forEach((c) => {
          courseMap[c.courseCode] = c;
        });

        const teacherMap = {};
        teachers.forEach((t) => {
          teacherMap[t.mobile] = t;
        });

        rows.forEach((row, index) => {
          const rowNum = index + 2;
          const rowErrors = [];

          const courseCode = row["Course Code"]
            ? String(row["Course Code"]).trim()
            : "";
          const courseName = row["Course Name"]
            ? String(row["Course Name"]).trim()
            : "";
          const teacherName = row["Teacher Name"]
            ? String(row["Teacher Name"]).trim()
            : "";
          const teacherMobile = row["Teacher Mobile"]
            ? String(row["Teacher Mobile"]).trim()
            : "";

          // Check if at least Course Code and Course Name are provided
          if (!courseCode && !courseName && !teacherName && !teacherMobile) {
            // Skip completely empty rows
            return;
          }

          // Course Code is required
          if (!courseCode) {
            rowErrors.push("Course Code is required");
          } else if (courseCode.length > 50) {
            rowErrors.push("Course Code exceeds 50 characters");
          } else if (!courseMap[courseCode]) {
            rowErrors.push(
              `Course Code '${courseCode}' does not exist in this class`,
            );
          }

          // Course Name is required
          if (!courseName) {
            rowErrors.push("Course Name is required");
          } else if (courseName.length > 255) {
            rowErrors.push("Course Name exceeds 255 characters");
          }

          // Teacher validation (can be empty, meaning no teacher assigned yet)
          if (teacherName || teacherMobile) {
            // If teacher name is provided, mobile must also be provided
            if (!teacherMobile) {
              rowErrors.push(
                "Teacher Mobile is required when Teacher Name is provided",
              );
            }

            // If mobile is provided, name must also be provided
            if (!teacherName) {
              rowErrors.push(
                "Teacher Name is required when Teacher Mobile is provided",
              );
            }

            // Validate mobile format
            if (teacherMobile && !/^\d{10}$/.test(teacherMobile)) {
              rowErrors.push("Teacher Mobile must be exactly 10 digits");
            }

            // Check if teacher exists
            if (teacherMobile && !teacherMap[teacherMobile]) {
              rowErrors.push(
                `Teacher with mobile '${teacherMobile}' does not exist`,
              );
            }
          }

          // Check for exact duplicate (same course AND same teacher)
          // BUT allow duplicates when same course is taught by different teachers
          // OR when same teacher teaches different courses
          const courseTeacherPair = validData.find(
            (v) =>
              v.courseCode === courseCode && v.teacherMobile === teacherMobile,
          );

          if (courseTeacherPair && courseCode && teacherMobile) {
            rowErrors.push(
              "Duplicate: This teacher is already assigned to this course",
            );
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: rowNum,
              errors: rowErrors,
            });
          } else if (courseCode && courseName) {
            // Only add if at least course info is valid
            validData.push({
              courseCode,
              courseName,
              teacherName: teacherName || "",
              teacherMobile: teacherMobile || "",
              teacherId: teacherMobile ? teacherMap[teacherMobile]?.id : null,
            });
          }
        });

        resolve({
          success: errors.length === 0,
          validData,
          errors,
          totalRows: rows.length,
        });
      } catch (error) {
        resolve({
          success: false,
          validData: [],
          errors: [
            {
              row: 0,
              errors: [`File parsing error: ${error.message}`],
            },
          ],
          totalRows: 0,
        });
      }
    };
    reader.readAsBinaryString(file);
  });
}

/**
 * DOWNLOAD TEMPLATE FILE
 */

export function downloadTemplate(workbook, filename) {
  XLSX.writeFile(workbook, `${filename}_template.xlsx`);
}

/**
 * HIGHLIGHT ERRORS IN EXCEL
 */

export function generateErrorHighlightedExcel(file, errors) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Create error map by row
        const errorMap = {};
        errors.forEach(({ row, errors: rowErrors }) => {
          errorMap[row] = rowErrors.join("; ");
        });

        // Add error column
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        const headerRow = 1;

        // Add new column for errors
        const newColIndex = range.e.c + 1;
        const headerCell = XLSX.utils.encode_cell({
          r: headerRow - 1,
          c: newColIndex,
        });
        sheet[headerCell] = { t: "s", v: "ERRORS" };

        // Add error messages
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          if (errorMap[row + 1]) {
            const cell = XLSX.utils.encode_cell({
              r: row,
              c: newColIndex,
            });
            sheet[cell] = {
              t: "s",
              v: errorMap[row + 1],
              s: {
                fill: { fgColor: { rgb: "FFFF0000" } }, // Red background
                font: { color: { rgb: "FFFFFFFF" } }, // White text
              },
            };
          }
        }

        // Update range to include new column
        sheet["!ref"] = XLSX.utils.encode_range({
          s: range.s,
          e: { r: range.e.r, c: newColIndex },
        });

        resolve(workbook);
      } catch (error) {
        resolve(null);
      }
    };
    reader.readAsBinaryString(file);
  });
}

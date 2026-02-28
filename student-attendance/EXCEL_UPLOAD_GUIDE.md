# Excel Bulk Upload Feature Documentation

## Overview

The application now supports bulk uploading of students, teachers, and teacher assignments through Excel files. This feature provides strict validation with detailed error reporting to ensure data quality.

## Features

### 1. **Download Template**

- Each upload section has a "Download Excel Template" button
- Templates contain pre-filled examples showing the correct format
- Column headers match the required fields exactly
- Example data demonstrates proper formatting

### 2. **Strict Validation**

- All required fields are validated (no empty values for mandatory fields)
- Field length constraints are enforced (max characters)
- Format validation (e.g., 10-digit mobile numbers)
- Duplicate detection (both within upload and against existing data)
- Residence type validation (H, D, OSS for students)
- Mobile number uniqueness checks

### 3. **Error Reporting**

- Real-time validation feedback
- Error count and valid row count displayed
- Detailed error messages for each problematic row
- Option to download an error report Excel file with highlighted mistakes
- Errors displayed in red text in the error report

### 4. **Flexible Data Import**

- Process valid rows even if some rows have errors
- Partial success support (some rows fail, others succeed)
- Detailed summary of successful and failed imports

---

## Usage Guide

### **1. Adding Students in Bulk (Class Details Page)**

**Location**: Class Details → Students Tab → Add Sub-tab

**Steps**:

1. Click **"+ Add via Excel"** button at the bottom of the Add form
2. Click **"📥 Download Excel Template"** button
3. Open the downloaded `students_template.xlsx` file
4. Fill in student data:
   - **Roll No**: Student's roll number (Required, max 50 chars)
   - **Reg No**: Registration number - Numbers only (Required, max 50 chars, digits only)
   - **Student Name**: Full name (Required, max 255 chars)
   - **Residence**: H (Hosteller), D (Day Scholar), or OSS (Outside Stayer) (Optional)
5. Save the file
6. Click **"Step 2: Upload Filled Template"** and select your file
7. Review validation results:
   - ✓ Green: Valid rows ready to import
   - ✗ Red: Rows with errors (see error details)
8. If there are errors, click **"📥 Download Error Report"** to see what needs fixing
9. Click **"✓ Import Data"** to import all valid rows

**Validation Rules for Students**:

- Roll No must be unique (in upload and in current class)
- Reg No must contain only numbers (no letters or special characters), unique in upload and class
- Student Name is required
- Residence must be one of: H, D, OSS
- No duplicate student entries (same Roll No + Reg No)

**Example**:

```
Roll No | Reg No | Student Name  | Residence
--------|--------|---------------|-----------
S001    | 001    | John Doe      | H
S002    | 002    | Jane Smith    | D
S003    | 003    | Bob Wilson    | OSS
```

---

### **2. Assigning Teachers to Courses in Bulk (Class Details Page)**

**Location**: Class Details → Teachers Assigned Tab → Add Sub-tab

**Steps**:

1. Click **"+ Add via Excel"** button at the bottom of the teacher assignment form
2. Click **"📥 Download Excel Template"** button
3. Open the downloaded `class_teachers_template.xlsx` file
4. Fill in teacher assignment data:
   - **Course Code**: Course code (Required, max 50 chars)
   - **Course Name**: Course/Subject name (Required, max 255 chars)
   - **Teacher Name**: Teacher's name (Optional - can leave empty if no teacher assigned yet)
   - **Teacher Mobile**: Teacher's mobile number (Optional - must have name if this is filled)
5. Save the file
6. Upload and validate (same process as students)

**Validation Rules for Teacher Assignments**:

- Course Code must exist in the class
- Course Name must match or be provided
- Teacher Mobile must be exactly 10 digits
- If Teacher Name is provided, Teacher Mobile is required
- If Teacher Mobile is provided, Teacher Name is required
- **Duplicate Handling**: Same teacher can teach multiple subjects ✓ (allowed)
- **Duplicate Handling**: Same teacher and same course ✗ (not allowed)
- Teacher Mobile must match an existing teacher in the system

**Key Feature**:

- Allows columns to be empty for Teacher Name and Mobile
- Useful when courses exist but teachers haven't been assigned yet
- You can update the same file later to add teachers

**Example**:

```
Course Code | Course Name      | Teacher Name    | Teacher Mobile
------------|------------------|-----------------|-----------------
CS101       | Data Structures  | Dr. Smith       | 9876543210
CS102       | Algorithms       | Prof. Johnson   | 9876543211
CS103       | Databases        | (empty)         | (empty)
```

---

### **3. Adding Teachers in Bulk (Admin Dashboard - Teachers Tab)**

**Location**: Admin Dashboard → Teachers Tab → Add Sub-tab

**Steps**:

1. Click **"+ Add via Excel"** button at the bottom of the Add form
2. Click **"📥 Download Excel Template"** button
3. Open the downloaded `teachers_template.xlsx` file
4. Fill in teacher data:
   - **Teacher Name**: Full name (Required, max 255 chars)
   - **Mobile Number**: 10-digit mobile number (Required)
   - **Password**: Minimum 6 characters (Required)
5. Save the file
6. Upload and validate (same process as students)

**Validation Rules for Teachers**:

- Teacher Name is required
- Mobile Number must be exactly 10 digits
- Password must be at least 6 characters
- Mobile Number must be unique (not already in system or in upload)
- No duplicate mobile numbers in upload

**Example**:

```
Teacher Name  | Mobile Number | Password
--------------|---------------|-----------
Dr. Smith     | 9876543210    | password123
Prof. Johnson | 9876543211    | password456
Ms. Williams  | 9876543212    | securePass789
```

---

## Error Handling & Resolution

### **Common Errors & How to Fix**

1. **"Roll No is required"**
   - Make sure the Roll No cell contains data
   - Check for leading/trailing spaces

2. **"Reg No must contain only numbers (no letters or special characters)"**
   - Use digits only: "001" not "REG001"
   - Remove all letters and special characters
   - Examples: ✓ "12345", ✗ "REG001", ✗ "001-A"

3. **"Mobile Number must be exactly 10 digits"**
   - Remove any non-numeric characters
   - Ensure you have exactly 10 digits
   - Remove country code if present

4. **"Duplicate entry with same Roll No and Reg No"**
   - Check your upload file for duplicate rows
   - Use "Download Error Report" to identify exact rows

5. **"Teacher with this mobile number already exists"**
   - The mobile number is already in the system
   - Use a different mobile number
   - Or edit existing teacher instead of adding new one

6. **"Residence must be one of: H, D, OSS"**
   - Only these three values are accepted
   - H = Hosteller
   - D = Day Scholar
   - OSS = Outside Stayer

### **Using Error Reports**

When validation fails:

1. Click **"📥 Download Error Report"**
2. Open the generated file in Excel
3. Look for the **ERRORS** column (shown in red)
4. Fix the issues identified in the error column
5. Re-upload the corrected file

---

## Features & Benefits

✓ **Data Quality**: Strict validation prevents invalid data entry  
✓ **Time-Saving**: Add multiple records at once instead of one by one  
✓ **Error Tracking**: Clear error messages identify exact problems  
✓ **User-Friendly**: Familiar Excel format, easy to edit  
✓ **Flexible**: Partial success - import valid rows even if some fail  
✓ **Audit Trail**: Error reports help track what was uploaded  
✓ **Duplicate Prevention**: Prevents duplicate entries in system  
✓ **Template Standardization**: Download templates ensure correct format

---

## Technical Details

### Files Modified/Created

**New Files**:

- `/src/lib/excelUtils.js` - Excel template generation and validation utilities
- `/src/app/components/ExcelUploadSection.js` - Reusable Excel upload UI component

**Modified Files**:

- `/src/app/class/[id]/page.js` - Added student and teacher assignment Excel uploads
- `/src/app/components/AdminDashboard.js` - Added teacher bulk upload

### Dependencies

Uses existing packages:

- `xlsx` - Already installed for Excel handling
- React hooks for state management

### Validation Logic

All validation happens in `/src/lib/excelUtils.js`:

- `validateStudentExcel()` - Student validation
- `validateTeacherExcel()` - Teacher validation
- `validateClassTeacherExcel()` - Teacher assignment validation

---

## Troubleshooting

### Download button doesn't work

- Check browser popup blocker settings
- Try downloading to a different location

### Excel file not recognized

- Ensure file is in `.xlsx` or `.xls` format
- Save file properly using Excel or LibreOffice Calc

### Validation takes too long

- This is normal for large files
- Large files (1000+ rows) may take a few seconds

### Some rows failed to import

- Check the error report for details
- Most common cause: duplicate data or invalid format
- Fix and re-upload the corrected rows

### All imports failed

- Check network connection
- Verify you have admin/teacher permissions
- Contact administrator if persistent

---

## Tips & Best Practices

1. **Always download the template first** - Ensures correct column names and format
2. **Use the example rows** as reference for data format
3. **Test with small batches first** - Before uploading hundreds of records
4. **Keep error reports** - For audit and investigation purposes
5. **Use consistent formatting** - Especially for names and codes
6. **Avoid special characters** in names unless necessary
7. **Review data in Excel** before uploading to catch obvious errors
8. **Back up your data** - Keep copies of uploaded files for records

---

## Support

If you encounter issues:

1. Download the error report to identify specific problems
2. Verify data matches the template format
3. Check validation rules above for your data type
4. Contact your administrator if technical issues persist

---

**Version**: 1.0  
**Last Updated**: 2026-02-28  
**Status**: Active

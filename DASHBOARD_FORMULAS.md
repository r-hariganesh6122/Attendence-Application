# Dashboard Statistics Formulas

## Date Range Mode - Correct Holiday-Safe Formulas

### Variables:

- **Daily Present Count** = Number of students with present records on that day (across all classes)
- **Daily Absent Count** = Number of students with absent records on that day (across all classes)
- **TP** = Total Present records (sum of all present records across all days)
- **TA** = Total Absent records (sum of all absent records across all days)
- **TR** = Total attendance records (TP + TA)
- **D** = Number of distinct class days conducted (actual class days with records, excluding holidays)
- **S** = Total distinct students in that group

---

### 1️⃣ Average Present per Day

```
Avg Present per Day = (Sum of daily present counts) / D
```

**Meaning** → On an average day in the whole institution, how many students were present.

**Example**:

- Day 1: 1500 students present
- Day 2: 1600 students present
- Day 3: 1700 students present
- Avg Present = (1500 + 1600 + 1700) / 3 = 1600 students

✔ Holiday safe because D = actual class days only.
✔ Never exceeds Total Students (reasonably).

---

### 2️⃣ Average Absent per Day

```
Avg Absent per Day = (Sum of daily absent counts) / D
```

**Meaning** → On an average day in the whole institution, how many students were absent.

Also holiday safe.

---

### 3️⃣ Average Attendance Percentage (True Group %)

```
Avg Attendance % = (TP / TR) × 100
```

Where:

- `TP` = Total Present records across all days
- `TR` = TP + TA (Total records across all days)

**Meaning** → Overall attendance percentage across the entire date range.

This is the **only correct group percentage formula** for showing institution-wide attendance.

---

---

## Holiday & Sunday Handling

All calculations **EXCLUDE** the following dates:

- ✅ **All Sundays** - Automatically identified and excluded from day count (D)
- ✅ **Class-level holidays** - Holiday locks set for specific classes
- ✅ **Department-level holidays** - Holiday locks for all classes in a department
- ✅ **Institution-level holidays** - Holiday locks for all classes in the institution

### What This Means:

- **Attendance records ON holidays/Sundays are NOT counted**
- **Day count (D) only includes working days** (no Sundays, no locked holidays)
- **Students absent on holidays are NOT counted as absent**
- **Attendance % is calculated on working days only**

---

## Specific Date Mode

- **Total Students** = All students (including those on holiday)
  - Display format: `(Total - Holiday) + Holiday`
  - If no holidays: Show only without holiday part
  - If all on holiday: Show only total

- **Attendance %** = (Present / Students Not On Holiday) × 100

---

## Implementation Notes

- Holiday dates are always excluded from day count (D)
- Students on holiday are identified by having no attendance records
- Use Set for deduplication of students and days
- Ensure no division by zero

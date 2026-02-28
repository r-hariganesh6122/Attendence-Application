/**
 * Session Utilities for Hourly Attendance
 * Morning Session: Hours 1-4
 * Afternoon Session: Hours 5-7
 */

/**
 * Calculate session status based on hourly absences
 * @param {boolean} hour1Absent
 * @param {boolean} hour2Absent
 * @param {boolean} hour3Absent
 * @param {boolean} hour4Absent
 * @param {boolean} hour5Absent
 * @param {boolean} hour6Absent
 * @param {boolean} hour7Absent
 * @returns {string} - "present", "morningAbsent", "afternoonAbsent", or "bothAbsent"
 */
export function calculateSessionStatus(
  hour1Absent,
  hour2Absent,
  hour3Absent,
  hour4Absent,
  hour5Absent,
  hour6Absent,
  hour7Absent,
) {
  const morningHours = [hour1Absent, hour2Absent, hour3Absent, hour4Absent];
  const afternoonHours = [hour5Absent, hour6Absent, hour7Absent];

  const morningAbsent = morningHours.some((h) => h === true);
  const afternoonAbsent = afternoonHours.some((h) => h === true);

  if (morningAbsent && afternoonAbsent) {
    return "bothAbsent";
  } else if (morningAbsent) {
    return "morningAbsent";
  } else if (afternoonAbsent) {
    return "afternoonAbsent";
  } else {
    return "present";
  }
}

/**
 * Check if a student is absent in a specific session
 * @param {string} sessionType - "morning" or "afternoon"
 * @param {object} hourData - object with hour1Absent through hour7Absent
 * @returns {boolean} - true if absent in that session
 */
export function isSessionAbsent(sessionType, hourData) {
  if (sessionType === "morning") {
    return (
      hourData.hour1Absent ||
      hourData.hour2Absent ||
      hourData.hour3Absent ||
      hourData.hour4Absent
    );
  } else if (sessionType === "afternoon") {
    return hourData.hour5Absent || hourData.hour6Absent || hourData.hour7Absent;
  }
  return false;
}

/**
 * Get all hour fields as an array
 * @param {object} hourData - object with hour1Absent through hour7Absent
 * @returns {boolean[]} - array of 7 boolean values
 */
export function getHourArray(hourData) {
  return [
    hourData.hour1Absent || false,
    hourData.hour2Absent || false,
    hourData.hour3Absent || false,
    hourData.hour4Absent || false,
    hourData.hour5Absent || false,
    hourData.hour6Absent || false,
    hourData.hour7Absent || false,
  ];
}

/**
 * Check if any hour is marked absent
 * @param {object} hourData - object with hour1Absent through hour7Absent
 * @returns {boolean} - true if any hour is absent
 */
export function isAnyHourAbsent(hourData) {
  return getHourArray(hourData).some((h) => h === true);
}

/**
 * Get hours where student is absent
 * @param {object} hourData - object with hour1Absent through hour7Absent
 * @returns {number[]} - array of hour numbers (1-7) where absent
 */
export function getAbsentHours(hourData) {
  const absentHours = [];
  for (let i = 1; i <= 7; i++) {
    if (hourData[`hour${i}Absent`] === true) {
      absentHours.push(i);
    }
  }
  return absentHours;
}

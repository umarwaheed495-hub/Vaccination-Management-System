/**
 * Utility functions for handling schedule timings and overlap checks
 */

// Converts time string like "09:30 AM" or "05:00 PM" into total minutes from midnight
export const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Returns true if two time intervals overlap
export const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};
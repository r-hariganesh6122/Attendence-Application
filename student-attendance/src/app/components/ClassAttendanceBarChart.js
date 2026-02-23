import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ClassAttendanceBarChart({
  histogramData,
  totalStudents,
}) {
  // Handle edge cases
  if (!histogramData || histogramData.length === 0) {
    return (
      <div
        style={{
          width: "60%",
          padding: "20px",
          textAlign: "center",
          color: "#999",
          fontStyle: "italic",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          minHeight: "450px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No attendance data available
      </div>
    );
  }

  return (
    <div
      style={{
        width: "60%",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        minHeight: "450px",
      }}
    >
      <h3
        style={{
          marginBottom: "15px",
          fontSize: "16px",
          fontWeight: "600",
          color: "#333",
        }}
      >
        Attendance Distribution
      </h3>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={histogramData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "No. of Students",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
            }}
            formatter={(value) => value}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "15px",
            }}
          />
          <Bar dataKey="count" fill="#3498db" name="Students" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

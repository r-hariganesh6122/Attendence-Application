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

export default function DashboardBarChart({
  breakdownData,
  cardTotalStudents,
}) {
  // Validate data consistency
  if (breakdownData && breakdownData.length > 0) {
    const sum = breakdownData.reduce((acc, item) => acc + (item.total || 0), 0);
    if (sum !== cardTotalStudents && cardTotalStudents > 0) {
      console.warn(
        `Bar chart data mismatch: breakdown sum (${sum}) != card total (${cardTotalStudents})`,
      );
    }
  }

  // Handle edge cases
  if (!breakdownData || breakdownData.length === 0) {
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
        No data available for bar chart
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
        Attendance Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={breakdownData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
            }}
            formatter={(value) => value.toFixed(0)}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "15px",
            }}
          />
          <Bar
            dataKey="total"
            fill="#3498db"
            name="Total Students"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="present"
            fill="#27ae60"
            name="Present Students"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

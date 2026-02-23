import React from "react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function DashboardPieChart({
  presentDays,
  absentDays,
  holidayDays,
}) {
  // Prepare data for pie chart
  const data = [
    { name: "Present", value: presentDays, count: presentDays },
    { name: "Absent", value: absentDays, count: absentDays },
    { name: "Holiday", value: holidayDays, count: holidayDays },
  ].filter((item) => item.value > 0); // Only show segments with value > 0

  // Color scheme: green for present, red for absent, orange for holiday
  const colors = ["#27ae60", "#e74c3c", "#f39c12"];

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label to show percentages on pie slices
  const renderCustomLabel = (entry) => {
    if (total === 0) return "";
    const percent = ((entry.value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  // Handle edge case: all values are 0
  if (data.length === 0) {
    return (
      <div
        style={{
          width: "40%",
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
        width: "40%",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "450px",
      }}
    >
      <h3
        style={{
          marginBottom: "15px",
          fontSize: "16px",
          fontWeight: "600",
          color: "#333",
          width: "100%",
          textAlign: "center",
        }}
      >
        Attendance Summary
      </h3>
      <ResponsiveContainer width="100%" height={380}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={90}
            innerRadius={55}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              fill: "#333",
            }}
          >
            {total}
          </text>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => `${value} students`}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "25px",
              fontSize: "13px",
            }}
            layout="horizontal"
            verticalAlign="bottom"
            formatter={(value, entry) => {
              const item = data.find((d) => d.name === value);
              return `${value} ${item ? item.count : 0}`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

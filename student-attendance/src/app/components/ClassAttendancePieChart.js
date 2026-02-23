import React from "react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ClassAttendancePieChart({
  aboveThreshold,
  belowThreshold,
  totalStudents = 0,
}) {
  // Prepare data for pie chart (>75% vs <75%)
  const data = [
    { name: ">75% Attendance", value: aboveThreshold, count: aboveThreshold },
    { name: "<75% Attendance", value: belowThreshold, count: belowThreshold },
  ].filter((item) => item.value > 0); // Only show segments with value > 0

  // Color scheme: green for above threshold, red for below threshold
  const colors = ["#27ae60", "#e74c3c"];

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
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
            }}
            formatter={(value, name, props) => [
              `${value} students`,
              props.payload.name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) =>
              `${entry.payload.name} (${entry.payload.count})`
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {totalStudents > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            textAlign: "center",
            width: "100%",
          }}
        >
          <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
            Total Students: <strong>{totalStudents}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

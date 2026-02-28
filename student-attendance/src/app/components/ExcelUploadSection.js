"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

export function ExcelUploadSection({
  title,
  onDownloadTemplate,
  onValidateFile,
  onProcessData,
  templateFileName,
}) {
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setValidationResult(null);
    setIsValidating(true);

    try {
      const result = await onValidateFile(file);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        success: false,
        validData: [],
        errors: [
          {
            row: 0,
            errors: [`Error reading file: ${error.message}`],
          },
        ],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadTemplate = () => {
    onDownloadTemplate();
  };

  const handleProcessValidData = async () => {
    if (!validationResult?.success || !validationResult?.validData?.length) {
      alert("No valid data to process");
      return;
    }

    setIsProcessing(true);
    try {
      await onProcessData(validationResult.validData);
      // Reset state after successful processing
      setShowUploadUI(false);
      setUploadedFile(null);
      setValidationResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      alert(`Error processing data: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrorFile = async () => {
    if (!validationResult?.errors?.length) return;

    if (!uploadedFile) {
      alert("File not found");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Create error map by row
        const errorMap = {};
        validationResult.errors.forEach(({ row, errors: rowErrors }) => {
          errorMap[row] = rowErrors.join("; ");
        });

        // Add error column
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        const newColIndex = range.e.c + 1;
        const headerCell = XLSX.utils.encode_cell({
          r: 0,
          c: newColIndex,
        });
        sheet[headerCell] = { t: "s", v: "ERRORS" };

        // Add error messages with red background
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
                font: { color: { rgb: "FFFFFFFF" }, bold: true }, // White bold text
              },
            };
          }
        }

        // Update range
        sheet["!ref"] = XLSX.utils.encode_range({
          s: range.s,
          e: { r: range.e.r, c: newColIndex },
        });

        // Adjust column widths
        sheet["!cols"] = (sheet["!cols"] || []).map((col) => ({ wch: 15 }));
        sheet["!cols"].push({ wch: 40 });

        XLSX.writeFile(workbook, `${templateFileName}_errors.xlsx`);
      };
      reader.readAsBinaryString(uploadedFile);
    } catch (error) {
      alert(`Error generating error file: ${error.message}`);
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f0f8ff",
        borderRadius: "8px",
        border: "2px dashed #1e90ff",
      }}
    >
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
          {title} - Bulk Upload
        </h4>
        <p
          style={{
            margin: "0",
            fontSize: "0.875rem",
            color: "#666",
            marginBottom: "10px",
          }}
        >
          Download the template, fill it with your data, and upload it back.
          Strict validation ensures data quality.
        </p>
      </div>

      {!showUploadUI ? (
        <button
          onClick={() => setShowUploadUI(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1e90ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "500",
          }}
        >
          + Add via Excel
        </button>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          {/* Download Template Section */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                color: "#333",
                fontSize: "0.9rem",
              }}
            >
              Step 1: Download Template
            </label>
            <button
              onClick={handleDownloadTemplate}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
            >
              📥 Download Excel Template
            </button>
          </div>

          {/* File Upload Section */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                color: "#333",
                fontSize: "0.9rem",
              }}
            >
              Step 2: Upload Filled Template
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isValidating}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                cursor: isValidating ? "not-allowed" : "pointer",
              }}
            />
            {uploadedFile && (
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                File: {uploadedFile.name}
              </p>
            )}
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                borderRadius: "4px",
                backgroundColor: validationResult.success
                  ? "#f0f9ff"
                  : "#fff5f5",
                border: `1px solid ${
                  validationResult.success ? "#1e90ff" : "#f44336"
                }`,
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px 0",
                  color: validationResult.success ? "#1e90ff" : "#f44336",
                  fontSize: "0.95rem",
                }}
              >
                {validationResult.success ? "✓" : "✗"} Validation Result
              </h4>

              <div style={{ fontSize: "0.85rem", marginBottom: "10px" }}>
                <p style={{ margin: "5px 0" }}>
                  <strong>Total Rows:</strong> {validationResult.totalRows}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Valid Rows:</strong>{" "}
                  <span style={{ color: "#28a745", fontWeight: "bold" }}>
                    {validationResult.validData.length}
                  </span>
                </p>
                {validationResult.errors.length > 0 && (
                  <p style={{ margin: "5px 0" }}>
                    <strong>Error Rows:</strong>{" "}
                    <span style={{ color: "#f44336", fontWeight: "bold" }}>
                      {validationResult.errors.length}
                    </span>
                  </p>
                )}
              </div>

              {/* Error Details */}
              {validationResult.errors.length > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    backgroundColor: "#fafafa",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontWeight: "bold",
                      color: "#333",
                      fontSize: "0.85rem",
                    }}
                  >
                    Errors Found:
                  </p>
                  {validationResult.errors.map((error, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "8px",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "0.8rem",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          color: "#f44336",
                          fontWeight: "bold",
                        }}
                      >
                        Row {error.row}:
                      </p>
                      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                        {error.errors.map((err, errIdx) => (
                          <li
                            key={errIdx}
                            style={{ margin: "2px 0", color: "#d32f2f" }}
                          >
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {validationResult.success &&
                validationResult.validData.length > 0 ? (
                  <>
                    <button
                      onClick={handleProcessValidData}
                      disabled={isProcessing}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                    >
                      {isProcessing ? "Processing..." : "✓ Import Data"}
                    </button>
                  </>
                ) : null}

                {validationResult.errors.length > 0 && (
                  <button
                    onClick={handleDownloadErrorFile}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    📥 Download Error Report
                  </button>
                )}

                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setValidationResult(null);
                    setShowUploadUI(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isValidating && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "4px",
                color: "#856404",
                fontSize: "0.85rem",
              }}
            >
              Validating file... Please wait.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

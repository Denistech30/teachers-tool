import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Grid,
  Paper,
  Modal,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Subject {
  name: string;
  total: number;
}

interface Mark {
  [subject: string]: number | "";
}

interface Result {
  student: string;
  totalMarks: number;
  average: number;
  rank: number;
}

function App() {
  // Student state
  const [students, setStudents] = useState<string[]>([]);
  const [newStudentName, setNewStudentName] = useState<string>("");
  const [editStudentIndex, setEditStudentIndex] = useState<number | null>(null);
  const [editStudentValue, setEditStudentValue] = useState<string>("");
  const [studentsOpen, setStudentsOpen] = useState<boolean>(false);

  // Subject state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [newSubjectTotal, setNewSubjectTotal] = useState<string>("");
  const [editSubjectIndex, setEditSubjectIndex] = useState<number | null>(null);
  const [editSubjectValue, setEditSubjectValue] = useState<Subject>({
    name: "",
    total: 0,
  });
  const [subjectsOpen, setSubjectsOpen] = useState<boolean>(false);

  // Marks and results state
  const [marks, setMarks] = useState<Mark[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [classAverage, setClassAverage] = useState<number | null>(null);
  const [passPercentage, setPassPercentage] = useState<number | null>(null);

  const PASSING_MARK = 10;

  // Load data from localStorage
  useEffect(() => {
    const savedStudents = localStorage.getItem("students");
    const savedSubjects = localStorage.getItem("subjects");
    const savedMarks = localStorage.getItem("marks");

    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }
    if (savedMarks) {
      setMarks(JSON.parse(savedMarks));
    } else if (savedStudents && !savedMarks) {
      setMarks(JSON.parse(savedStudents).map(() => ({})));
    }
  }, []);

  // Save students to localStorage
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem("students", JSON.stringify(students));
    }
  }, [students]);

  // Save subjects to localStorage
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem("subjects", JSON.stringify(subjects));
    }
  }, [subjects]);

  // Save marks to localStorage
  useEffect(() => {
    if (marks.length > 0) {
      localStorage.setItem("marks", JSON.stringify(marks));
    }
  }, [marks]);

  // Reset all data
  const handleResetData = () => {
    localStorage.clear();
    setStudents([]);
    setSubjects([]);
    setMarks([]);
    setResults([]);
    setClassAverage(null);
    setPassPercentage(null);
    setNewStudentName("");
    setNewSubjectName("");
    setNewSubjectTotal("");
    setEditStudentIndex(null);
    setEditStudentValue("");
    setEditSubjectIndex(null);
    setEditSubjectValue({ name: "", total: 0 });
  };

  // Student handlers
  const handleAddStudent = () => {
    if (newStudentName.trim() === "") return;
    const updatedStudents = [...students, newStudentName.trim()];
    setStudents(updatedStudents);
    setMarks((prevMarks) => [...prevMarks, {}]);
    setNewStudentName("");
  };

  const handleEditStudent = (index: number) => {
    setEditStudentIndex(index);
    setEditStudentValue(students[index]);
  };

  const handleSaveStudentEdit = () => {
    if (editStudentIndex === null || editStudentValue.trim() === "") return;
    const updatedStudents = [...students];
    updatedStudents[editStudentIndex] = editStudentValue.trim();
    setStudents(updatedStudents);
    setEditStudentIndex(null);
    setEditStudentValue("");
  };

  const handleDeleteStudent = (index: number) => {
    const updatedStudents = students.filter((_, i) => i !== index);
    const updatedMarks = marks.filter((_, i) => i !== index);
    setStudents(updatedStudents);
    setMarks(updatedMarks);
  };

  // Subject handlers
  const handleAddSubject = () => {
    const total = parseInt(newSubjectTotal, 10);
    if (newSubjectName.trim() === "" || isNaN(total) || total <= 0) return;
    const newSubject: Subject = { name: newSubjectName.trim(), total };
    setSubjects([...subjects, newSubject]);
    setNewSubjectName("");
    setNewSubjectTotal("");
  };

  const handleEditSubject = (index: number) => {
    setEditSubjectIndex(index);
    setEditSubjectValue(subjects[index]);
  };

  const handleSaveSubjectEdit = () => {
    if (
      editSubjectIndex === null ||
      editSubjectValue.name.trim() === "" ||
      editSubjectValue.total <= 0
    )
      return;
    const updatedSubjects = [...subjects];
    updatedSubjects[editSubjectIndex] = {
      name: editSubjectValue.name.trim(),
      total: editSubjectValue.total,
    };
    setSubjects(updatedSubjects);
    setEditSubjectIndex(null);
    setEditSubjectValue({ name: "", total: 0 });
  };

  const handleDeleteSubject = (index: number) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
    const updatedMarks = marks.map((studentMarks) => {
      const newMarks = { ...studentMarks };
      delete newMarks[subjects[index].name];
      return newMarks;
    });
    setMarks(updatedMarks);
  };

  // Marks and results handlers
  const handleMarkChange = (
    studentIndex: number,
    subject: string,
    value: string,
    maxTotal: number
  ) => {
    const numValue = value === "" ? "" : Number(value);
    if (numValue === "" || (numValue >= 0 && numValue <= maxTotal)) {
      const updatedMarks = [...marks];
      updatedMarks[studentIndex] = {
        ...updatedMarks[studentIndex],
        [subject]: numValue,
      };
      setMarks(updatedMarks);
    }
  };

  const calculateResults = () => {
    const studentResults = students.map((student, index) => {
      const studentMarks = marks[index];
      let totalMarks = 0;
      let totalScore = 0;

      subjects.forEach((subject) => {
        const mark = studentMarks[subject.name];
        const rawMark = typeof mark === "number" ? mark : 0;
        totalMarks += rawMark;
        const scaledScore = (rawMark / subject.total) * 20;
        totalScore += scaledScore;
      });

      const average = subjects.length > 0 ? totalScore / subjects.length : 0;
      return { student, totalMarks, average };
    });

    const sortedResults = [...studentResults].sort(
      (a, b) => b.average - a.average
    );
    const resultsWithRank = sortedResults.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

    const totalAverage = studentResults.reduce(
      (sum, { average }) => sum + average,
      0
    );
    const classAvg = totalAverage / students.length || 0;

    const passedCount = studentResults.filter(
      ({ average }) => average >= PASSING_MARK
    ).length;
    const passPerc = (passedCount / students.length) * 100 || 0;

    setResults(resultsWithRank);
    setClassAverage(classAvg);
    setPassPercentage(passPerc);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Teacher's Tool - Results", 20, 20);

    const tableData = results.map((result) => [
      result.rank.toString(),
      result.student,
      result.totalMarks.toString(),
      result.average.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Rank", "Student", "Total Marks", "Average (/20)"]],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.text(
      `Class Average: ${classAverage?.toFixed(2)} / 20`,
      20,
      finalY + 10
    );
    doc.text(
      `Pass Percentage: ${passPercentage?.toFixed(2)}%`,
      20,
      finalY + 20
    );

    doc.save("results.pdf");
  };

  const hasMarks = marks.some((studentMarks) =>
    Object.values(studentMarks).some((mark) => mark !== "")
  );

  // Modal styling with responsive adjustments
  const modalStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: "80%", md: 600 }, // Responsive width
    maxWidth: "100%", // Prevent overflow on small screens
    bgcolor: "background.paper",
    boxShadow: 24,
    p: { xs: 2, sm: 4 }, // Smaller padding on mobile
    borderRadius: 2,
    maxHeight: "80vh",
    overflowY: "auto" as const,
  };

  return (
    <Container maxWidth="lg" sx={{ padding: { xs: 1, sm: 2 } }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Teacher's Tool
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => setStudentsOpen(true)}
              sx={{ minWidth: { xs: 100, sm: 120 } }}
            >
              Students
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setSubjectsOpen(true)}
              disabled={students.length === 0}
              sx={{ minWidth: { xs: 100, sm: 120 } }}
            >
              Fill Marks
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleResetData}
              sx={{ minWidth: { xs: 100, sm: 120 } }}
            >
              Reset Data
            </Button>
          </Box>
        </Grid>

        {/* Marks Entry Table */}
        {subjects.length > 0 && students.length > 0 && (
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, mt: 2 }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Enter Marks
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table
                  sx={{
                    bgcolor: "white",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    "& th, & td": {
                      borderBottom: "1px solid #e0e0e0",
                      padding: { xs: "4px", sm: "8px" },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 100, sm: 150 },
                          position: "sticky",
                          left: 0,
                          bgcolor: "white",
                          zIndex: 1,
                        }}
                      >
                        Student
                      </TableCell>
                      {subjects.map((subject) => (
                        <TableCell
                          key={subject.name}
                          sx={{
                            fontWeight: "bold",
                            minWidth: { xs: 80, sm: 120 },
                          }}
                        >
                          {subject.name} (/{subject.total})
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student, studentIndex) => (
                      <TableRow key={student}>
                        <TableCell
                          sx={{
                            verticalAlign: "middle",
                            position: "sticky",
                            left: 0,
                            bgcolor: "white",
                            zIndex: 1,
                          }}
                        >
                          {student}
                        </TableCell>
                        {subjects.map((subject) => {
                          const mark = marks[studentIndex]?.[subject.name];
                          const markValue = typeof mark === "number" ? mark : 0;
                          const isBelowAverage = markValue < subject.total / 2;
                          return (
                            <TableCell key={subject.name}>
                              <TextField
                                type="number"
                                size="small"
                                value={mark ?? ""}
                                onChange={(e) =>
                                  handleMarkChange(
                                    studentIndex,
                                    subject.name,
                                    e.target.value,
                                    subject.total
                                  )
                                }
                                inputProps={{ min: 0, max: subject.total }}
                                sx={{
                                  width: { xs: "50px", sm: "80px" },
                                  "& .MuiInputBase-input": {
                                    color: isBelowAverage ? "red" : "inherit",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      borderColor: isBelowAverage
                                        ? "red"
                                        : "inherit",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: isBelowAverage
                                        ? "red"
                                        : "inherit",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: isBelowAverage
                                        ? "red"
                                        : "primary.main",
                                    },
                                  },
                                }}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={calculateResults}
                disabled={!hasMarks}
                sx={{ mt: 2, minWidth: { xs: 100, sm: 120 } }}
              >
                Calculate
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, mt: 2 }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Results
              </Typography>
              <Box sx={{ overflowXânsito: "auto" }}>
                <Table
                  sx={{
                    bgcolor: "white",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    "& th, & td": {
                      borderBottom: "1px solid #e0e0e0",
                      padding: { xs: "4px", sm: "8px" },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 40, sm: 60 },
                        }}
                      >
                        Rank
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 100, sm: 150 },
                          position: "sticky",
                          left: 0,
                          bgcolor: "white",
                          zIndex: 1,
                        }}
                      >
                        Student
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 80, sm: 120 },
                        }}
                      >
                        Total Marks
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          minWidth: { xs: 80, sm: 120 },
                        }}
                      >
                        Average (/20)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.student}>
                        <TableCell>{result.rank}</TableCell>
                        <TableCell
                          sx={{
                            position: "sticky",
                            left: 0,
                            bgcolor: "white",
                            zIndex: 1,
                          }}
                        >
                          {result.student}
                        </TableCell>
                        <TableCell>{result.totalMarks}</TableCell>
                        <TableCell
                          sx={{
                            color: result.average < 10 ? "red" : "inherit",
                          }}
                        >
                          {result.average.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Typography
                variant="body1"
                sx={{ mt: 2, fontSize: { xs: "0.75rem", sm: "1rem" } }}
              >
                Class Average: {classAverage?.toFixed(2)} / 20
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
              >
                Pass Percentage: {passPercentage?.toFixed(2)}%
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownloadPDF}
                sx={{ mt: 2, minWidth: { xs: 100, sm: 120 } }}
              >
                Download PDF
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Student Modal */}
        <Modal open={studentsOpen} onClose={() => setStudentsOpen(false)}>
          <Box sx={modalStyle}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Student List
              </Typography>
              <IconButton onClick={() => setStudentsOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Table
              sx={{
                "& th, & td": {
                  padding: { xs: "4px", sm: "8px" },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editStudentIndex === index ? (
                        <TextField
                          value={editStudentValue}
                          onChange={(e) => setEditStudentValue(e.target.value)}
                          size="small"
                          onBlur={handleSaveStudentEdit}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleSaveStudentEdit();
                          }}
                          autoFocus
                          sx={{ width: { xs: "100%", sm: "200px" } }}
                        />
                      ) : (
                        student
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {editStudentIndex === index ? (
                          <IconButton onClick={handleSaveStudentEdit}>
                            <SaveIcon color="success" fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton onClick={() => handleEditStudent(index)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton onClick={() => handleDeleteStudent(index)}>
                          <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <TextField
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter student name"
                      size="small"
                      sx={{ width: { xs: "100%", sm: "200px" } }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={handleAddStudent}
                      disabled={newStudentName.trim() === ""}
                    >
                      <AddIcon color="primary" fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Modal>

        {/* Subject Modal */}
        <Modal open={subjectsOpen} onClose={() => setSubjectsOpen(false)}>
          <Box sx={modalStyle}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Subject List
              </Typography>
              <IconButton onClick={() => setSubjectsOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Table
              sx={{
                "& th, & td": {
                  padding: { xs: "4px", sm: "8px" },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Subject Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Total Score</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editSubjectIndex === index ? (
                        <TextField
                          value={editSubjectValue.name}
                          onChange={(e) =>
                            setEditSubjectValue({
                              ...editSubjectValue,
                              name: e.target.value,
                            })
                          }
                          size="small"
                          autoFocus
                          sx={{ width: { xs: "100%", sm: "150px" } }}
                        />
                      ) : (
                        subject.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editSubjectIndex === index ? (
                        <TextField
                          type="number"
                          value={editSubjectValue.total}
                          onChange={(e) =>
                            setEditSubjectValue({
                              ...editSubjectValue,
                              total: parseInt(e.target.value) || 0,
                            })
                          }
                          size="small"
                          sx={{ width: { xs: "60px", sm: "80px" } }}
                        />
                      ) : (
                        subject.total
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {editSubjectIndex === index ? (
                          <IconButton onClick={handleSaveSubjectEdit}>
                            <SaveIcon color="success" fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton onClick={() => handleEditSubject(index)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton onClick={() => handleDeleteSubject(index)}>
                          <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <TextField
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Enter subject name"
                      size="small"
                      sx={{ width: { xs: "100%", sm: "150px" } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={newSubjectTotal}
                      onChange={(e) => setNewSubjectTotal(e.target.value)}
                      placeholder="Total"
                      size="small"
                      sx={{ width: { xs: "60px", sm: "80px" } }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={handleAddSubject}
                      disabled={
                        newSubjectName.trim() === "" ||
                        newSubjectTotal.trim() === "" ||
                        parseInt(newSubjectTotal) <= 0
                      }
                    >
                      <AddIcon color="primary" fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Modal>
      </Grid>
    </Container>
  );
}

export default App;

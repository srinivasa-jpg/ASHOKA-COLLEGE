(() => {
  const MYSQL_API_BASE = "http://localhost:3000";

  function romanYear(value) {
    const map = { "1": "I", "2": "II", "3": "III", "4": "IV" };
    return map[String(value)] || value || "";
  }

  function romanSemester(value) {
    const map = { "1": "I", "2": "II" };
    return map[String(value)] || value || "";
  }

  async function syncStudentsFromMySQL() {
    try {
      const response = await fetch(`${MYSQL_API_BASE}/api/students`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Student API returned HTTP ${response.status}`);
      }

      const students = await response.json();
      if (!Array.isArray(students)) {
        throw new Error("Student API did not return an array");
      }

      state.students = students.map(student => ({
        id: Number(student.id ?? student.student_id),
        hall: student.hall ?? student.hall_ticket ?? "",
        name: student.name ?? "",
        branch: student.branch ?? "",
        year: romanYear(student.year ?? student.study_year),
        sem: romanSemester(student.sem ?? student.semester),
        section: student.section ?? "",
        regulation: student.regulation ?? "",
        status: student.status ?? "Active"
      }));

      renderStudents();
      renderDashboard();
      populateStudentSelects();
      populateHallSelects();

      console.info(`Loaded ${state.students.length} students from MySQL.`);
      return true;
    } catch (error) {
      console.error("Unable to load students from MySQL:", error);
      if (typeof toast === "function") {
        toast("MySQL student data unavailable. Start the Node.js server.");
      }
      return false;
    }
  }

  const originalNavigate = navigate;
  navigate = function(view) {
    const result = originalNavigate(view);
    if (view === "students") {
      syncStudentsFromMySQL();
    }
    return result;
  };

  window.syncStudentsFromMySQL = syncStudentsFromMySQL;
  syncStudentsFromMySQL();
})();

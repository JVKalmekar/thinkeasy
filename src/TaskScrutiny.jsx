import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";

function TaskScrutiny() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "topics"));
        const allTopics = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (Array.isArray(data.topics)) {
            allTopics.push(...data.topics.map((topic) => ({ ...topic, id: docSnap.id })));
          }
        });
        setTopics(allTopics);
      } catch (error) {
        console.error("Error loading topics for Task Scrutiny:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

const normalizeTitle = (value) => String(value || "").trim();
  const isPastDate = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getSeverity = (category) => {
    switch (category) {
      case "missing-title":
      case "duplicate":
      case "cross-project":
      case "overdue":
        return "High";
      case "schedule":
      case "empty-project":
        return "Medium";
      case "single-task-project":
      case "short-title":
        return "Low";
      default:
        return "Medium";
    }
  };

  const categoryLabels = {
    "missing-title": "Missing Title",
    "short-title": "Short Title",
    "duplicate": "Duplicate Title",
    "cross-project": "Cross-Project Duplication",
    "schedule": "Schedule Issue",
    "overdue": "Overdue Task",
    "empty-project": "Empty Project",
    "single-task-project": "Single Task Project"
  };

  useEffect(() => {
    if (!loading) {
      const detected = [];
      const crossProjectTaskMap = {};

      topics.forEach((topic, topicIndex) => {
        const topicName = topic.name || `Topic ${topicIndex + 1}`;
        const works = Array.isArray(topic.postInteractions?.works)
          ? topic.postInteractions.works
          : [];

        works.forEach((project, projectIndex) => {
          const projectNumber = project.projectNumber || projectIndex + 1;
          const projectLabel = `Project-${projectNumber}`;
          const projectName = project.name || "(unnamed project)";
          const tasks = Array.isArray(project.tasks) ? project.tasks : [];
          const projectTitleCount = {};

          if (tasks.length === 0) {
            detected.push({
              category: "empty-project",
              topicName,
              projectLabel,
              projectName,
              message: "No tasks have been added to this project.",
              recommendation: "Add tasks to capture the work needed for this project, or skip if it's intentionally empty."
            });
          }

          if (tasks.length === 1) {
            detected.push({
              category: "single-task-project",
              topicName,
              projectLabel,
              projectName,
              message: "This project only defines one task.",
              recommendation: "Consider breaking work into multiple tasks if there are distinct steps involved."
            });
          }

          tasks.forEach((task, taskIndex) => {
            const title = normalizeTitle(task.title);
            const normalizedKey = title.toLowerCase();

            if (!title) {
              detected.push({
                category: "missing-title",
                topicName,
                projectLabel,
                projectName,
                taskIndex: taskIndex + 1,
                message: "Task missing a title.",
                recommendation: "Provide a meaningful title for this task so it is easy to track."
              });
              return;
            }

            if (title.length < 8) {
              detected.push({
                category: "short-title",
                topicName,
                projectLabel,
                projectName,
                taskIndex: taskIndex + 1,
                message: `Task title is very short: "${title}".`,
                recommendation: "Use a more descriptive title so the task is clear and actionable."
              });
            }

            projectTitleCount[normalizedKey] = (projectTitleCount[normalizedKey] || 0) + 1;
            crossProjectTaskMap[normalizedKey] = crossProjectTaskMap[normalizedKey] || new Set();
            crossProjectTaskMap[normalizedKey].add(`${topicName}::${projectLabel}`);
          });

          Object.entries(projectTitleCount).forEach(([titleKey, count]) => {
            if (count > 1) {
              detected.push({
                category: "duplicate",
                topicName,
                projectLabel,
                projectName,
                message: `Duplicate task title found within this project: "${titleKey}" appears ${count} times.",
                recommendation: "Use unique task titles or merge duplicate tasks to avoid confusion."
              });
            }
          });

          const plannedDate = project.status?.plannedDate;
          const dueDate = project.status?.dueDate;
          const completedDate = project.status?.completedDate;

          if (plannedDate && dueDate && dueDate < plannedDate) {
            detected.push({
              category: "schedule",
              topicName,
              projectLabel,
              projectName,
              message: `Due date ${dueDate} is before planned date ${plannedDate}.",
              recommendation: "Adjust the due date so it falls after the planned date to keep schedules realistic."
            });
          }

          if (plannedDate && !dueDate) {
            detected.push({
              category: "schedule",
              topicName,
              projectLabel,
              projectName,
              message: "Planned date is set but due date is missing.",
              recommendation: "Add a due date to complete the project timeline."
            });
          }

          if (dueDate && isPastDate(dueDate) && !completedDate) {
            detected.push({
              category: "overdue",
              topicName,
              projectLabel,
              projectName,
              message: `Project due date ${dueDate} is already past.",
              recommendation: "Review overdue work and update the schedule or completion status."
            });
          }
        });
      });

      Object.entries(crossProjectTaskMap).forEach(([titleKey, projectSet]) => {
        if (titleKey && projectSet.size > 1) {
          const [sample] = Array.from(projectSet);
          const [sampleTopic, sampleProject] = sample.split("::");
          detected.push({
            category: "cross-project",
            topicName: sampleTopic,
            projectLabel: `${sampleProject} (and others)`,
            projectName: "Multiple projects",
            message: `Task title "${titleKey}" appears across multiple projects.",
            recommendation: "Review whether this is the same task repeated in different projects, and consolidate or rename if appropriate."
          });
        }
      });

      setIssues(detected);
    }
  }, [loading, topics]);

  const groupedIssues = issues.reduce((acc, issue) => {
    const category = issue.category || "other";
    acc[category] = acc[category] || [];
    acc[category].push({ ...issue, severity: getSeverity(category) });
    return acc;
  }, {});

  const categoryOrder = [
    "missing-title",
    "duplicate",
    "cross-project",
    "overdue",
    "schedule",
    "empty-project",
    "single-task-project",
    "short-title"
  ];

  const severityStyles = {
    High: { backgroundColor: "#ffebee", color: "#c62828" },
    Medium: { backgroundColor: "#fff3e0", color: "#ef6c00" },
    Low: { backgroundColor: "#e8f5e9", color: "#2e7d32" }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Scrutiny</h2>
      <p>
        Review task-level conflicts for your project to-do lists and get recommendations for improvement.
      </p>
      <nav style={{ marginBottom: "15px" }}>
        <Link to="../dynamictopics">Dynamic Topics</Link> |
        <Link to="../topicsupdate" style={{ marginLeft: "8px" }}>Topics Update</Link> |
        <Link to="../taskscrutiny" style={{ marginLeft: "8px" }}>Task Scrutiny</Link>
      </nav>

      <div style={{ marginBottom: "20px", backgroundColor: "#f5f5f5", padding: "15px", borderRadius: "6px" }}>
        <h4>Recommended strategies</h4>
        <ul>
          <li>Use clear and unique task titles.</li>
          <li>Keep task descriptions meaningful so actions are easy to understand.</li>
          <li>Align due dates after planned dates.</li>
          <li>Avoid duplicate tasks and remove empty placeholder tasks.</li>
        </ul>
      </div>

      {loading ? (
        <p>Loading topics for scrutiny…</p>
      ) : issues.length === 0 ? (
        <div style={{ backgroundColor: "#e8f5e9", padding: "15px", borderRadius: "6px" }}>
          <h4>✅ No task conflicts detected</h4>
          <p>Your current task lists appear clean, with no empty titles, duplicate task labels, or date mismatches in recorded projects.</p>
        </div>
      ) : (
        <div>
          <h4>Detected issues ({issues.length})</h4>
          {Object.keys(groupedIssues)
            .filter((category) => groupedIssues[category].length > 0)
            .sort((a, b) => {
              const aIndex = categoryOrder.indexOf(a);
              const bIndex = categoryOrder.indexOf(b);
              if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
              if (aIndex === -1) return 1;
              if (bIndex === -1) return -1;
              return aIndex - bIndex;
            })
            .map((category) => (
              <section key={category} style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h5 style={{ margin: 0 }}>{categoryLabels[category] || category}</h5>
                  <span style={{ fontWeight: "bold", padding: "5px 10px", borderRadius: "12px", ...severityStyles[getSeverity(category)] }}>
                    {getSeverity(category)}
                  </span>
                </div>
                {groupedIssues[category].map((issue, index) => (
                  <div
                    key={`${category}-${index}`}
                    style={{
                      marginBottom: "12px",
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      backgroundColor: "#ffffff"
                    }}
                  >
                    <strong>{issue.topicName}</strong>
                    <p style={{ margin: "4px 0" }}>{issue.projectLabel} — {issue.projectName}</p>
                    {issue.taskIndex && <p style={{ margin: "4px 0" }}>Task #{issue.taskIndex}</p>}
                    <p style={{ margin: "4px 0" }}><strong>Issue:</strong> {issue.message}</p>
                    <p style={{ margin: "4px 0" }}><strong>Recommendation:</strong> {issue.recommendation}</p>
                  </div>
                ))}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

export default TaskScrutiny;

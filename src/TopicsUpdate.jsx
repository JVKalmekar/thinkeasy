import React, { useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function TopicsUpdate() {
  const [topicIds, setTopicIds] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topics, setTopics] = useState([
    {
      name: "",
      suitable: [],
      unsuitable: [],
      postInteractions: {
        works: [],
        budget: {
          initialCapital: 0,
          newCapitalAdditions: [],
          outgoings: 0
        },
        experiences: []
      }
    }
  ]);
  const [revision, setRevision] = useState(0);

  // Unhide topics - fetch all topic IDs
  const unhideTopics = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "topics"));
      const ids = [];
      querySnapshot.forEach((doc) => {
        ids.push(doc.id);
      });
      setTopicIds(ids);
    } catch (error) {
      console.error("Error fetching topics: ", error);
    }
  };

  // Load topic by ID
  const loadTopic = async (id) => {
    try {
      const docRef = doc(db, "topics", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure postInteractions structure exists for backward compatibility
        const topicsWithPostInteractions = data.topics.map(topic => ({
          ...topic,
          postInteractions: topic.postInteractions || {
            works: [],
            budget: { initialCapital: 0, newCapitalAdditions: [], outgoings: 0 },
            experiences: []
          }
        }));
        setTopics(topicsWithPostInteractions);
        setRevision(data.revision);
        setSelectedTopic(id);
      } else {
        alert("No such document!");
      }
    } catch (error) {
      console.error("Error loading topic: ", error);
    }
  };

  // Update topic name
  const updateTopicName = (index, value) => {
    const updated = [...topics];
    updated[index].name = value;
    setTopics(updated);
  };

  // Add suitable/unsuitable item
  const addItem = (topicIndex, type) => {
    const updated = [...topics];
    updated[topicIndex][type].push({ name: "", value: "" });
    setTopics(updated);
  };

  // Remove suitable/unsuitable item
  const removeItem = (topicIndex, type, itemIndex) => {
    const updated = [...topics];
    updated[topicIndex][type].splice(itemIndex, 1);
    setTopics(updated);
  };

  // Update item name/value
  const updateItem = (topicIndex, type, itemIndex, field, value) => {
    const updated = [...topics];
    updated[topicIndex][type][itemIndex][field] = value;
    setTopics(updated);
  };

  // Calculate totals
  const getTotal = (items) => {
    return items.reduce((sum, item) => {
      const num = parseFloat(item.value);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  // Add a new main topic
  const addTopic = () => {
    setTopics([
      ...topics,
      {
        name: "",
        suitable: [],
        unsuitable: [],
        postInteractions: {
          works: [],
          budget: { initialCapital: 0, newCapitalAdditions: [], outgoings: 0 },
          experiences: []
        }
      }
    ]);
  };

  // Remove a main topic
  const removeTopic = (index) => {
    const updated = [...topics];
    updated.splice(index, 1);
    setTopics(updated);
  };

  // ====== Part-2: Post-Interactions Helper Functions ======
  
  // Works/Missions Management
  const addWork = (topicIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works.push({
      title: "",
      description: "",
      status: {
        plannedDate: "",
        dueDate: "",
        postponedDate: "",
        pendingDate: "",
        completedDate: ""
      },
      criteria: {
        implementable: [],
        nonImplementable: []
      },
      budgetAssigned: 0
    });
    setTopics(updated);
  };

  const removeWork = (topicIndex, workIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works.splice(workIndex, 1);
    setTopics(updated);
  };

  const updateWork = (topicIndex, workIndex, field, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex][field] = value;
    setTopics(updated);
  };

  const updateWorkStatus = (topicIndex, workIndex, statusField, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex].status[statusField] = value;
    setTopics(updated);
  };

  const addCriteria = (topicIndex, workIndex, criteriaType) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex].criteria[criteriaType].push("");
    setTopics(updated);
  };

  const updateCriteria = (topicIndex, workIndex, criteriaType, criteriaIndex, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex].criteria[criteriaType][criteriaIndex] = value;
    setTopics(updated);
  };

  const removeCriteria = (topicIndex, workIndex, criteriaType, criteriaIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex].criteria[criteriaType].splice(criteriaIndex, 1);
    setTopics(updated);
  };

  // Budget Management
  const updateInitialCapital = (topicIndex, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.budget.initialCapital = parseFloat(value) || 0;
    setTopics(updated);
  };

  const addCapitalAddition = (topicIndex, amount) => {
    const updated = [...topics];
    if (amount > 0) {
      updated[topicIndex].postInteractions.budget.newCapitalAdditions.push({
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0]
      });
    }
    setTopics(updated);
  };

  const removeCapitalAddition = (topicIndex, additionIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.budget.newCapitalAdditions.splice(additionIndex, 1);
    setTopics(updated);
  };

  const updateOutgoings = (topicIndex, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.budget.outgoings = parseFloat(value) || 0;
    setTopics(updated);
  };

  const updateBudgetAssigned = (topicIndex, workIndex, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.works[workIndex].budgetAssigned = parseFloat(value) || 0;
    setTopics(updated);
  };

  // Calculate Budget Totals
  const calculateBudgetTotals = (topicIndex) => {
    const postInteractions = topics[topicIndex].postInteractions;
    const initialCapital = postInteractions.budget.initialCapital;
    const additionalCapital = postInteractions.budget.newCapitalAdditions.reduce((sum, cap) => sum + cap.amount, 0);
    const totalCapital = initialCapital + additionalCapital;
    const outgoings = postInteractions.budget.outgoings;
    const assignedBudget = postInteractions.works.reduce((sum, work) => sum + work.budgetAssigned, 0);
    const balance = totalCapital - outgoings - assignedBudget;

    return {
      initialCapital,
      additionalCapital,
      totalCapital,
      outgoings,
      assignedBudget,
      balance
    };
  };

  // Experience Management
  const addExperience = (topicIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences.push({
      title: "",
      description: "",
      skills: []
    });
    setTopics(updated);
  };

  const removeExperience = (topicIndex, experienceIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences.splice(experienceIndex, 1);
    setTopics(updated);
  };

  const updateExperience = (topicIndex, experienceIndex, field, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences[experienceIndex][field] = value;
    setTopics(updated);
  };

  const addExperienceSkill = (topicIndex, experienceIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences[experienceIndex].skills.push("");
    setTopics(updated);
  };

  const updateExperienceSkill = (topicIndex, experienceIndex, skillIndex, value) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences[experienceIndex].skills[skillIndex] = value;
    setTopics(updated);
  };

  const removeExperienceSkill = (topicIndex, experienceIndex, skillIndex) => {
    const updated = [...topics];
    updated[topicIndex].postInteractions.experiences[experienceIndex].skills.splice(skillIndex, 1);
    setTopics(updated);
  };

  // Save updated topic
  const saveTopic = async () => {
    try {
      const docRef = doc(db, "topics", selectedTopic);
      await updateDoc(docRef, {
        topics: topics,
        revision: revision + 1,
        updatedAt: new Date()
      });
      alert("Topic updated successfully!");
      setRevision(revision + 1);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Error updating topic.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Topics Update</h2>
      <button onClick={unhideTopics}>Unhide</button>
      {topicIds.length > 0 && (
        <div>
          <h3>Topic IDs:</h3>
          <ul>
            {topicIds.map((id) => (
              <li key={id}>
                <button onClick={() => loadTopic(id)}>{id}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedTopic && (
        <div>
          <h3>Editing Topic: {selectedTopic} (Revision: {revision})</h3>
          {topics.map((topic, tIndex) => (
            <div
              key={tIndex}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "15px"
              }}
            >
              <div>
                <label>Main Topic: </label>
                <input
                  type="text"
                  value={topic.name}
                  onChange={(e) => updateTopicName(tIndex, e.target.value)}
                  placeholder="Enter main topic"
                />
                <button onClick={() => removeTopic(tIndex)}>Remove Topic</button>
              </div>

              {/* Suitable Items */}
              <h4>Suitable Items</h4>
              {topic.suitable.map((item, iIndex) => (
                <div key={iIndex}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(tIndex, "suitable", iIndex, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      updateItem(tIndex, "suitable", iIndex, "value", e.target.value)
                    }
                  />
                  <button
                    onClick={() => removeItem(tIndex, "suitable", iIndex)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(tIndex, "suitable")}>
                Add Suitable Item
              </button>
              <p>Total Suitable: {getTotal(topic.suitable)}</p>

              {/* Unsuitable Items */}
              <h4>Unsuitable Items</h4>
              {topic.unsuitable.map((item, iIndex) => (
                <div key={iIndex}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(tIndex, "unsuitable", iIndex, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      updateItem(tIndex, "unsuitable", iIndex, "value", e.target.value)
                    }
                  />
                  <button
                    onClick={() => removeItem(tIndex, "unsuitable", iIndex)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(tIndex, "unsuitable")}>
                Add Unsuitable Item
              </button>
              <p>Total Unsuitable: {getTotal(topic.unsuitable)}</p>

              {/* Comparison */}
              <p>
                {getTotal(topic.suitable) > getTotal(topic.unsuitable)
                  ? "✅ More Suitable"
                  : getTotal(topic.suitable) < getTotal(topic.unsuitable)
                  ? "❌ More Unsuitable"
                  : "⚖ Equal"}
              </p>

              {/* ====== Part-2: Post-Interactions Section ====== */}
              <div style={{ marginTop: "30px", borderTop: "3px solid #ff6b6b", paddingTop: "20px" }}>
                <h3>📋 Part-2: Post-Interactions</h3>

                {/* Works/Missions Section */}
                <div style={{ marginBottom: "20px" }}>
                  <h4>🎯 Works / Missions - To Do List</h4>
                  {topic.postInteractions.works.map((work, wIndex) => (
                    <div
                      key={wIndex}
                      style={{
                        border: "1px solid #ddd",
                        padding: "15px",
                        marginBottom: "15px",
                        backgroundColor: "#f9f9f9"
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Work Title"
                        value={work.title}
                        onChange={(e) => updateWork(tIndex, wIndex, "title", e.target.value)}
                        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                      />
                      <textarea
                        placeholder="Work Description"
                        value={work.description}
                        onChange={(e) => updateWork(tIndex, wIndex, "description", e.target.value)}
                        style={{ width: "100%", padding: "8px", marginBottom: "10px", minHeight: "80px" }}
                      />

                      {/* Status Dates */}
                      <div style={{ backgroundColor: "#f0f0f0", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
                        <h5>📅 Work Status Dates:</h5>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label>Planned Date:</label>
                            <input
                              type="date"
                              value={work.status.plannedDate}
                              onChange={(e) => updateWorkStatus(tIndex, wIndex, "plannedDate", e.target.value)}
                              style={{ width: "100%", padding: "5px" }}
                            />
                          </div>
                          <div>
                            <label>Due Date:</label>
                            <input
                              type="date"
                              value={work.status.dueDate}
                              onChange={(e) => updateWorkStatus(tIndex, wIndex, "dueDate", e.target.value)}
                              style={{ width: "100%", padding: "5px" }}
                            />
                          </div>
                          <div>
                            <label>Postponed Date:</label>
                            <input
                              type="date"
                              value={work.status.postponedDate}
                              onChange={(e) => updateWorkStatus(tIndex, wIndex, "postponedDate", e.target.value)}
                              style={{ width: "100%", padding: "5px" }}
                            />
                          </div>
                          <div>
                            <label>Pending Date:</label>
                            <input
                              type="date"
                              value={work.status.pendingDate}
                              onChange={(e) => updateWorkStatus(tIndex, wIndex, "pendingDate", e.target.value)}
                              style={{ width: "100%", padding: "5px" }}
                            />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label>Completed Date:</label>
                            <input
                              type="date"
                              value={work.status.completedDate}
                              onChange={(e) => updateWorkStatus(tIndex, wIndex, "completedDate", e.target.value)}
                              style={{ width: "100%", padding: "5px" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Criteria Section */}
                      <div style={{ backgroundColor: "#f0f0f0", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
                        <h5>✅ Implementable Criteria:</h5>
                        {work.criteria.implementable.map((criterion, cIndex) => (
                          <div key={cIndex} style={{ marginBottom: "8px", display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              placeholder="Criteria"
                              value={criterion}
                              onChange={(e) => updateCriteria(tIndex, wIndex, "implementable", cIndex, e.target.value)}
                              style={{ flex: 1, padding: "5px" }}
                            />
                            <button onClick={() => removeCriteria(tIndex, wIndex, "implementable", cIndex)}>Remove</button>
                          </div>
                        ))}
                        <button onClick={() => addCriteria(tIndex, wIndex, "implementable")}>Add Criteria</button>

                        <h5 style={{ marginTop: "15px" }}>❌ Non-Implementable Criteria:</h5>
                        {work.criteria.nonImplementable.map((criterion, cIndex) => (
                          <div key={cIndex} style={{ marginBottom: "8px", display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              placeholder="Criteria"
                              value={criterion}
                              onChange={(e) => updateCriteria(tIndex, wIndex, "nonImplementable", cIndex, e.target.value)}
                              style={{ flex: 1, padding: "5px" }}
                            />
                            <button onClick={() => removeCriteria(tIndex, wIndex, "nonImplementable", cIndex)}>Remove</button>
                          </div>
                        ))}
                        <button onClick={() => addCriteria(tIndex, wIndex, "nonImplementable")}>Add Criteria</button>
                      </div>

                      {/* Budget Assigned */}
                      <div>
                        <label>💰 Budget Assigned to this Work:</label>
                        <input
                          type="number"
                          value={work.budgetAssigned}
                          onChange={(e) => updateBudgetAssigned(tIndex, wIndex, e.target.value)}
                          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                          placeholder="0"
                        />
                      </div>

                      <button onClick={() => removeWork(tIndex, wIndex)} style={{ backgroundColor: "#ff6b6b", color: "white", padding: "8px 15px" }}>
                        Remove Work
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addWork(tIndex)} style={{ marginBottom: "20px" }}>
                    + Add Work / Mission
                  </button>
                </div>

                {/* Budget Management Section */}
                <div style={{ marginBottom: "20px", backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "4px" }}>
                  <h4>💼 Budget Management</h4>
                  {(() => {
                    const budgetTotals = calculateBudgetTotals(tIndex);
                    return (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                          <div>
                            <label>Initial Capital (₹):</label>
                            <input
                              type="number"
                              value={topic.postInteractions.budget.initialCapital}
                              onChange={(e) => updateInitialCapital(tIndex, e.target.value)}
                              style={{ width: "100%", padding: "8px" }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label>Total Outgoings (₹):</label>
                            <input
                              type="number"
                              value={topic.postInteractions.budget.outgoings}
                              onChange={(e) => updateOutgoings(tIndex, e.target.value)}
                              style={{ width: "100%", padding: "8px" }}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Additional Capital Additions */}
                        <div style={{ marginBottom: "15px" }}>
                          <h5>New Capital Additions:</h5>
                          {topic.postInteractions.budget.newCapitalAdditions.map((addition, aIndex) => (
                            <div key={aIndex} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
                              <span>₹{addition.amount.toFixed(2)} on {addition.date}</span>
                              <button onClick={() => removeCapitalAddition(tIndex, aIndex)}>Remove</button>
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input
                              type="number"
                              placeholder="Amount"
                              id={`newCapital_${tIndex}`}
                              style={{ flex: 1, padding: "8px" }}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`newCapital_${tIndex}`);
                                addCapitalAddition(tIndex, input.value);
                                input.value = "";
                              }}
                            >
                              Add Capital
                            </button>
                          </div>
                        </div>

                        {/* Budget Summary */}
                        <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "4px", marginTop: "15px" }}>
                          <h5>💵 Budget Summary:</h5>
                          <p>Initial Capital: ₹{budgetTotals.initialCapital.toFixed(2)}</p>
                          <p>Additional Capital: ₹{budgetTotals.additionalCapital.toFixed(2)}</p>
                          <p><strong>Total Capital: ₹{budgetTotals.totalCapital.toFixed(2)}</strong></p>
                          <p>Outgoings: ₹{budgetTotals.outgoings.toFixed(2)}</p>
                          <p>Assigned to Works: ₹{budgetTotals.assignedBudget.toFixed(2)}</p>
                          <p style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: budgetTotals.balance < 0 ? "#d32f2f" : "#388e3c"
                          }}>
                            Balance: ₹{budgetTotals.balance.toFixed(2)}
                          </p>
                          {budgetTotals.balance < 0 && (
                            <div style={{ backgroundColor: "#ffebee", padding: "10px", borderRadius: "4px", marginTop: "10px", color: "#c62828" }}>
                              ⚠️ Deficiency found: You need ₹{Math.abs(budgetTotals.balance).toFixed(2)} more capital to balance your budget.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Experiences Section */}
                <div style={{ marginBottom: "20px" }}>
                  <h4>🎓 Experiences & Skills</h4>
                  {topic.postInteractions.experiences.map((exp, eIndex) => (
                    <div
                      key={eIndex}
                      style={{
                        border: "1px solid #ddd",
                        padding: "15px",
                        marginBottom: "15px",
                        backgroundColor: "#f9f9f9"
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Experience Title"
                        value={exp.title}
                        onChange={(e) => updateExperience(tIndex, eIndex, "title", e.target.value)}
                        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                      />
                      <textarea
                        placeholder="Experience Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(tIndex, eIndex, "description", e.target.value)}
                        style={{ width: "100%", padding: "8px", marginBottom: "10px", minHeight: "60px" }}
                      />
                      <div>
                        <h5>Skills Gained:</h5>
                        {exp.skills.map((skill, sIndex) => (
                          <div key={sIndex} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                            <input
                              type="text"
                              placeholder="Skill"
                              value={skill}
                              onChange={(e) => updateExperienceSkill(tIndex, eIndex, sIndex, e.target.value)}
                              style={{ flex: 1, padding: "5px" }}
                            />
                            <button onClick={() => removeExperienceSkill(tIndex, eIndex, sIndex)}>Remove</button>
                          </div>
                        ))}
                        <button onClick={() => addExperienceSkill(tIndex, eIndex)}>+ Add Skill</button>
                      </div>
                      <button onClick={() => removeExperience(tIndex, eIndex)} style={{ marginTop: "10px", backgroundColor: "#ff6b6b", color: "white", padding: "8px 15px" }}>
                        Remove Experience
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addExperience(tIndex)}>+ Add Experience</button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addTopic}>Add Main Topic</button>
          <button onClick={saveTopic} style={{ marginLeft: "10px" }}>Save Topic</button>
        </div>
      )}
    </div>
  );
}
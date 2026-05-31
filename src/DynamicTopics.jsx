import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function DynamicTopics() {
  const [topics, setTopics] = useState([
    { name: "", suitable: [], unsuitable: [] }
  ]);

  // Add a new main topic
  const addTopic = () => {
    setTopics([...topics, { name: "", suitable: [], unsuitable: [] }]);
  };

  // Remove a main topic
  const removeTopic = (index) => {
    const updated = [...topics];
    updated.splice(index, 1);
    setTopics(updated);
  };

  // Update main topic name
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

  // Submit topic to database
  const submitTopic = async () => {
    try {
      await addDoc(collection(db, "topics"), {
        topics: topics,
        revision: 0,
        createdAt: new Date()
      });
      alert("Topic submitted successfully!");
      // Reset form
      setTopics([{ name: "", suitable: [], unsuitable: [] }]);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error submitting topic.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dynamic Main Topics with Suitable/Unsuitable Items</h2>

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
        </div>
      ))}

      <button onClick={addTopic}>Add Main Topic</button>
      <button onClick={submitTopic} style={{ marginLeft: "10px" }}>Submit Topic</button>
    </div>
  );
}


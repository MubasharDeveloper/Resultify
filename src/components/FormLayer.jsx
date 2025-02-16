import React, { useState, useEffect } from "react";

const assignTo = ["Person A", "Person B", "Person C", "Person D"];
const taskStatus = ["Active", "Inactive", "Pending", "Complete"];


const FormLayer = () => {

  const [Users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    taskName: "",
    taskDetail: "",
    taskAssign: "", // Default empty to match select values
    taskStatus: "",
  });

  // Load users from localStorage when the component mounts
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("Tasks")) || [];
    setUsers(storedUsers);
  }, []);

  // Handle input change for text fields and select fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation check
    if (!formData.taskName || !formData.taskDetail || !formData.taskAssign || !formData.taskStatus) {
      alert("Please fill out all fields.");
      return;
    }

    // Store in localStorage
    const storedTasks = JSON.parse(localStorage.getItem("Tasks")) || [];
    const updatedTasks = [...storedTasks, formData];
    localStorage.setItem("Tasks", JSON.stringify(updatedTasks));

    console.log("Form Submitted:", formData);

    setUsers(updatedTasks);

    // Reset form after submission
    setFormData({
      taskName: "",
      taskDetail: "",
      taskAssign: "",
      taskStatus: "",
    });
  };

  return (
    <>
      <div className="container">
      <h3>Todo App</h3>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-6">
            <input
              type="text"
              className="form-control"
              name="taskName"
              placeholder="Task Name"
              value={formData.taskName}
              onChange={handleChange}
            />
          </div>

          <div className="col-6">
            <input
              type="text"
              className="form-control"
              name="taskDetail"
              placeholder="Task Detail"
              value={formData.taskDetail}
              onChange={handleChange}
            />
          </div>

          <div className="col-6">
            <select
              className="form-control"
              name="taskAssign"
              value={formData.taskAssign} // Ensures correct binding
              onChange={handleChange}
            >
              <option value="">Select an Assignee</option>
              {assignTo.map((person, index) => (
                <option key={index} value={person}>{person}</option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <select
              className="form-control"
              name="taskStatus"
              value={formData.taskStatus} // Ensures correct binding
              onChange={handleChange}
            >
              <option value="">Select Status</option>
              {taskStatus.map((status, index) => (
                <option key={index} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
    </div>
    <div className="container mt-5">
    <button className="btn btn-danger mb-3 float-end" onClick={() => { localStorage.removeItem('Tasks'); setUsers([]); }}>Clear Storage</button>
    <table className="table border">
      <thead>
        <tr>
          <th>No</th>
          <th>Task</th>
          <th>Detail</th>
          <th>Assign To</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {Users.map((user, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{user.taskName}</td>
            <td>{user.taskDetail}</td>
            <td>{user.taskAssign}</td>
            <td>{user.taskStatus}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    </>
  );
};

export default FormLayer;

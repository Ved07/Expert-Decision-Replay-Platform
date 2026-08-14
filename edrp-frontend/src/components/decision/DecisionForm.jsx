import { useState } from "react";

function DecisionForm({
  initialData,
  categories,
  onSubmit,
  buttonText,
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || "",
    status: initialData?.status || "Draft",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(formData);
  };

  return (
    <form
      className="decision-form"
      onSubmit={handleSubmit}
    >
      {/* Title */}

      <div className="form-group">
        <label>Title</label>

        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter decision title"
          required
        />
      </div>

      {/* Description */}

      <div className="form-group">
        <label>Description</label>

        <textarea
          rows="5"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
        />
      </div>

      {/* Category */}

      <div className="form-group">
        <label>Category</label>

        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
        >
          <option value="">
            Select Category
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}

      <div className="form-group">
        <label>Status</label>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option>Draft</option>

          <option>In Review</option>

          <option>Finalized</option>
        </select>
      </div>

      <button
        type="submit"
        className="primary-btn"
      >
        {buttonText}
      </button>
    </form>
  );
}

export default DecisionForm;
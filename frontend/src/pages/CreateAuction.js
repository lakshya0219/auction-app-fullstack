import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateAuction = ({ currentUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    starting_price: "",
    bid_increment: "1.00",
    end_time: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Electronics",
    "Collectibles",
    "Art",
    "Jewelry",
    "Sports",
    "Home",
    "Fashion",
    "Toys",
    "Books",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate end time
    const endTime = new Date(formData.end_time);
    if (endTime <= new Date()) {
      setError("End time must be in the future");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/items", {
        ...formData,
        starting_price: parseFloat(formData.starting_price),
        bid_increment: parseFloat(formData.bid_increment),
        end_time: endTime.toISOString(),
      });

      setSuccess("Auction created successfully!");
      setFormData({
        title: "",
        description: "",
        category: "Electronics",
        starting_price: "",
        bid_increment: "1.00",
        end_time: "",
        image_url: "",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create auction");
    } finally {
      setLoading(false);
    }
  };

  const getMinEndTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Minimum 10 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="create-auction-page">
      <div className="page-header">
        <h1>Create New Auction</h1>
        <p>List your item for bidding and reach potential buyers</p>
      </div>

      <div className="create-auction-container">
        <form onSubmit={handleSubmit} className="auction-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-section">
            <h3>Item Details</h3>

            <div className="form-group">
              <label htmlFor="title">Item Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter a descriptive title for your item"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your item in detail including condition, features, etc."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="image_url">Image URL</label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Auction Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="starting_price">Starting Price ($) *</label>
                <input
                  type="number"
                  id="starting_price"
                  name="starting_price"
                  value={formData.starting_price}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bid_increment">Bid Increment ($)</label>
                <input
                  type="number"
                  id="bid_increment"
                  name="bid_increment"
                  value={formData.bid_increment}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="end_time">Auction End Time *</label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                min={getMinEndTime()}
              />
              <small>Auctions must run for at least 10 minutes</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating Auction..." : "Create Auction"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="form-tips">
          <h4>Tips for Successful Auctions:</h4>
          <ul>
            <li>Use clear, high-quality images</li>
            <li>Write detailed and honest descriptions</li>
            <li>Set a reasonable starting price to attract bidders</li>
            <li>
              Choose an end time when most bidders are likely to be online
            </li>
            <li>
              Consider setting a bid increment that encourages competitive
              bidding
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;

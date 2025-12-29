import React, { useState, useEffect } from "react";
import axios from "axios";

const SearchFilters = ({ onFiltersChange, currentFilters }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "");
  const [selectedCategory, setSelectedCategory] = useState(
    currentFilters.category || "all"
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/items/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFiltersChange({
      search: searchTerm,
      category: selectedCategory,
      page: 1,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    onFiltersChange({
      search: "",
      category: "all",
      page: 1,
    });
  };

  return (
    <div className="search-filters">
      <form onSubmit={handleSubmit} className="filters-form">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search auctions..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-select"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" className="search-btn">
            🔍 Search
          </button>
          <button type="button" onClick={clearFilters} className="clear-btn">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;

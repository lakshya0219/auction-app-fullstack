import React, { useState, useEffect } from "react";
import axios from "axios";
import ItemCard from "../components/ItemCard";
import SearchFilters from "../components/SearchFilters";
import LoadingSpinner from "../components/LoadingSpinner";

const Home = ({ socket }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    page: 1,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    fetchItems();
  }, [filters]);

  useEffect(() => {
    // Listen for new bids
    socket.on("bidUpdate", (data) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === data.item_id
            ? {
                ...item,
                current_price: data.amount,
                bid_count: (item.bid_count || 0) + 1,
              }
            : item
        )
      );
    });

    // Listen for new items
    socket.on("newItem", (newItem) => {
      setItems((prevItems) => [newItem, ...prevItems]);
    });

    return () => {
      socket.off("bidUpdate");
      socket.off("newItem");
    };
  }, [socket]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.category !== "all")
        params.append("category", filters.category);
      params.append("page", filters.page);
      params.append("limit", 12);

      const response = await axios.get(`/api/items?${params}`);
      setItems(response.data.items);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Discover Amazing Auctions</h1>
          <p>
            Bid on unique items from electronics to collectibles. Don't miss
            your chance to win!
          </p>
        </div>
      </section>

      <section className="filters-section">
        <SearchFilters
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      </section>

      <section className="items-section">
        <div className="section-header">
          <h2>Live Auctions</h2>
          <span className="items-count">{pagination.total} items found</span>
        </div>

        {items.length === 0 ? (
          <div className="no-items">
            <h3>No auctions found</h3>
            <p>
              Try adjusting your search filters or check back later for new
              items.
            </p>
          </div>
        ) : (
          <>
            <div className="items-grid">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>

                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;

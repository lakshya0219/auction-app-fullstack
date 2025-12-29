import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("my-bids");
  const [myItems, setMyItems] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [itemsResponse, bidsResponse] = await Promise.all([
        axios.get("/api/items/user/my-items"),
        axios.get("/api/bids/user/" + currentUser.id),
      ]);

      setMyItems(itemsResponse.data);
      setMyBids(bidsResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWinningBids = () => {
    return myBids.filter((bid) => {
      // This is a simplified check - in a real app, you'd check if this is the highest bid
      return true;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser.username}!</h1>
        <p>Manage your auctions and track your bids</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{myItems.length}</div>
          <div className="stat-label">Items Listed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{myBids.length}</div>
          <div className="stat-label">Total Bids</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getWinningBids().length}</div>
          <div className="stat-label">Winning Bids</div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "my-bids" ? "active" : ""}`}
          onClick={() => setActiveTab("my-bids")}
        >
          My Bids
        </button>
        <button
          className={`tab-btn ${activeTab === "my-items" ? "active" : ""}`}
          onClick={() => setActiveTab("my-items")}
        >
          My Items
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === "my-bids" && (
          <div className="bids-section">
            <h3>My Bid History</h3>
            {myBids.length === 0 ? (
              <div className="empty-state">
                <p>You haven't placed any bids yet.</p>
                <p>
                  Start browsing auctions to find items you're interested in!
                </p>
              </div>
            ) : (
              <div className="bids-list">
                {myBids.map((bid) => (
                  <div key={bid.id} className="bid-card">
                    <div className="bid-item-info">
                      <h4>{bid.item_title}</h4>
                      {bid.image_url && (
                        <img
                          src={bid.image_url}
                          alt={bid.item_title}
                          className="item-thumbnail"
                        />
                      )}
                    </div>
                    <div className="bid-details">
                      <div className="bid-amount">${bid.amount}</div>
                      <div className="bid-time">
                        {new Date(bid.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-items" && (
          <div className="items-section">
            <h3>My Listed Items</h3>
            {myItems.length === 0 ? (
              <div className="empty-state">
                <p>You haven't listed any items yet.</p>
                <a href="/create-auction" className="cta-button">
                  List Your First Item
                </a>
              </div>
            ) : (
              <div className="items-list">
                {myItems.map((item) => (
                  <div key={item.id} className="item-card-dashboard">
                    <div className="item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} />
                      ) : (
                        <div className="placeholder-image">No Image</div>
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.title}</h4>
                      <p className="item-category">{item.category}</p>
                      <div className="item-stats">
                        <span>Current Bid: ${item.current_price}</span>
                        <span>Bids: {item.bid_count || 0}</span>
                      </div>
                      <div className="item-status">
                        <span className={`status ${item.status}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

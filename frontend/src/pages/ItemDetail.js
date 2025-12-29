import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CountdownTimer from "../components/CountdownTimer";
import LoadingSpinner from "../components/LoadingSpinner";

const ItemDetail = ({ socket, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchItem();
    socket.emit("joinItem", id);

    return () => {
      socket.emit("leaveItem", id);
    };
  }, [id, socket]);

  useEffect(() => {
    // Listen for real-time bid updates
    socket.on("bidUpdate", (data) => {
      if (data.item_id === parseInt(id)) {
        setItem((prev) => ({
          ...prev,
          current_price: data.amount,
          bids: [data, ...prev.bids],
        }));
        setMessage("New bid placed!");
        setTimeout(() => setMessage(""), 3000);
      }
    });

    socket.on("timerExtended", (data) => {
      if (data.item_id === parseInt(id)) {
        setItem((prev) => ({
          ...prev,
          end_time: data.new_end_time,
        }));
        setMessage("Auction extended by 30 seconds!");
        setTimeout(() => setMessage(""), 3000);
      }
    });

    return () => {
      socket.off("bidUpdate");
      socket.off("timerExtended");
    };
  }, [id, socket]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`/api/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (amount) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setBidding(true);
    setMessage("");

    try {
      await axios.post("/api/bids", {
        item_id: id,
        user_id: currentUser.id,
        amount: amount,
      });
      setBidAmount("");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error placing bid");
    } finally {
      setBidding(false);
    }
  };

  const handleBidSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    const minBid = item.current_price + (item.bid_increment || 1);

    if (amount >= minBid) {
      placeBid(amount);
    } else {
      setMessage(`Bid must be at least $${minBid}`);
    }
  };

  const quickBid = (increment) => {
    const amount = item.current_price + increment;
    placeBid(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!item) {
    return <div className="error-page">Item not found</div>;
  }

  const minBid = item.current_price + (item.bid_increment || 1);
  const isSeller = currentUser && item.seller_id === currentUser.id;
  const canBid = currentUser && !isSeller;

  return (
    <div className="item-detail-page">
      {message && (
        <div
          className={`message ${
            message.includes("Error") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      <div className="detail-container">
        <div className="detail-left">
          <div className="item-image-large">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} />
            ) : (
              <div className="placeholder-image large">No Image</div>
            )}
          </div>
        </div>

        <div className="detail-right">
          <div className="item-header">
            <span className="item-category">{item.category}</span>
            <h1>{item.title}</h1>
            <p className="item-description">{item.description}</p>
          </div>

          <div className="auction-info-card">
            <div className="current-bid">
              <span className="label">Current Bid</span>
              <span className="price">${item.current_price}</span>
            </div>

            <div className="time-remaining">
              <span className="label">Time Remaining</span>
              <CountdownTimer endTime={item.end_time} />
            </div>

            <div className="auction-meta">
              <div className="meta-item">
                <span className="label">Starting Price:</span>
                <span className="value">${item.starting_price}</span>
              </div>
              <div className="meta-item">
                <span className="label">Bid Increment:</span>
                <span className="value">${item.bid_increment || 1}</span>
              </div>
              <div className="meta-item">
                <span className="label">Seller:</span>
                <span className="value">{item.seller_name}</span>
              </div>
              <div className="meta-item">
                <span className="label">Bids:</span>
                <span className="value">{item.bids?.length || 0}</span>
              </div>
            </div>
          </div>

          {canBid && (
            <div className="bid-section">
              <h3>Place Your Bid</h3>

              <div className="quick-bids">
                <button onClick={() => quickBid(item.bid_increment || 1)}>
                  +${item.bid_increment || 1}
                </button>
                <button onClick={() => quickBid(5)}>+$5</button>
                <button onClick={() => quickBid(10)}>+$10</button>
                <button onClick={() => quickBid(25)}>+$25</button>
              </div>

              <form onSubmit={handleBidSubmit} className="bid-form">
                <div className="bid-input-group">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum bid: $${minBid}`}
                    min={minBid}
                    step="0.01"
                    required
                  />
                </div>
                <button type="submit" className="bid-btn" disabled={bidding}>
                  {bidding ? "Placing Bid..." : "Place Bid"}
                </button>
              </form>

              <div className="bid-help">
                <p>💡 Bid must be at least ${minBid}</p>
                <p>⏰ Bids in last 10 seconds extend auction by 30 seconds</p>
              </div>
            </div>
          )}

          {isSeller && (
            <div className="seller-notice">
              <h3>You are the seller of this item</h3>
              <p>You cannot bid on your own auction.</p>
            </div>
          )}

          {!currentUser && (
            <div className="login-prompt">
              <h3>Want to bid on this item?</h3>
              <p>
                Please log in or create an account to participate in the
                auction.
              </p>
              <button onClick={() => navigate("/login")} className="login-btn">
                Log In to Bid
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bid-history-section">
        <h3>Bid History</h3>
        {item.bids && item.bids.length > 0 ? (
          <div className="bids-list">
            {item.bids.map((bid, index) => (
              <div key={index} className="bid-item">
                <div className="bidder-info">
                  <span className="bidder">{bid.username}</span>
                  <span className="bid-time">
                    {new Date(bid.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="bid-amount">${bid.amount}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bids">
            <p>No bids yet. Be the first to bid!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;

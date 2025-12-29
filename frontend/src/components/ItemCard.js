import React from "react";
import { Link } from "react-router-dom";
import CountdownTimer from "./CountdownTimer";

const ItemCard = ({ item }) => {
  const getTimeLeft = (endTime) => {
    const difference = new Date(endTime) - new Date();
    return difference;
  };

  const timeLeft = getTimeLeft(item.end_time);
  const isEndingSoon = timeLeft < 30 * 60 * 1000; // 30 minutes
  const isNew = timeLeft > 23 * 60 * 60 * 1000; // 23 hours

  return (
    <div className="item-card">
      {isNew && <div className="badge new">New</div>}
      {isEndingSoon && <div className="badge ending">Ending Soon</div>}

      <Link to={`/item/${item.id}`} className="item-link">
        <div className="item-image">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} />
          ) : (
            <div className="placeholder-image">No Image</div>
          )}
          <div className="item-overlay">
            <span className="view-details">View Details</span>
          </div>
        </div>

        <div className="item-info">
          <div className="item-category">{item.category}</div>
          <h3 className="item-title">{item.title}</h3>
          <p className="item-description">{item.description}</p>

          <div className="item-stats">
            <div className="current-price">${item.current_price}</div>
            <div className="bid-count">{item.bid_count || 0} bids</div>
          </div>

          <div className="item-meta">
            <div className="seller">
              <span className="label">Seller:</span>
              <span className="value">{item.seller_name}</span>
            </div>
            <div className="time-left">
              <CountdownTimer endTime={item.end_time} compact={true} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ItemCard;

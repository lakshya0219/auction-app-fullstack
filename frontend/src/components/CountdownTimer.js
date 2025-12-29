import React, { useState, useEffect } from "react";

const CountdownTimer = ({ endTime, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: difference <= 0,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.expired) {
    return <div className="timer expired">Auction Ended</div>;
  }

  if (compact) {
    return (
      <div className="timer compact">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </div>
    );
  }

  return (
    <div className="timer">
      {timeLeft.days > 0 && (
        <div className="time-unit">
          <span className="time-value">{timeLeft.days}</span>
          <span className="time-label">days</span>
        </div>
      )}
      <div className="time-unit">
        <span className="time-value">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="time-label">hours</span>
      </div>
      <div className="time-unit">
        <span className="time-value">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="time-label">minutes</span>
      </div>
      <div className="time-unit">
        <span className="time-value">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="time-label">seconds</span>
      </div>
    </div>
  );
};

export default CountdownTimer;

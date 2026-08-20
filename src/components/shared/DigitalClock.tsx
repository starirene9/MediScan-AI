import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";

const DigitalClock: React.FC = () => {
  const intl = useIntl();
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-[0.95rem] font-bold">
      <div>
        {intl.formatDate(time, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      <div>
        {intl.formatTime(time, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </div>
    </div>
  );
};

export default DigitalClock;

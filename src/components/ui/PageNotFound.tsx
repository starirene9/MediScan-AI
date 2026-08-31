import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageNotFoundImg from "../../assets/PageNotFound.jpg";

const PageNotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center text-center p-20"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <img src={PageNotFoundImg} alt="Page Not Found" className="w-120 h-120" />
      <h1 className="text-3xl font-bold mt-10" style={{ color: "var(--color-navy)" }}>404 - Page Not Found</h1>
      <p className="mt-2" style={{ color: "var(--color-muted)" }}>
        Redirecting to the dashboard...
      </p>
    </div>
  );
};

export default PageNotFound;

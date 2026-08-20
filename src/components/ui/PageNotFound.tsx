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
    <div className="flex flex-col items-center text-center bg-gray-100 p-20">
      <img src={PageNotFoundImg} alt="Page Not Found" className="w-120 h-120" />
      <h1 className="text-3xl font-bold mt-10">404 - Page Not Found</h1>
      <p className="text-gray-500 mt-2">Redirecting to the dashboard...</p>
    </div>
  );
};

export default PageNotFound;

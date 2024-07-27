import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../components/navbar";
import { onAuthStateChanged, getAuth, User } from "firebase/auth";
import app from "../firebase.config";
import { useEffect, useState } from "react";

const Ui = () => {
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  return (
    <>
      {user !== undefined ? (
        <>
          <div className="p-2 flex gap-2">
            <Navbar />
          </div>
          <hr />
          <Outlet />
          <ToastContainer />
          {/* <TanStackRouterDevtools /> */}
        </>
      ) : (
        <div className="flex h-screen justify-center items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-12 w-12 text-[#1DA1F2]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </>
  );
};

export const Route = createRootRoute({
  component: Ui,
});

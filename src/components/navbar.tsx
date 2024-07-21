import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { FaUserLarge } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { MdOutlineLogout } from "react-icons/md";

import {
  getAuth,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  Dialog,
  DialogPanel,
  Field,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import clsx from "clsx";
import { toast } from "react-toastify";

import app from "../firebase.config.ts";
import { createCollection } from "../services/firestore.ts";

const Navbar = () => {
  // State to manage the navbar's visibility
  const [nav, setNav] = useState(false);
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [emailSignUp, setEmailSignUp] = useState("");

  const [password, setPassword] = useState("");
  const [passwordSignUp, setPasswordSignUp] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSignUp, setLoadingSignUp] = useState(false);

  const [name, setName] = useState("");

  // Toggle function to handle the navbar's display
  const handleNav = () => {
    setNav(!nav);
  };

  // Array containing navigation items
  const navItems = [
    { id: 1, text: "Home", path: "/" },
    { id: 2, text: "Company", path: "/company" },
    { id: 3, text: "Resources", path: "/resources" },
    { id: 4, text: "About", path: "/about" },
    { id: 5, text: "Contact", path: "/contact" },
  ];

  // Function to check if user is logged in
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(getAuth(app), (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const firebaseLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(
        getAuth(app),
        email,
        password
      );

      // if (user) {
      //   const { email, uid } = user;
      //   await createCollection("users", { email }, uid);
      // }

      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          toast.error("Email already in use");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak");
          break;
        case "auth/invalid-credential":
          toast.error("Invalid credentials");
          break;
        case "auth/user-not-found":
          toast.error("User not found");
          break;
        default:
          console.log(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const firebaseSignup = async () => {
    setLoadingSignUp(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        getAuth(app),
        emailSignUp,
        passwordSignUp
      );

      if (user) {
        const { email, uid } = user;
        await createCollection("users", { email, name }, uid);
      }

      setOpen(false);
      setEmailSignUp("");
      setPasswordSignUp("");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          toast.error("Email already in use");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak");
          break;

        default:
          console.log(err);
      }
    } finally {
      setLoadingSignUp(false);
    }
  };

  return (
    <div className="flex items-center mx-auto px-4 text-black w-full">
      {/* Logo */}
      <h1 className="w-full text-3xl font-bold text-[#00df9a]">WhatsChat</h1>

      {/* Desktop Navigation */}
      <ul
        className={`hidden md:flex w-full ${user ? "justify-end" : "justify-between"}`}
      >
        {/* Navigation Items */}
        {!user && (
          <div className="flex">
            {navItems.map((item) => (
              <Link
                to={item.path}
                key={item.id}
                className="[&.active]:underline underline-offset-4 m-2 cursor-pointer duration-300"
              >
                <li
                  key={item.id}
                  className="p-4 hover:text-[#00df9a] cursor-pointer duration-300"
                >
                  {item.text}
                </li>
              </Link>
            ))}
          </div>
        )}

        {/* user profile icon */}
        <div className="hidden md:flex">
          <button className="">
            {user ? (
              <Menu>
                <MenuButton className="rounded-md p-2 flex">
                  <FaUserLarge />
                  <ChevronDownIcon className="size-4 fill-black/50" />
                </MenuButton>

                <MenuItems
                  transition
                  anchor="bottom end"
                  className="w-52 origin-top-right rounded-xl border border-white/5 text-white p-1 text-sm/6 transition duration-100 ease-out focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 [--anchor-gap:var(--spacing-1)] "
                >
                  <MenuItem>
                    <button
                      onClick={() => signOut(getAuth(app))}
                      className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                    >
                      <MdOutlineLogout className="size-4 fill-white/30" />
                      Logout
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘E
                      </kbd>
                    </button>
                  </MenuItem>

                  {/* <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <PencilIcon className="size-4 fill-white/30" />
                      Edit
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘E
                      </kbd>
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <Square2StackIcon className="size-4 fill-white/30" />
                      Duplicate
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘D
                      </kbd>
                    </button>
                  </MenuItem>
                  <div className="my-1 h-px bg-white/5" />
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <ArchiveBoxXMarkIcon className="size-4 fill-white/30" />
                      Archive
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘A
                      </kbd>
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <TrashIcon className="size-4 fill-white/30" />
                      Delete
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘D
                      </kbd>
                    </button>
                  </MenuItem> */}
                </MenuItems>
              </Menu>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-[#00df9a] rounded-xl cursor-pointer duration-300 hover:text-black hover:bg-[#96f4d6]"
              >
                Login
              </button>
            )}
          </button>
        </div>
      </ul>

      {/* Mobile Navigation Icon */}
      <div
        //  onClick={handleNav}
        className="md:hidden flex items-center"
      >
        <button className="">
          {user ? (
            <Menu>
              <MenuButton className="rounded-md p-2 flex">
                <FaUserLarge />
                <ChevronDownIcon className="size-4 fill-black/50" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="w-52 origin-top-right rounded-xl border border-white/5 text-white p-1 text-sm/6 transition duration-100 ease-out focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 [--anchor-gap:var(--spacing-1)] "
              >
                <MenuItem>
                  <button
                    onClick={() => signOut(getAuth(app))}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    <MdOutlineLogout className="size-4 fill-white/30" />
                    Logout
                    <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                      ⌘E
                    </kbd>
                  </button>
                </MenuItem>

                {/* <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <PencilIcon className="size-4 fill-white/30" />
                      Edit
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘E
                      </kbd>
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <Square2StackIcon className="size-4 fill-white/30" />
                      Duplicate
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘D
                      </kbd>
                    </button>
                  </MenuItem>
                  <div className="my-1 h-px bg-white/5" />
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <ArchiveBoxXMarkIcon className="size-4 fill-white/30" />
                      Archive
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘A
                      </kbd>
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                      <TrashIcon className="size-4 fill-white/30" />
                      Delete
                      <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                        ⌘D
                      </kbd>
                    </button>
                  </MenuItem> */}
              </MenuItems>
            </Menu>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-[#00df9a] rounded-xl cursor-pointer duration-300 hover:text-black hover:bg-[#96f4d6]"
            >
              Login
            </button>
          )}
        </button>
        {/* {nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />} */}
      </div>

      {/* Mobile Navigation Menu */}
      <ul
        className={
          nav
            ? "fixed md:hidden left-0 top-0 w-[60%] h-full border-r border-r-gray-900 bg-[#00df9a] ease-in-out duration-500"
            : "ease-in-out w-[60%] duration-500 fixed top-0 bottom-0 left-[-100%]"
        }
      >
        {/* Mobile Logo */}
        <h1 className="w-full text-3xl font-bold text-[#00df9a] m-4">
          Whatschat
        </h1>

        {/* Mobile Navigation Items */}
        {navItems.map((item) => (
          <li
            key={item.id}
            className="p-4 border-b rounded-xl hover:bg-[#00df9a] duration-300 hover:text-black cursor-pointer border-gray-600"
          >
            {item.text}
          </li>
        ))}
      </ul>

      {/* modal login */}
      <Dialog
        open={open}
        as="div"
        className="relative z-10 focus:outline-none bg-slate-950"
        onClose={close}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-slate-400/50">
          <div className="flex min-h-full items-center justify-center p-4 ">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-[#00df98] p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              <button
                className="absolute top-3 right-3 p-2"
                onClick={() => {
                  setEmail("");
                  setPassword("");
                  setOpen(false);
                }}
              >
                <IoMdClose fontSize={24} color="white" />
              </button>
              <TabGroup>
                <TabList className="flex gap-4">
                  <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
                    Login
                  </Tab>
                  <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
                    Signup
                  </Tab>
                </TabList>

                <TabPanels className="mt-3">
                  {/* Login */}
                  <TabPanel className="rounded-xl bg-white/5 p-3">
                    <div className="w-full max-w-md px-4">
                      <Field>
                        <Input
                          placeholder="Email"
                          type="email"
                          className={clsx(
                            "mt-3 block w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white",
                            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                          )}
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                        />
                        <Input
                          placeholder="Password"
                          type="password"
                          onChange={(e) => setPassword(e.target.value)}
                          value={password}
                          className={clsx(
                            "mt-3 block w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white",
                            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                          )}
                        />
                      </Field>

                      <button
                        onClick={firebaseLogin}
                        disabled={loading}
                        className="mt-3 w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white flex items-center justify-center"
                      >
                        {loading && (
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                              stroke-width="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        Login
                      </button>
                    </div>
                  </TabPanel>

                  {/* Signup */}
                  <TabPanel className="rounded-xl bg-white/5 p-3">
                    <div className="w-full max-w-md px-4">
                      <Field>
                        <Input
                          placeholder="Display Name"
                          type="text"
                          className={clsx(
                            "mt-3 block w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white",
                            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                          )}
                          onChange={(e) => setName(e.target.value)}
                          value={name}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          className={clsx(
                            "mt-3 block w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white",
                            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                          )}
                          onChange={(e) => setEmailSignUp(e.target.value)}
                          value={emailSignUp}
                        />
                        <Input
                          placeholder="Password"
                          type="password"
                          onChange={(e) => setPasswordSignUp(e.target.value)}
                          value={passwordSignUp}
                          className={clsx(
                            "mt-3 block w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white",
                            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                          )}
                        />
                      </Field>

                      <button
                        onClick={firebaseSignup}
                        disabled={loadingSignUp}
                        className="mt-3 w-full rounded-lg border-2 bg-white/5 py-1.5 px-3 text-sm/6 text-white flex items-center justify-center"
                      >
                        {loadingSignUp && (
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                              stroke-width="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        Signup
                      </button>
                    </div>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Navbar;

import { createLazyFileRoute } from "@tanstack/react-router";
import { onAuthStateChanged, getAuth, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { useCollection } from "react-firebase-hooks/firestore";
import { MessageList, MessageType } from "react-chat-elements";
import { Lightbox } from "react-modal-image";
import EmojiPicker from "emoji-picker-react";

import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";

import "react-circular-progressbar/dist/styles.css";

import { faker } from "@faker-js/faker";
import { useEffect, useRef, useState } from "react";

import app from "../firebase.config";
import { createCollection } from "../services/firestore";

import avatar from "../assets/young-smiling-man-avatar-man-with-brown-beard-mustache-hair-wearing-yellow-sweater-sweatshirt-3d-vector-people-character-illustration-cartoon-minimal-style_365941-860.jpg";
import { generateChatCollectionRef } from "../utils";

import "../styles/index.css";
import { GrEmoji } from "react-icons/gr";
import { IoMdArrowBack } from "react-icons/io";
import { Circle } from "rc-progress";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

type Contact = {
  id: string;
  name: string;
  profilePic?: string;
  email?: string;
  bio: string;
};

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [dataSource, setDataSource] = useState<MessageType[]>([]);
  const [collectionRef, setCollectionRef] = useState<string>("");
  const messageListRef = useRef(null);
  const [openLightBox, setOpenLightBox] = useState(false);
  const [urlToLargeImageFile, setUrlToLargeImageFile] = useState<string>("");

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);

  const divRefDesktop = useRef<HTMLDivElement>(null);
  const divRefMobile = useRef<HTMLDivElement>(null);

  const photoTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/tiff",
    "image/svg+xml",
    "image/heic",
  ];

  const audioTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/m4a",
    "audio/mp3",
    "audio/wma",
    "audio/opus",
  ];

  const videoTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/avi",
    "video/mov",
    "video/mkv",
    "video/wmv",
    "video/flv",
  ];

  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const storage = getStorage(app);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [value] = useCollection(collection(getFirestore(app), "users"), {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  const [currentText, setCurrentText] = useState<string>("");

  const handleButtonClick = () => {
    fileInputRef?.current?.click();
  };

  const getTypes = (file: File) => {
    if (photoTypes.includes(file.type)) {
      return "photo";
    } else if (audioTypes.includes(file.type)) {
      return "audio";
    } else if (videoTypes.includes(file.type)) {
      return "video";
    } else if (documentTypes.includes(file.type)) {
      return "file";
    }
  };

  const handleFileChange = async (event) => {
    const file: File = event.target.files[0];
    if (file) {
      const storageRef = ref(
        storage,
        faker.string.uuid() + "." + file.name.split(".")[1]
      );
      const type = getTypes(file);

      const result = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      result.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.log(error);
        },
        () => {
          setUploadProgress(null);
          console.log("success");
        }
      );

      if (result) {
        const uploadRef = (await result).ref;
        const url = await getDownloadURL(uploadRef); // URL of the uploaded file
        await sendMessage("", url, type);
      }
    }
  };

  useEffect(() => {
    onAuthStateChanged(getAuth(app), (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  useEffect(() => {
    if (collectionRef) {
      const q = query(
        collection(getFirestore(app), `messages/${collectionRef}/chats`),
        orderBy("date", "asc")
      );
      onSnapshot(q, (snapshot) => {
        setDataSource(
          snapshot.docs.map((doc) => {
            const object = doc.data() as MessageType;
            object.position =
              doc.data().sender === user?.uid ? "right" : "left";
            object.date = doc.data().date?.toDate();
            object.copiableDate = true;
            object.removeButton = true;
            return object;
          })
        );
      });
    }
    if (user && activeContact) {
      setDataSource([]);
      const collectionRef = generateChatCollectionRef(
        activeContact.id,
        user?.uid
      );
      setCollectionRef(collectionRef);
      divRefDesktop.current.scrollTop = divRefDesktop.current?.scrollHeight;
      divRefMobile.current.scrollTop = divRefMobile.current?.scrollHeight;
    }
  }, [collectionRef, user, activeContact]);

  const sendMessage = async (
    text: string,
    url?: string,
    type?: "photo" | "audio" | "video" | "file"
  ) => {
    if (!type && currentText === "") {
      return;
    }

    if (activeContact && user) {
      await createCollection(`messages/${collectionRef}/chats`, {
        type: type ? type : "text",
        text: text,
        date: new Date(),
        id: faker.string.uuid(),
        sender: user.uid,
        timestamp: serverTimestamp(),
        data:
          type === "photo"
            ? {
                uri: url,
              }
            : type === "audio"
              ? {
                  audioURL: url,
                }
              : type === "video"
                ? {
                    videoURL: url,
                    status: {
                      click: true,
                      loading: 0.5,
                      download: true,
                    },
                  }
                : type === "file"
                  ? {
                      uri: url,
                      status: {
                        click: false,
                        loading: 0,
                      },
                    }
                  : null,
      });
      setCurrentText("");
      divRefDesktop.current.scrollTop = divRefDesktop.current?.scrollHeight;
      divRefMobile.current.scrollTop = divRefMobile.current?.scrollHeight;
    }
  };

  const ContactList = ({ contact }) => {
    return (
      <div
        className={`p-2 bg rounded shadow-sm flex items-center gap-2 cursor-pointer ${
          activeContact?.id === contact.id ? "bg-[#62ecc0]" : ""
        }`}
        onClick={() =>
          setActiveContact({
            id: contact.id,
            name: contact.data().name,
            bio: contact.data().bio,
          })
        }
        key={contact.id}
      >
        <img
          src={contact.data().profilePic || avatar}
          className="w-10 h-10 rounded-full"
          alt="profile"
          onError={(e) => (e.currentTarget.src = avatar)}
        />
        <h1>{contact.data().name}</h1>
      </div>
    );
  };

  return (
    <>
      {user ? (
        <div className="p-2 flex overflow-hidden h-full">
          {/* for desktop */}
          {/* contact list */}
          <div className="w-96 h-[90vh] overflow-scroll hidden lg:block md:block">
            {value &&
              value.docs.map((contact) => {
                if (contact.id == user.uid) {
                  return null;
                } else {
                  return <ContactList contact={contact} key={contact.id} />;
                }
              })}
          </div>

          {/* chat ui*/}
          <div className="w-full hidden lg:block md:block">
            {activeContact ? (
              <div className="flex flex-col h-[90vh]">
                {/* header */}
                <div className="w-full bg-[#62ecc01f] shadow-inner p-2 ps-0 pe-0 flex items-center">
                  {/* back button */}
                  <div className="p-2 flex items-center">
                    <button
                      className="text-3xl"
                      onClick={() => setActiveContact(null)}
                    >
                      <IoMdArrowBack />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center cursor-pointer w-fit">
                    <img
                      src={activeContact.profilePic || avatar}
                      className="w-10 h-10 rounded-full"
                      alt="profile"
                      onError={(e) => (e.currentTarget.src = avatar)}
                    />
                    <h1>{activeContact.name}</h1>
                  </div>
                </div>

                {/* chat */}
                <div className="h-[88vh] overflow-scroll" ref={divRefDesktop}>
                  <MessageList
                    className="message-list"
                    lockable={false}
                    dataSource={dataSource}
                    messageBoxStyles={{
                      color: "#000",
                      fontSize: "24px",
                    }}
                    onMessageFocused={(e) => console.log(e)}
                    onClick={(e) => {
                      if (e.type === "file") {
                        window.open(e.data.uri, "_blank");
                      }
                    }}
                    onOpen={(e) => {
                      setUrlToLargeImageFile(e.data.uri || "");
                      setOpenLightBox(true);
                    }}
                    toBottomHeight={"100%"}
                    onRemoveMessageClick={(e) => console.log(e)}
                    onForwardClick={(e) => console.log(e)}
                    referance={messageListRef}
                    sendMessagePreview={true}
                  />

                  <Modal
                    open={uploadProgress !== null}
                    // open={true}
                    center
                    classNames={{}}
                    showCloseIcon={false}
                    onClose={() => setUploadProgress(null)}
                  >
                    <div className="p-5 px-10 text-center rounded-lg w-60">
                      <Circle
                        percent={parseInt(uploadProgress?.toFixed())}
                        // percent={80}
                        strokeWidth={4}
                        strokeColor="#62ecc0"
                        trailColor="white"
                        strokeLinecap="square"
                        steps={100}
                        trailWidth={4}
                        transition="ease"
                      />
                      <p className="pt-4">
                        Uploading {uploadProgress?.toFixed()}%
                      </p>
                    </div>
                  </Modal>
                </div>

                <div className="p-2 flex justify-between w-full bg-slate-100">
                  <div className="rce-container-input bg-white shadow-lg rounded-lg p-2">
                    {/* left buttons */}
                    <div className="rce-input-buttons">
                      <button
                        className="rce-button"
                        style={{
                          backgroundColor: "rgb(57, 121, 170)",
                          color: "white",
                          borderColor: "rgb(57, 121, 170)",
                        }}
                        onClick={handleButtonClick}
                      >
                        <span className="rce-button-icon--container">
                          <span></span>
                          <span
                            className="rce-button-icon"
                            style={{ fontSize: "20px" }}
                          >
                            <svg
                              stroke="currentColor"
                              fill="none"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </span>
                        </span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(e)}
                      />
                    </div>

                    <textarea
                      className="rce-input rce-input-textarea"
                      placeholder="Type here..."
                      style={{ height: "41px" }}
                      ref={inputRef}
                      // autoFocus={true}
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      // defaultValue={currentText}
                    />

                    {/* right buttons */}
                    <div className="rce-input-buttons flex items-center">
                      <button
                        onClick={() => setOpenEmojiPicker(!openEmojiPicker)}
                      >
                        <GrEmoji size={32} color="rgb(57, 121, 170)" />
                      </button>
                      <button
                        className="rce-button"
                        style={{
                          backgroundColor: "rgb(57, 121, 170)",
                          color: "white",
                          borderColor: "rgb(57, 121, 170)",
                        }}
                        onClick={() => {
                          sendMessage(currentText);
                        }}
                      >
                        <span className="rce-button-icon--container">
                          {/* <span>Send</span> */}
                          <span
                            className="rce-button-icon"
                            style={{ fontSize: "20px" }}
                          >
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 512 512"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M48 448l416-192L48 64v149.333L346 256 48 298.667z"></path>
                            </svg>
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[88vh]">
                <h1 className="text-2xl">Select a contact</h1>
              </div>
            )}
          </div>

          {/* for mobile */}
          <div className="w-full md:hidden lg:hidden">
            {!activeContact ? (
              value?.docs.map((contact) => {
                if (contact.id == user.uid) {
                  return null;
                } else {
                  return <ContactList contact={contact} key={contact.id} />;
                }
              })
            ) : (
              <div className="flex flex-col h-[90vh]">
                {/* header */}
                <div className="w-full bg-[#62ecc01f] shadow-inner p-2 ps-0 pe-0 flex items-center">
                  {/* back button */}
                  <div className="p-2 flex items-center">
                    <button
                      className="text-3xl"
                      onClick={() => {
                        setDataSource([]);
                        setActiveContact(null);
                      }}
                    >
                      <IoMdArrowBack />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center cursor-pointer w-fit">
                    <img
                      src={activeContact.profilePic || avatar}
                      className="w-10 h-10 rounded-full"
                      alt="profile"
                      onError={(e) => (e.currentTarget.src = avatar)}
                    />
                    <h1>{activeContact.name}</h1>
                  </div>
                </div>

                {/* chat */}
                <div
                  className="bg-white pt-2 h-[88vh] overflow-scroll"
                  ref={divRefMobile}
                >
                  {dataSource.length > 0 && (
                    <MessageList
                      className="message-list"
                      lockable={false}
                      dataSource={dataSource}
                      messageBoxStyles={{
                        color: "#000",
                        fontSize: "24px",
                      }}
                      onClick={(e) => {
                        if (e.type === "file") {
                          window.open(e.data.uri, "_blank");
                        }
                      }}
                      onOpen={(e) => {
                        setUrlToLargeImageFile(e.data.uri || "");
                        setOpenLightBox(true);
                      }}
                      onRemoveMessageClick={(e) => console.log(e)}
                      onForwardClick={(e) => console.log(e)}
                      referance={messageListRef}
                    />
                  )}
                  <Modal
                    open={uploadProgress !== null}
                    center
                    classNames={{}}
                    showCloseIcon={false}
                    onClose={() => setUploadProgress(null)}
                  >
                    <div className="p-5 px-10 text-center rounded-lg w-60">
                      <Circle
                        percent={parseInt(uploadProgress?.toFixed())}
                        strokeWidth={4}
                        strokeColor="#62ecc0"
                        trailColor="white"
                        strokeLinecap="square"
                        steps={100}
                        trailWidth={4}
                        transition="ease"
                      />
                      <p className="pt-4">
                        Uploading {uploadProgress?.toFixed()}%
                      </p>
                    </div>
                  </Modal>
                </div>

                <div className="p-2 flex justify-between w-full bg-slate-100">
                  <div className="rce-container-input bg-white shadow-lg rounded-lg p-2">
                    {/* left buttons */}
                    <div className="rce-input-buttons">
                      <button
                        className="rce-button"
                        style={{
                          backgroundColor: "rgb(57, 121, 170)",
                          color: "white",
                          borderColor: "rgb(57, 121, 170)",
                        }}
                        onClick={handleButtonClick}
                      >
                        <span className="rce-button-icon--container">
                          <span></span>
                          <span
                            className="rce-button-icon"
                            style={{ fontSize: "20px" }}
                          >
                            <svg
                              stroke="currentColor"
                              fill="none"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </span>
                        </span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(e)}
                      />
                    </div>

                    <textarea
                      className="rce-input rce-input-textarea"
                      placeholder="Type here..."
                      style={{ height: "41px" }}
                      ref={inputRef}
                      // autoFocus={true}
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      // defaultValue={currentText}
                    />

                    {/* right buttons */}
                    <div className="rce-input-buttons flex items-center">
                      <button
                        onClick={() => setOpenEmojiPicker(!openEmojiPicker)}
                      >
                        <GrEmoji size={32} color="rgb(57, 121, 170)" />
                      </button>
                      <button
                        className="rce-button"
                        style={{
                          backgroundColor: "rgb(57, 121, 170)",
                          color: "white",
                          borderColor: "rgb(57, 121, 170)",
                        }}
                        onClick={() => {
                          sendMessage(currentText);
                        }}
                      >
                        <span className="rce-button-icon--container">
                          {/* <span>Send</span> */}
                          <span
                            className="rce-button-icon"
                            style={{ fontSize: "20px" }}
                          >
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 512 512"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M48 448l416-192L48 64v149.333L346 256 48 298.667z"></path>
                            </svg>
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {openLightBox && (
            <Lightbox
              medium={urlToLargeImageFile}
              alt=""
              onClose={() => {
                setUrlToLargeImageFile("");
                setOpenLightBox(false);
              }}
            />
          )}

          <EmojiPicker
            open={openEmojiPicker}
            onEmojiClick={(e) => {
              setCurrentText((prev) => prev + e.emoji);
              inputRef.current.value += e.emoji;
            }}
            style={{ position: "absolute", bottom: "100px", right: "25px" }}
          />
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

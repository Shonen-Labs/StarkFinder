import { LogOut, MessageSquarePlus, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";
const slideRight = {
  initial: {
    y: "100vh",
  },
  enter: {
    y: "0",
    transition: {
      duration: 1,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  exit: {
    y: "100vh",
    transition: {
      duration: 1,
    },
  },
};
const ChatModal = ({
  showPopup,
  setShowPopup,
}: {
  setShowPopup: (val: boolean) => void;
  showPopup: boolean;
}) => {
  const router = useRouter();

  const createNewChat = async () => {
    const id = uuidv4();
    router.push(`/agent/chat/${id}`);
  };

  const createNewTxn = async () => {
    const id = uuidv4();
    router.push(`/agent/transaction/${id}`);
  };

  return (
    <AnimatePresence mode="wait">
      {showPopup && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            variants={slideRight}
            initial="initial"
            animate={showPopup ? "enter" : "exit"}
            exit={"exit"}
            className="bg-[#131315] relative rounded-lg p-6 shadow-xl max-w-[500px] w-full lg:w-[500px] min-h-[370px] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              onClick={() => setShowPopup(false)}
              className="w-[30px] cursor-pointer h-[30px] absolute right-4 top-4"
            >
              <Image
                fill
                src={"/close.png"}
                alt={"starkfinder_close_icon"}
                className="w-full h-full z-20 absolute top-0 left-0"
              />
            </div>
            <h2 className="text-3xl text-center font-semibold my-4 max-w-[350px] mx-auto text-[#EEEFFC]">
              How would you like to launch the App
            </h2>
            <div className="space-y-4">
              <button
                onClick={createNewChat}
                className="w-full bg-white hover:bg-slate-700 text-[#000] rounded-full font-normal min-h-[60px] cursor-pointer flex items-center justify-center gap-4 px-8 py-3 duration-200 text-base"
              >
                <MessageSquarePlus size={20} />
                <span>New Chat</span>
              </button>
              <button
                onClick={createNewTxn}
                className="w-full bg-white hover:bg-[#eee] shadow-none border text-[#000] rounded-full font-normal min-h-[60px] cursor-pointer flex items-center justify-center gap-4 px-8 py-3 duration-200 text-base"
              >
                <CreditCard size={20} />
                <span>New Transaction</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ChatModal;

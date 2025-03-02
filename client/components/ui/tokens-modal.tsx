import React from "react";
import Image from "next/image";
import { CryptoCoin } from "@/types/crypto-coin";

type TokensModalProps = {
  blockchain_logo: CryptoCoin[];
  handleCoinSelect: (coin: CryptoCoin) => void;
  setShowModal: (show: boolean) => void;
};

function TokensModal({
  blockchain_logo,
  handleCoinSelect,
  setShowModal,
}: TokensModalProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center animated fadeIn">
      <div className="bg-[#1A1A1A] p-6 w-[36rem] shadow-lg rounded-xl animated fadeIn">
        <h3 className="text-lg font-bold text-center mb-4 text-white">
          Select Coin
        </h3>
        <ul
          className="h-[16.7rem] overflow-y-auto  
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-[#333333]
              [&::-webkit-scrollbar-thumb]:bg-[#454545]
              [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {blockchain_logo.map((coin: CryptoCoin, index: number) => (
            <li
              key={index}
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#242424] rounded-lg mb-2"
              onClick={() => handleCoinSelect(coin)}
            >
              <div className="flex items-center space-x-2">
                <Image src={coin.logo} alt={coin.name} width={30} height={30} />
                <span className="text-lg font-medium text-white">
                  {coin.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <button
          className="mt-4 bg-[#242424] text-white py-3 rounded-lg w-full"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default TokensModal;

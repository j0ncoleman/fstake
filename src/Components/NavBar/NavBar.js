import React from "react";
import { ConnectWallet } from "./ConnectWallet";
import { Div } from "atomize";
import "../MainPage/fadeIn.css";

export const NavBar = () => {
  return (
    <Div
      className="fade-in-text"
      pos="fixed"
      w="100vw"
      d="flex"
      align="center"
      justify="right"
      style={{ zIndex: "1" }}>
      <Div m={{ xl: "3rem", lg: "3rem", md: "3rem", sm: "3rem", xs: "1rem" }}>
        <ConnectWallet />
      </Div>
    </Div>
  );
};

import React, { useState, useEffect } from "react";
import "./App.css";
import { Provider as StyletronProvider, DebugEngine } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import { StyleReset, ThemeProvider } from "atomize";
import { Div } from "atomize";

import merge from "lodash.merge";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { NavBar } from "./Components/NavBar/NavBar";
import { Staking } from "./Components/MainPage/Staking";

const debug =
  process.env.NODE_ENV === "production" ? void 0 : new DebugEngine();

// 1. Create a client engine instance
const engine = new Styletron();

const theme = {
  colors: {
    black900: "#1d1d1e",
    gray400: "#3a3a3c",
  },
  shadows: {
    "new-shadow": "0 16px 24px -2px #72F2DB",
  },
  // fontFamily: {
  //   primary: "Orbitron, sans-serif",
  // },
};

const myTheme = merge(darkTheme(), {
  colors: {
    accentColor: "#303030",
  },
  fonts: {
    body: "",
  },
});

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider(), alchemyProvider({ apiKey: process.env.ALCHEMY_ID })]
);

const projectId = "cb106d8bd6e920fafb8ac848bd84b7f5";
const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
      injectedWallet({ chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: connectors,
  publicClient,
});

function App({}) {
  return (
    <StyletronProvider value={engine} debug={debug} debugAfterHydration>
      <ThemeProvider theme={theme}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains} theme={myTheme}>
            <StyleReset />
            <NavBar />
            <Staking />
          </RainbowKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </StyletronProvider>
  );
}

export default App;

"use client";

import {useContext, useEffect, useState} from "react";
import ChessGame from "./_lib/chess-game";
import {HUDContext} from "./HUD";

export default function Chess(params) {
  const HUDState = useContext(HUDContext);
  useEffect(() => {
		const game = new ChessGame(HUDState);
	},[]);
	return <div id="chess" className="w-[59vw]"></div>;
}

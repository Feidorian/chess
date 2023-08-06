"use client";

import {useEffect} from "react";
import ChessBoard from "../_lib/ChessBoard";
import engine from "../_lib/Engine";

export default function Player1() {
	useEffect(() => {
		const game = new ChessBoard("w", "player1");
		engine.randomPlay();
	}, []);
	return <div id="player1" className="w-[59vw] text-white"></div>;
}

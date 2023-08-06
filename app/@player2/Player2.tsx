"use client";

import {useEffect} from "react";
import ChessBoard from "../_lib/ChessBoard";

export default function Player2(params) {
	useEffect(() => {
		const game = new ChessBoard("b", "player2");
	}, []);
	return <div id="player2" className="w-[59vw] text-white"></div>;
}

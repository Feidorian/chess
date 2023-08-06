"use client";

import {createContext, useContext, useState} from "react";

function useHUD() {
	const [result, setResult] = useState([]);
	const push = item => {
		setResult(prev => [...prev, item]);
	};
	return {result, push};
}

export const HUDContext = createContext();

export function HUDProvider(props) {
	const state = useHUD();

	return <HUDContext.Provider value={state}>{props.children}</HUDContext.Provider>;
}

export default function HUD() {
	const {result} = useContext(HUDContext)
	const getStyle = index => {
		let backgroundColor = index % 2 === 0 ? "White" : "black";
		let color = index % 2 === 0 ? "black" : "White";
		return {backgroundColor, color};
	};
	return (
    <div className="w-[25rem]  text-black font-semibold bg-white">
      <div className="flex flex-wrap justify-center p-3 gap-2.5">

			{result.map((item, index) => (
				<div key={index} style={getStyle(index)} className="p-1 h-fit w-fit rounded-lg border-2 border-slate-400 inline-block">{`${
					index + 1
				}. ${item}`}</div>
			))}
		</div>
      </div>
	);
}

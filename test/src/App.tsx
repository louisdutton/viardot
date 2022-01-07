import { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Voice } from "../../src";

function App() {
  useEffect(() => {
    const ctx = new window.AudioContext();
    const voice = new Voice(ctx, "baritone");
    console.log(voice);

    window.addEventListener("mousedown", voice.start);
    window.addEventListener("mouseup", voice.stop);

    return () => {
      window.removeEventListener("mousedown", voice.start);
      window.removeEventListener("mouseup", voice.stop);
      ctx.close();
    };
  });

  return <div className="App">{/* <button onClick={ctx}></button> */}</div>;
}

export default App;

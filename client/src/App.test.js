import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react";
import App from "./App";

test("renders App component without crashing", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  await act(async () => {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
  });

  expect(container.innerHTML).toContain("DeFile");
  expect(container.innerHTML).toContain("Decentralized");
  document.body.removeChild(container);
});

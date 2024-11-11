import * as React from './react/core';
function App() {
    return React.createElement("div", { className: "App" }, React.createElement("header", { className: "App-header" }, React.createElement("h1", null)));
}
console.log(React.createElement(App, null));

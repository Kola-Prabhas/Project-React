import * as React from './react/core';


// function App() {
// 	return React.createElement("div", { className: "App" },
// 		React.createElement("header", { className: "App-header" },
// 			React.createElement("h1", null,)
// 		)
// 	)
// }

console.log(React.createElement("div", { className: "App" },
	React.createElement("header", { className: "App-header" },
		React.createElement("h1", null, false),
		React.createElement("h2", null,),
		React.createElement("h3", null,),
		React.createElement("h4", null,),
		React.createElement("h5", null,),

	)
))
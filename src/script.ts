import * as React from './react/core';

function App() {
	return React.createElement("div", {},
		React.createElement("p", { innerText: 'h1' },
			React.createElement("p", { innerText: 'h2' },
				React.createElement("p", { innerText: 'h3' },
					React.createElement("p", { innerText: 'h4' },
						React.createElement("p", { innerText: 'h5' },
							React.createElement("p", { innerText: 'h6' })
						)
					)
				),
			),

		),
		// React.createElement(Example, null),
		// React.createElement(Example2, null),
	)
}


React.render(React.createElement(App, null), document.getElementById('root')!);

// if (typeof window !== 'undefined') {
// 	React.render(
// 		React.createElement("div", { className: "App" },
// 		React.createElement("header", { className: "App-header" },
// 			React.createElement("h1", null, false),
// 			React.createElement("h2", null,),
// 			React.createElement("h3", null,),
// 			React.createElement("h4", null,),
// 			React.createElement("h5", null,)
// 		)),
// 		document.getElementById('root')!
// 	)
// }





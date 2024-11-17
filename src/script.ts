import * as React from './react/core'


function Example2() {
	const [items, setItems] = React.useState([1]);

	return React.createElement("div", {},
		React.createElement("button", {
			onclick: () => {
				setItems([...items, Math.random()]);
			},
			innerText: "Add a random value2",
		}),
		React.createElement("button", {
			onclick: () => {
				setItems(items.slice(0, -1));
			},
			innerText: "Remove last value2",
		}),
		...items.map((i) =>
			React.createElement("div", { innerText: i })
		),
	)
}

function Example() {
	const [items, setItems] = React.useState([1]);

	return React.createElement("div", {},
		React.createElement("button", {
			onclick: () => {
				setItems([...items, Math.random()]);
			},
			innerText: "Add a random value",
		}),
		React.createElement("button", {
			onclick: () => {
				setItems(items.slice(0, -1));
			},
			innerText: "Remove last value",
		}),
		...items.map((i) =>
			React.createElement("div", { innerText: i })
		),
	)
}


function App() {
	return React.createElement("div", {},
		React.createElement(Example, null),
		React.createElement(Example2, null),
	)
}


window.onload = () => {
	React.render(
		React.createElement(App, null),
		document.getElementById("root")!
	);
};

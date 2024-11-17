export const run = <T>(f: () => T) => f();


export const deepCloneTree = <T>(obj: T, seen = new WeakSet()): T => {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof HTMLElement) {
		return obj;
	}

	if (typeof obj === "function") {
		return (obj as any).bind({});
	}

	if (seen.has(obj)) {
		return obj as T; //
	}

	seen.add(obj);

	const copy: any = Array.isArray(obj) ? [] : {};

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			copy[key] = deepCloneTree(obj[key], seen);
		}
	}


	seen.delete(obj);

	return copy;
};
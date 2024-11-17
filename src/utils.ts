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

export const deepEqual = (a: any, b: any): boolean => {
	if (a === b) return true;

	if (a && b && typeof a === "object" && typeof b === "object") {
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!deepEqual(a[i], b[i])) {
					return false;
				}
			}
			return true;
		}

		if (a.constructor !== b.constructor) {
			return false;
		}

		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) {
			return false;
		}

		for (const key of keysA) {
			if (!keysB.includes(key)) {
				return false;
			}
			if (!deepEqual(a[key], b[key])) {
				return false;
			}
		}

		return true;
	}
	return false;
};
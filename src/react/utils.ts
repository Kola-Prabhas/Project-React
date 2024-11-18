import type {
	ReactRenderTreeNode,
	ReactComponentInternalMetadata
} from './types';

import { currentTreeRef } from './core';



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

export function deepTraverseAndModify(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(deepTraverseAndModify);
	} else if (typeof obj === "object" && obj !== null) {
		const newObj: any = {};

		for (const [key, value] of Object.entries(obj)) {
			if (
				key === "computedViewTreeNode" &&
				value &&
				typeof value === "object" &&
				"id" in value
			) {
				newObj["computedViewTreeNodeId"] = value.id;
			} else if (
				key === "internalMetadata" &&
				value &&
				typeof value === "object" &&
				"id" in value
			) {
				let x = value as unknown as { component: any; id: string };
				newObj["internalMetadataName+Id"] = (
					x.component.tagName +
					x.component.name +
					"-" +
					x.id.slice(0, 4)
				).replace("undefined", "");
			} else {
				newObj[key] = deepTraverseAndModify(value);
			}
		}

		return newObj;
	}

	return obj;
}

export const isChildOf = ({
	potentialChildId,
	potentialParentId,
}: {
	potentialParentId: string;
	potentialChildId: string;
}): boolean => {
	const aux = ({
		node,
		searchId,
	}: {
		node: ReactRenderTreeNode;
		searchId: string;
	}): ReactRenderTreeNode | undefined => {
		if (node.kind === "empty-slot") {
			return;
		}
		if (node.internalMetadata.kind === "empty-slot") {
			return;
		}
		if (node.internalMetadata.id === searchId) {
			return node;
		}

		for (const child of node.childNodes) {
			const res = aux({
				node: child,
				searchId,
			});
			if (res) {
				return res;
			}
		}
	};

	if (!currentTreeRef.renderTree) {
		throw new Error("Invariant error must have render tree");
	}

	const start = aux({
		node: currentTreeRef.renderTree.root,
		searchId: potentialParentId,
	});
	if (!start) {
		throw new Error("Invariant error can't start from a detached node");
	}

	return !!aux({
		node: start,
		searchId: potentialChildId,
	});
};

export const compareIndexPaths = (
	leftIndexPath: Array<number>,
	rightIndexPath: Array<number>
) => {
	if (leftIndexPath.length !== rightIndexPath.length) {
		return false;
	}
	for (let i = 0; i < leftIndexPath.length; i++) {
		const leftIndex = leftIndexPath[i];
		const rightIndex = rightIndexPath[i];

		if (leftIndex !== rightIndex) {
			return false;
		}
	}

	return true;
};

export const getComponentName = (
	internalMetadata: ReactComponentInternalMetadata
) => {
	return run(() => {
		if (internalMetadata.kind === "empty-slot") {
			return "empty-slot";
		}
		switch (internalMetadata.component.kind) {
			case "function": {
				return internalMetadata.component.function.name;
			}
			case "tag": {
				return internalMetadata.component.tagName;
			}
		}
	});
}
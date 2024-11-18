// import { currentTreeRef, createElement, searchForContextStateUpwards, triggerReRender } from './core';
// import type { ReactComponentInternalMetadata } from './types';


// export function useState<T>(initialValue: T) {
// 	if (!currentTreeRef.renderTree?.currentlyRendering) {
// 		throw new Error('Cannot call useState outside of react component');
// 	}

// 	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
// 	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

// 	currentTreeRef.renderTree.currentLocalHookOrder += 1;

// 	if (currentlyRenderingNode?.kind === 'empty-slot') {
// 		throw new Error("Empty slot can't have state inside it!");
// 	}

// 	if (!currentlyRenderingNode?.hasRendered) {
// 		currentlyRenderingNode.hooks.push({
// 			kind: 'state',
// 			value: initialValue
// 		});

// 		return;
// 	}

// 	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

// 	if (existingHook.kind !== 'state') {
// 		throw new Error('Invariant Error: Hook order mismatch');
// 	}


// 	return [
// 		existingHook.value as T,
// 		(newValue: T) => {
// 			if (!currentlyRenderingNode.computedViewTreeNodeId) {
// 				throw new Error(
// 					"Invariant: set state trying to re-render unmounted component"
// 				);
// 			}

// 			if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
// 				throw new Error("Invariant error, no view tree or no render tree");
// 			}

// 			existingHook.value = newValue;

// 			triggerReRender(currentlyRenderingNode);
// 		}
// 	] as const;
// }

// export const useState = <T>(initialValue: T) => {
// 	if (!currentTreeRef.renderTree?.currentlyRendering) {
// 		throw new Error("Cannot call use state outside of a react component");
// 	}

// 	const currentStateOrder =
// 		currentTreeRef.renderTree.currentLocalHookOrder;
// 	currentTreeRef.renderTree.currentLocalHookOrder += 1;

// 	const capturedCurrentlyRenderingRenderNode =
// 		currentTreeRef.renderTree.currentlyRendering;

// 	if (capturedCurrentlyRenderingRenderNode.kind === "empty-slot") {
// 		throw new Error(
// 			"Invariant Error: A node that triggered a set state cannot be an empty slot"
// 		);
// 	}

// 	if (!capturedCurrentlyRenderingRenderNode.hasRendered) {
// 		capturedCurrentlyRenderingRenderNode.hooks.push({
// 			kind: "state",
// 			value: initialValue,
// 		});
// 	}

// 	const hookMetadata =
// 		capturedCurrentlyRenderingRenderNode.hooks[currentStateOrder];

// 	if (hookMetadata.kind !== "state") {
// 		throw new Error("Different number of hooks rendered between render");
// 	}

// 	return [
// 		hookMetadata.value as T,
// 		(value: T) => {
// 			if (!capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId) {
// 				throw new Error(
// 					"Invariant: set state trying to re-render unmounted component"
// 				);
// 			}

// 			if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
// 				throw new Error("Invariant error, no view tree or no render tree");
// 			}

// 			hookMetadata.value = value;
// 			triggerReRender(capturedCurrentlyRenderingRenderNode);
// 		},
// 	] as const;
// };



// export function useRef<T>(initialValue: T) {
// 	if (!currentTreeRef.renderTree?.currentlyRendering) {
// 		throw new Error('Cannot call useRef outside of react component');
// 	}

// 	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
// 	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

// 	currentTreeRef.renderTree.currentLocalHookOrder += 1;

// 	if (currentlyRenderingNode?.kind === 'empty-slot') {
// 		throw new Error("Empty slot can't have ref inside it!");
// 	}

// 	if (!currentlyRenderingNode?.hasRendered) {
// 		currentlyRenderingNode.hooks.push({
// 			kind: 'ref',
// 			refTo: { current: initialValue }
// 		});
// 	}

// 	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

// 	if (existingHook.kind !== 'ref') {
// 		throw new Error('Invariant Error: Hook order mismatch');
// 	}


// 	return existingHook.refTo as { current: T };
// }


// export function useEffect(cb: () => unknown, deps: Array<unknown>) {
// 	if (!currentTreeRef.renderTree?.currentlyRendering) {
// 		throw new Error('Cannot call useEffect outside of react component');
// 	}

// 	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
// 	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

// 	currentTreeRef.renderTree.currentLocalHookOrder += 1;

// 	if (currentlyRenderingNode?.kind === 'empty-slot') {
// 		throw new Error("Empty slot can't have effect inside it!");
// 	}

// 	if (!currentlyRenderingNode?.hasRendered) {
// 		currentlyRenderingNode.hooks.push({
// 			kind: 'effect',
// 			cb,
// 			deps,
// 			cleanup: null
// 		});
// 	}

// 	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

// 	if (existingHook.kind !== 'effect') {
// 		throw new Error('Invariant Error: Hook order mismatch');
// 	}

// 	if (
// 		deps.length !== existingHook.deps.length ||
// 		!deps.every((dep, index) => dep === existingHook.deps[index])) {
// 		existingHook.cb = cb; // update callback so that callback closure has new values
// 		existingHook.deps = deps;
// 	}
// }


// export function useMemo<T>(fn: () => T, deps: Array<unknown>): T {
// 	if (!currentTreeRef.renderTree?.currentlyRendering) {
// 		throw new Error('Cannot call useMemo outside of react component');
// 	}

// 	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
// 	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

// 	currentTreeRef.renderTree.currentLocalHookOrder += 1;

// 	if (currentlyRenderingNode?.kind === 'empty-slot') {
// 		throw new Error("Empty slot can't have memo inside it!");
// 	}

// 	if (!currentlyRenderingNode?.hasRendered) {
// 		currentlyRenderingNode.hooks.push({
// 			kind: 'memo',
// 			memoizedValue: fn(),
// 			deps,
// 		});
// 	}

// 	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

// 	if (existingHook.kind !== 'memo') {
// 		throw new Error('Invariant Error: Hook order mismatch');
// 	}

// 	if (
// 		deps.length !== existingHook.deps.length ||
// 		!deps.every((dep, index) => dep === existingHook.deps[index])) {
// 		existingHook.memoizedValue = fn();
// 		existingHook.deps = deps;
// 	}

// 	return existingHook.memoizedValue as T;
// }


// export function useCallback<T>(cb: () => T, deps: Array<unknown>): () => T {
// 	return useMemo(() => cb, deps);
// }


// export function createContext<T>(defaultValue: T) {
// 	const contextId = crypto.randomUUID();

// 	currentTreeRef.defaultContextState.push({
// 		contextId,
// 		state: defaultValue,
// 	});

// 	return {
// 		Provider: (data: {
// 			value: T;
// 			children: Array<
// 				ReactComponentInternalMetadata | null | false | undefined
// 			>;
// 		}) => {
// 			if (
// 				typeof data.value === "object" &&
// 				data.value &&
// 				"__internal-context" in data.value
// 			) {
// 				return contextId as unknown;
// 			}

// 			const el = createElement('div', {}, ...data.children);
// 			if (!(el.kind === "real-element")) {
// 				throw new Error();
// 			}
// 			el.provider = {
// 				state: data.value,
// 				contextId,
// 			};
// 			return el;
// 		}
// 	}
// }


// export function useContext<T>(context: ReturnType<typeof createContext<T>>) {
// 	if (!currentTreeRef.renderTree) {
// 		throw new Error('Cannot render component outside of renderTree');
// 	}

// 	const contextId = context.Provider({
// 		value: {
// 			"__internal-context": true,
// 		},
// 	} as any) as string;

// 	const currentlyRenderingRenderNode =
// 		currentTreeRef.renderTree.currentlyRendering;
	
// 	if (!currentlyRenderingRenderNode) {
// 		throw new Error('Cannot call useContext outside of react component');
// 	}

// 	if (currentlyRenderingRenderNode.kind === "empty-slot") {
// 		throw new Error(
// 			"Invariant Error: A node that called use context cannot be an empty slot"
// 		);
// 	}

// 	const computedViewNode = currentTreeRef.tempViewNodes.find(
// 		(node) =>
// 			node.id === currentlyRenderingRenderNode.computedViewTreeNodeId
// 	)!;

// 	const state = searchForContextStateUpwards(computedViewNode, contextId);

// 	console.log("did we read it?", state);

// 	return state as T;
// }


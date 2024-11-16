import { currentTreeRef } from './core';


export function useState<T>(initialValue: T) {
	if (!currentTreeRef.renderTree?.currentlyRendering) {
		throw new Error('Cannot call useState outside of react component');
	}

	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

	currentTreeRef.renderTree.currentLocalHookOrder += 1;

	if (currentlyRenderingNode?.kind === 'empty-slot') {
		throw new Error("Empty slot can't have state inside it!");
	}

	if (!currentlyRenderingNode?.hasRendered) {
		currentlyRenderingNode.hooks.push({
			kind: 'state',
			value: initialValue
		});

		return;
	}

	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

	if (existingHook.kind !== 'state') {
		throw new Error('Invariant Error: Hook order mismatch');
	}


	return [
		existingHook.value as T,
		(newValue: T) => {
			if (!currentlyRenderingNode.computedViewTreeNodeId) {
				throw new Error(
					"Invariant: set state trying to re-render unmounted component"
				);
			}

			if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
				throw new Error("Invariant error, no view tree or no render tree");
			}

			existingHook.value = newValue;

			// TODO: Need to trigger re-render
		}
	] as const;
}



export function useRef<T>(initialValue: T) {
	if (!currentTreeRef.renderTree?.currentlyRendering) {
		throw new Error('Cannot call useRef outside of react component');
	}

	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

	currentTreeRef.renderTree.currentLocalHookOrder += 1;

	if (currentlyRenderingNode?.kind === 'empty-slot') {
		throw new Error("Empty slot can't have ref inside it!");
	}

	if (!currentlyRenderingNode?.hasRendered) {
		currentlyRenderingNode.hooks.push({
			kind: 'ref',
			refTo: { current: initialValue }
		});
	}

	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

	if (existingHook.kind !== 'ref') {
		throw new Error('Invariant Error: Hook order mismatch');
	}


	return existingHook.refTo as { current: T };
}


export function useEffect(cb: () => unknown, deps: Array<unknown>) {
	if (!currentTreeRef.renderTree?.currentlyRendering) {
		throw new Error('Cannot call useEffect outside of react component');
	}

	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

	currentTreeRef.renderTree.currentLocalHookOrder += 1;

	if (currentlyRenderingNode?.kind === 'empty-slot') {
		throw new Error("Empty slot can't have effect inside it!");
	}

	if (!currentlyRenderingNode?.hasRendered) {
		currentlyRenderingNode.hooks.push({
			kind: 'effect',
			cb,
			deps,
			cleanup: null
		});
	}

	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

	if (existingHook.kind !== 'effect') {
		throw new Error('Invariant Error: Hook order mismatch');
	}

	if (
		deps.length !== existingHook.deps.length ||
		!deps.every((dep, index) => dep === existingHook.deps[index]))
	{
		existingHook.cb = cb; // update callback so that callback closure has new values
		existingHook.deps = deps;
	}
}


export function useMemo<T>(fn: () => T, deps: Array<unknown>): T {
	if (!currentTreeRef.renderTree?.currentlyRendering) {
		throw new Error('Cannot call useMemo outside of react component');
	}

	const currentlyRenderingNode = currentTreeRef.renderTree.currentlyRendering;
	const currentHookOrder = currentTreeRef.renderTree.currentLocalHookOrder;

	currentTreeRef.renderTree.currentLocalHookOrder += 1;

	if (currentlyRenderingNode?.kind === 'empty-slot') {
		throw new Error("Empty slot can't have memo inside it!");
	}

	if (!currentlyRenderingNode?.hasRendered) {
		currentlyRenderingNode.hooks.push({
			kind: 'memo',
			memoizedValue: fn(),
			deps,
		});
	}

	const existingHook = currentlyRenderingNode.hooks[currentHookOrder];

	if (existingHook.kind !== 'memo') {
		throw new Error('Invariant Error: Hook order mismatch');
	}

	if (
		deps.length !== existingHook.deps.length ||
		!deps.every((dep, index) => dep === existingHook.deps[index])) {
		existingHook.memoizedValue = fn(); 
		existingHook.deps = deps;
	}

	return existingHook.memoizedValue as T;
}


export function useCallback<T>(cb: () => T, deps: Array<unknown>): () => T {
	return useMemo(() => cb, deps);
}
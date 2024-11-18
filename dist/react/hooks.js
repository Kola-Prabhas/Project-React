import { currentTreeRef, createElement, searchForContextStateUpwards, triggerReRender } from './core';
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
export const useState = (initialValue) => {
    if (!currentTreeRef.renderTree?.currentlyRendering) {
        throw new Error("Cannot call use state outside of a react component");
    }
    const currentStateOrder = currentTreeRef.renderTree.currentLocalCurrentHookOrder;
    currentTreeRef.renderTree.currentLocalCurrentHookOrder += 1;
    const capturedCurrentlyRenderingRenderNode = currentTreeRef.renderTree.currentlyRendering;
    if (capturedCurrentlyRenderingRenderNode.kind === "empty-slot") {
        throw new Error("Invariant Error: A node that triggered a set state cannot be an empty slot");
    }
    if (!capturedCurrentlyRenderingRenderNode.hasRendered) {
        capturedCurrentlyRenderingRenderNode.hooks.push({
            kind: "state",
            value: initialValue,
        });
    }
    const hookMetadata = capturedCurrentlyRenderingRenderNode.hooks[currentStateOrder];
    if (hookMetadata.kind !== "state") {
        throw new Error("Different number of hooks rendered between render");
    }
    return [
        hookMetadata.value,
        (value) => {
            if (!capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId) {
                throw new Error("Invariant: set state trying to re-render unmounted component");
            }
            if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
                throw new Error("Invariant error, no view tree or no render tree");
            }
            hookMetadata.value = value;
            triggerReRender({ capturedCurrentlyRenderingRenderNode });
        },
    ];
};
export const useRef = (initialValue) => {
    if (!currentTreeRef.renderTree) {
        throw new Error("Cannot call use state outside of a react component");
    }
    if (!currentTreeRef.renderTree.currentlyRendering) {
        throw new Error("Component being called outside of react internals");
    }
    const currentStateOrder = currentTreeRef.renderTree.currentLocalCurrentHookOrder;
    currentTreeRef.renderTree.currentLocalCurrentHookOrder += 1;
    const currentlyRendering = currentTreeRef.renderTree?.currentlyRendering;
    if (!currentlyRendering) {
        throw new Error("Cannot call use state outside of a react component");
    }
    if (currentlyRendering.kind === "empty-slot") {
        throw new Error("A slot will never call a hook");
    }
    if (!currentlyRendering.hasRendered) {
        const refTo = {
            current: initialValue,
        };
        currentlyRendering.hooks.push({
            kind: "ref",
            refTo,
        });
        return refTo;
    }
    const hookValue = currentlyRendering.hooks[currentStateOrder];
    if (hookValue.kind !== "ref") {
        throw new Error("Different hooks called compared previous render");
    }
    return hookValue.refTo;
};
export const useEffect = (cb, deps) => {
    if (!currentTreeRef.renderTree) {
        throw new Error("Cannot call use effect outside of a react component");
    }
    if (!currentTreeRef.renderTree.currentlyRendering) {
        throw new Error("Component being called outside of react internals");
    }
    const currentlyRendering = currentTreeRef.renderTree?.currentlyRendering;
    if (!currentlyRendering) {
        throw new Error("Cannot call use effect outside of a react component");
    }
    if (currentlyRendering.kind === "empty-slot") {
        throw new Error("A slot will never call a hook");
    }
    const currentStateOrder = currentTreeRef.renderTree.currentLocalCurrentHookOrder;
    currentTreeRef.renderTree.currentLocalCurrentHookOrder += 1;
    if (!currentlyRendering.hasRendered) {
        currentlyRendering.hooks.push({
            kind: "effect",
            cb,
            deps,
            cleanup: null,
        });
    }
    const effect = currentlyRendering.hooks[currentStateOrder];
    if (effect.kind !== "effect") {
        throw new Error("Called hooks in different order compared to previous render");
    }
    if (effect.deps.length !== deps.length ||
        !effect.deps.every((dep, index) => {
            const newDep = deps[index];
            return newDep === dep;
        })) {
        effect.deps = deps;
        effect.cb = cb;
    }
};
export const useMemo = (fn, deps) => {
    if (!currentTreeRef.renderTree) {
        throw new Error("Cannot call use memo outside of a react component");
    }
    if (!currentTreeRef.renderTree.currentlyRendering) {
        throw new Error("Component being called outside of react internals");
    }
    const currentlyRendering = currentTreeRef.renderTree?.currentlyRendering;
    if (!currentlyRendering) {
        throw new Error("Cannot call use memo outside of a react component");
    }
    if (currentlyRendering.kind === "empty-slot") {
        throw new Error("A slot will never call a hook");
    }
    const currentStateOrder = currentTreeRef.renderTree.currentLocalCurrentHookOrder;
    currentTreeRef.renderTree.currentLocalCurrentHookOrder += 1;
    if (!currentlyRendering.hasRendered) {
        currentlyRendering.hooks.push({
            kind: "memo",
            deps: deps,
            memoizedValue: fn(),
        });
    }
    const memo = currentlyRendering.hooks[currentStateOrder];
    if (memo.kind !== "memo") {
        throw new Error("Called hooks in different order compared to previous render");
    }
    if (memo.deps.length !== deps.length ||
        !memo.deps.every((dep, index) => {
            const newDep = deps[index];
            return newDep === dep;
        })) {
        memo.deps = deps;
        memo.memoizedValue = fn();
    }
    return memo.memoizedValue;
};
export const useCallback = (fn, deps) => {
    return useMemo(() => fn, deps);
};
export const useContext = (context) => {
    const contextId = context.Provider({
        value: {
            "__internal-context": true,
        },
    });
    if (!currentTreeRef.renderTree?.currentlyRendering) {
        throw new Error("Cannot call use context outside of a react component");
    }
    const capturedCurrentlyRenderingRenderNode = currentTreeRef.renderTree.currentlyRendering;
    if (capturedCurrentlyRenderingRenderNode.kind === "empty-slot") {
        throw new Error("Invariant Error: A node that called use context cannot be an empty slot");
    }
    // if (!currentTreeRef.tempViewTree) {
    //   throw new Error("Invariant error, a partial view tree must have been built by now")
    // }
    // console.log(currentTreeRef, capturedCurrentlyRenderingRenderNode);
    const computedViewNode = currentTreeRef.tempViewTreeNodes.find((node) => node.id === capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId);
    // // const computedViewNode = findViewNodeOrThrow((node) => node.id === capturedCurrentlyRenderingRenderNode.id, currentTreeRef.tempViewTree)
    const state = searchForContextStateUpwards(computedViewNode, contextId);
    console.log("did we read it?", state);
    return state;
};
export const createContext = (initialValue) => {
    const contextId = crypto.randomUUID();
    currentTreeRef.defaultContextState.push({
        contextId,
        state: initialValue,
    });
    return {
        Provider: (data) => {
            if (typeof data.value === "object" &&
                data.value &&
                "__internal-context" in data.value) {
                return contextId;
            }
            const el = createElement("div", null, ...data.children); // for i have sinned, ideally would of used a fragment
            console.log(el);
            if (!(el.kind === "real-element")) {
                throw new Error();
            }
            el.provider = {
                state: data.value,
                contextId,
            };
            return el;
        },
    };
};

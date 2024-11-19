import * as Utils from "./utils";
export { deepTraverseAndModify } from './utils';
export * from './hooks';
const updateElement = ({ props, tagComponent, previousDomRef, lastParent, insertedBefore, }) => {
    if (previousDomRef) {
        Object.assign(previousDomRef, props);
        previousDomRef.style.cssText =
            typeof props?.['style'] === "string" ? props?.['style'] : "";
        tagComponent.domRef = previousDomRef;
        return previousDomRef;
    }
    const newEl = document.createElement(tagComponent.tagName);
    // tagComponent.domRef = newEl;
    Object.assign(newEl, props);
    console.log('insertedBefore ', insertedBefore);
    console.log('lastParent ', lastParent);
    if (insertedBefore && !lastParent.contains(insertedBefore)) {
        throw new Error("Invariant, cannot ask update dom to place a node before a non-sibling");
    }
    if (insertedBefore) {
        lastParent.insertBefore(newEl, insertedBefore.nextSibling);
        tagComponent.domRef = newEl;
        return newEl;
    }
    lastParent.appendChild(newEl);
    tagComponent.domRef = newEl;
    return newEl;
};
const findFirstTagNode = (viewNode) => {
    if (viewNode.kind === "empty-slot") {
        return null;
    }
    if (viewNode.metadata.kind === "empty-slot") {
        return null;
    }
    switch (viewNode.metadata.component.kind) {
        case "function": {
            return findFirstTagNode(viewNode.childNodes[0]);
        }
        case "tag": {
            return {
                component: viewNode.metadata.component,
                viewNode,
            };
        }
    }
};
const updateDom = (args) => {
    const aux = ({ lastUpdatedSibling, newViewTree, oldViewTree, parentDomNode, }) => {
        if (!newViewTree ||
            newViewTree.kind === "empty-slot" ||
            newViewTree.metadata.kind === "empty-slot") {
            if (!oldViewTree) {
                return { lastUpdated: null };
            }
            // then we have to delete the old view tree node
            const tagNode = findFirstTagNode(oldViewTree);
            if (!tagNode) {
                // nothing to delete, its an empty slot
                return { lastUpdated: null };
            }
            // console.log("removing", tagNode);
            tagNode.component.domRef?.parentElement?.removeChild(tagNode.component.domRef);
            return { lastUpdated: null };
        }
        if (!oldViewTree ||
            oldViewTree.kind === "empty-slot" ||
            oldViewTree.metadata.kind === "empty-slot") {
            // add case
            switch (newViewTree.metadata.component.kind) {
                case "function": {
                    const auxResult = aux({
                        lastUpdatedSibling: lastUpdatedSibling,
                        newViewTree: findFirstTagNode(newViewTree)?.viewNode ?? null,
                        oldViewTree: null,
                        parentDomNode: parentDomNode,
                    });
                    // take the aux result as it represents the dom node to be placed before the next sibling
                    // the caller has to be responsible for not losing the original lastUpdated ref
                    return { lastUpdated: auxResult.lastUpdated };
                }
                case "tag": {
                    // then we can trivially add a node to the dom before the last updated sibling (it must be a sibling)
                    const updatedElement = updateElement({
                        insertedBefore: lastUpdatedSibling,
                        lastParent: parentDomNode,
                        previousDomRef: null,
                        props: newViewTree.metadata.props,
                        tagComponent: newViewTree.metadata.component,
                    });
                    // second time we do this which is a little annoying
                    // could abstract to a fn but would like aux to be that fn
                    // let trackedLastUpdatedSibling: HTMLElement | null = null;
                    // we make calls to add every child since there is no view tree to diff against
                    newViewTree.childNodes.forEach((newChildNode) => {
                        aux({
                            // lastUpdatedSibling: trackedLastUpdatedSibling,
                            lastUpdatedSibling: null,
                            newViewTree: newChildNode,
                            oldViewTree: null,
                            parentDomNode: updatedElement,
                        });
                    });
                    return { lastUpdated: updatedElement };
                }
            }
        }
        switch (newViewTree.metadata.component.kind) {
            // pass through case
            case "function": {
                const auxResult = aux({
                    lastUpdatedSibling: lastUpdatedSibling,
                    newViewTree: findFirstTagNode(newViewTree)?.viewNode ?? null,
                    oldViewTree: findFirstTagNode(oldViewTree)?.viewNode ?? null,
                    parentDomNode: parentDomNode,
                });
                // because we pass through, this result is important and we should forward it
                return {
                    lastUpdated: auxResult.lastUpdated,
                };
            }
            case "tag": {
                switch (oldViewTree.metadata.component.kind) {
                    case "function": {
                        // re-apply the function with the next child of the function
                        const auxResult = aux({
                            lastUpdatedSibling: lastUpdatedSibling,
                            newViewTree: newViewTree,
                            oldViewTree: oldViewTree.childNodes[0], // will always have one child
                            parentDomNode: parentDomNode,
                        });
                        return { lastUpdated: auxResult.lastUpdated };
                    }
                    case "tag": {
                        const lastUpdated = Utils.run(() => {
                            if (!(oldViewTree.metadata.kind === "real-element") ||
                                !(newViewTree.metadata.kind === "real-element")) {
                                throw new Error("No longer a non escaping function");
                            }
                            if (!(oldViewTree.metadata.component.kind === "tag") ||
                                !(newViewTree.metadata.component.kind === "tag")) {
                                throw new Error("No longer a non-escaping closure");
                            }
                            if (!Utils.deepEqual(oldViewTree.metadata.props, newViewTree.metadata.props) ||
                                oldViewTree.metadata.component.tagName !==
                                    newViewTree.metadata.component.tagName) {
                                return updateElement({
                                    insertedBefore: lastUpdatedSibling,
                                    lastParent: parentDomNode,
                                    previousDomRef: oldViewTree.metadata.component.domRef,
                                    props: newViewTree.metadata.props,
                                    tagComponent: newViewTree.metadata.component,
                                });
                            }
                            newViewTree.metadata.component.domRef =
                                oldViewTree.metadata.component.domRef;
                            // const findParenTag = (node: ReactViewTreeNode) => {
                            //   // if (node.kind === 'empty-slot')
                            // }
                            return oldViewTree.metadata.component.domRef;
                        });
                        // then there's an associated existing dom node and we just update its props
                        let trackedLastUpdatedSibling = null;
                        // handles deleting any extra nodes from the previous tree not associated with a new view tree node
                        oldViewTree.childNodes.forEach((oldNode, index) => {
                            // const associatedWith = newViewTree.childNodes.at(index);
                            if (index < newViewTree.childNodes.length) {
                                return;
                            }
                            aux({
                                parentDomNode: lastUpdated,
                                lastUpdatedSibling: trackedLastUpdatedSibling,
                                newViewTree: null,
                                oldViewTree: oldNode,
                            });
                        });
                        // handles adding any extra nodes that appeared in the new view tree
                        newViewTree.childNodes.forEach((newNode, index) => {
                            const associatedWith = oldViewTree.childNodes.at(index);
                            // we do care about the return result since it may add to the dom
                            const auxResult = aux({
                                lastUpdatedSibling: trackedLastUpdatedSibling,
                                newViewTree: newNode,
                                oldViewTree: associatedWith ?? null,
                                parentDomNode: lastUpdated,
                            });
                            // incase it didn't add anything (e.g. the new node was a slot), we want to not destroy the last sibling
                            trackedLastUpdatedSibling =
                                auxResult.lastUpdated ?? trackedLastUpdatedSibling;
                        });
                        return { lastUpdated: lastUpdated };
                    }
                }
            }
        }
    };
    switch (args.insertInfo.kind) {
        case "root": {
            aux({
                lastUpdatedSibling: null,
                newViewTree: args.newViewTree,
                oldViewTree: args.oldViewTree,
                parentDomNode: args.insertInfo.root,
            });
            return;
        }
        case "child":
            {
                if (!currentTreeRef.viewTree) {
                    throw new Error("Invariant error, cannot reconcile child without a view tree setup");
                }
                const previousChild = args.insertInfo.previousViewTreeParent.kind === "empty-slot"
                    ? null
                    : args.insertInfo.previousViewTreeParent?.childNodes.reduce((prev, _, index) => {
                        if (!(args.insertInfo.kind === "child") ||
                            args.insertInfo.previousViewTreeParent.kind === "empty-slot") {
                            throw new Error("No longer a non escaping closure, unsafe access");
                        }
                        const nextSibling = args.insertInfo.previousViewTreeParent.childNodes.at(index + 1);
                        if (nextSibling) {
                            return nextSibling;
                        }
                        return prev;
                    }, null);
                // console.log('previousViewTreeParent ', args.insertInfo.previousViewTreeParent)
                // console.log('previousChild ', previousChild);
                const tagNode = previousChild ? findFirstTagNode(previousChild) : null;
                // console.log('tagNode ', tagNode);	
                if (tagNode && !tagNode.component.domRef) {
                    throw new Error("Invariant Error: Previous view tree must always have dom nodes on tags");
                }
                if (tagNode && !tagNode.component.domRef.parentElement) {
                    throw new Error("Invariant Error: Attempting to update a detached dom node");
                }
                const parentTagNode = findFirstTagNode(args.insertInfo.previousViewTreeParent);
                // console.log('parentTagNode ', parentTagNode);
                if (!parentTagNode) {
                    throw new Error("Invariant Error: A parent node could not have been an empty slot since we know it has view node children");
                }
                if (!parentTagNode.component.domRef) {
                    // console.log(JSON.stringify(args.insertInfo.previousViewTreeParent));
                    throw new Error("Invariant Error: Previous view tree must always have dom nodes on tags");
                }
                aux({
                    // lastUpdatedSibling: tagNode?.component.domRef ?? null,
                    lastUpdatedSibling: null,
                    newViewTree: args.newViewTree,
                    oldViewTree: args.oldViewTree,
                    parentDomNode: parentTagNode.component.domRef,
                });
            }
            return;
    }
};
const mapComponentToTaggedUnion = (component) => {
    return typeof component === "string"
        ? { kind: "tag", tagName: component, domRef: null }
        : { kind: "function", function: component, name: component.name };
};
const mapExternalMetadataToInternalMetadata = ({ externalMetadata, }) => ({
    provider: null,
    kind: "real-element",
    component: mapComponentToTaggedUnion(externalMetadata.component),
    children: externalMetadata.children.map((child) => {
        const slotNode = {
            kind: "empty-slot",
        };
        if (!child) {
            return slotNode;
        }
        if (child.kind === "empty-slot") {
            return slotNode;
        }
        return child;
    }),
    props: externalMetadata.props,
    id: crypto.randomUUID(),
});
export const createElement = (component, props, ...children) => {
    const internalMetadata = mapExternalMetadataToInternalMetadata({
        externalMetadata: {
            children: children,
            component,
            props,
        },
    });
    return internalMetadata;
};
const findParentViewNode = (id) => {
    const aux = (viewNode) => {
        if (viewNode.kind === "empty-slot") {
            return;
        }
        for (const node of viewNode.childNodes) {
            if (node.id === id) {
                return viewNode;
            }
            const res = aux(node);
            if (res) {
                return res;
            }
        }
    };
    if (currentTreeRef.viewTree?.root?.id === id) {
        return currentTreeRef.viewTree.root;
    }
    const result = aux(currentTreeRef.viewTree?.root);
    if (!result) {
        throw new Error("detached node or wrong id:" + id + "\n\n");
    }
    return result;
};
// const findParentRenderNode = (renderNode: ReactRenderTreeNode) => {
// 	if (!currentTreeRef.renderTree) {
// 		throw new Error("No render tree");
// 	}
// 	const aux = (viewNode: ReactRenderTreeNode) => {
// 		if (viewNode.kind === "empty-slot") {
// 			return null;
// 		}
// 		if (
// 			viewNode.childNodes.some(
// 				(n) =>
// 					n.kind === "real-element" &&
// 					renderNode.kind === "real-element" &&
// 					n.id === renderNode.id
// 			)
// 		) {
// 			return viewNode;
// 		}
// 		return viewNode.childNodes.find(aux);
// 	};
// 	const result = aux(currentTreeRef.renderTree.root);
// 	if (!result) {
// 		return null;
// 	}
// 	return result;
// };
export const findViewNodeOrThrow = (eq, tree) => {
    const aux = (viewNode) => {
        if (viewNode.kind === "empty-slot") {
            return;
        }
        for (const node of viewNode.childNodes) {
            if (eq(node)) {
                return node;
            }
            const res = aux(node);
            if (res) {
                return res;
            }
        }
    };
    if (eq(tree)) {
        return tree;
    }
    const result = aux(tree);
    if (!result) {
        throw new Error("detached node or wrong id:" + "\n\n");
    }
    return result;
};
const findRenderNode = (eq, tree) => {
    try {
        return findRenderNodeOrThrow(eq, tree);
    }
    catch {
        return null;
    }
};
export const findRenderNodeOrThrow = (eq, tree) => {
    const aux = (viewNode) => {
        if (viewNode.kind === "empty-slot") {
            return;
        }
        for (const node of viewNode.childNodes) {
            if (eq(node)) {
                return node;
            }
            const res = aux(node);
            if (res) {
                return res;
            }
        }
    };
    if (eq(tree)) {
        return tree;
    }
    const result = aux(tree);
    if (!result) {
        throw new Error("detached node or wrong id:" + "\n\n");
    }
    return result;
};
const reconcileRenderNodeChildNodes = ({ oldRenderTreeNodes, newRenderTreeNodes, }) => {
    const reconciledChildNodes = [];
    newRenderTreeNodes.forEach((newChildNode, index) => {
        const oldChildNode = oldRenderTreeNodes.at(index);
        if (!oldChildNode) {
            reconciledChildNodes.push(newChildNode);
            return;
        }
        // we want the newer node in both cases since we don't track empty slot equality
        if (oldChildNode.kind === "empty-slot" ||
            newChildNode.kind === "empty-slot") {
            reconciledChildNodes.push(newChildNode);
            return;
        }
        // lets test this later to see if it would of broke, i want to make sure it is doing something (with that left == left bug)
        if (!Utils.compareIndexPaths(oldChildNode.indexPath, newChildNode.indexPath) ||
            Utils.getComponentName(newChildNode.internalMetadata) !==
                Utils.getComponentName(oldChildNode.internalMetadata)) {
            reconciledChildNodes.push(newChildNode);
            return;
        }
        oldChildNode.internalMetadata = newChildNode.internalMetadata;
        oldChildNode.computedViewTreeNodeId = null;
        reconciledChildNodes.push(oldChildNode);
    });
    return reconciledChildNodes;
};
const generateRenderNodeChildNodes = ({ internalMetadata, parent, }) => {
    const accumulatedSiblings = [];
    const aux = ({ internalMetadata, indexPath, parent, }) => {
        if (!currentTreeRef.renderTree) {
            throw new Error("invariant error");
        }
        const existingNode = internalMetadata.kind === "empty-slot"
            ? null
            : findRenderNode((node) => {
                if (node.kind === "empty-slot") {
                    return false;
                }
                if (node.internalMetadata.kind === "empty-slot") {
                    return false;
                }
                return node.internalMetadata.id === internalMetadata.id;
            }, currentTreeRef.renderTree.root);
        if (existingNode) {
            return;
        }
        if (internalMetadata.kind === "empty-slot") {
            return {
                kind: 'empty-slot',
                parent: parent,
            };
        }
        const newNode = {
            indexPath,
            childNodes: [],
            computedViewTreeNodeId: null,
            hasRendered: false,
            hooks: [],
            id: crypto.randomUUID(),
            internalMetadata: internalMetadata,
            kind: "real-element",
            parent,
        };
        accumulatedSiblings.push(newNode);
        internalMetadata.children.map((child, index) => {
            aux({
                internalMetadata: child,
                indexPath: [...indexPath, index],
                parent: newNode,
            });
        });
    };
    aux({
        indexPath: [],
        internalMetadata,
        parent,
    });
    return accumulatedSiblings;
};
export const searchForContextStateUpwards = (viewNode, ctxId) => {
    if (viewNode.parent === null) {
        const defaultContext = currentTreeRef.defaultContextState.find((ctx) => ctx.contextId === ctxId);
        if (!defaultContext) {
            throw new Error("Invalid ctxId, not created by createContext");
        }
        return defaultContext.state;
    }
    if (viewNode.kind === "empty-slot") {
        return searchForContextStateUpwards(viewNode.parent, ctxId);
    }
    if (viewNode.metadata.kind === "empty-slot") {
        return searchForContextStateUpwards(viewNode.parent, ctxId);
    }
    if (viewNode.metadata.provider?.contextId === ctxId) {
        return viewNode.metadata.provider.state;
    }
    return searchForContextStateUpwards(viewNode.parent, ctxId);
};
/**
 *
 * Outputs a new view tree based on the provided render node
 *
 */
const generateViewTree = ({ renderNode, parentViewNode, }) => {
    if (renderNode.kind === "empty-slot") {
        return {
            kind: "empty-slot",
            id: crypto.randomUUID(),
            parent: parentViewNode,
        };
    }
    const newViewTree = generateViewTreeHelper({
        renderNode: renderNode,
        startingFromRenderNodeId: renderNode.id,
        parentViewNode,
        // isEntrypoint: true,
    });
    currentTreeRef.tempViewTreeNodes = [];
    return newViewTree;
};
const generateViewTreeHelper = ({ renderNode, startingFromRenderNodeId, parentViewNode, }) => {
    if (!currentTreeRef.renderTree) {
        throw new Error("Cannot render component outside of react tree");
    }
    if (renderNode.kind === "empty-slot" ||
        renderNode.internalMetadata.kind === 'empty-slot') {
        const newId = crypto.randomUUID();
        return {
            kind: "empty-slot",
            id: newId,
            parent: parentViewNode,
        };
    }
    // if (renderNode.internalMetadata.kind === "empty-slot") {
    // 	const newId = crypto.randomUUID();
    // 	renderNode.computedViewTreeNodeId = newId;
    // 	const node: ReactViewTreeNodeRealElement = {
    // 		id: newId,
    // 		metadata: renderNode.internalMetadata,
    // 		childNodes: [],
    // 		indexPath: renderNode.indexPath,
    // 		kind: "real-element",
    // 		parent: parentViewNode,
    // 	};
    // 	node.childNodes.push({
    // 		kind: "empty-slot",
    // 		id: crypto.randomUUID(),
    // 		parent: node,
    // 	});
    // 	return node;
    // }
    const newNode = {
        id: crypto.randomUUID(),
        metadata: renderNode.internalMetadata,
        childNodes: [],
        indexPath: renderNode.indexPath,
        kind: "real-element",
        parent: parentViewNode,
    };
    currentTreeRef.tempViewTreeNodes.push(newNode);
    renderNode.computedViewTreeNodeId = newNode.id;
    switch (renderNode.internalMetadata.component.kind) {
        case "function": {
            const childrenSpreadProps = renderNode.internalMetadata.children.length > 0
                ? {
                    children: renderNode.internalMetadata.children,
                }
                : false;
            currentTreeRef.renderTree.currentLocalCurrentHookOrder = 0;
            currentTreeRef.renderTree.currentlyRendering = renderNode;
            const previousRenderEffects = renderNode.hooks
                .filter((hook) => hook.kind === "effect")
                .map((hook) => hook.deps);
            const hasRendered = renderNode.hasRendered;
            console.log("Rendering:", renderNode.internalMetadata.component.name);
            const outputInternalMetadata = renderNode.internalMetadata.component.function({
                ...renderNode.internalMetadata.props,
                ...childrenSpreadProps,
            });
            const currentRenderEffects = renderNode.hooks.filter((hook) => hook.kind === "effect");
            currentRenderEffects.forEach((effect, index) => {
                const didDepsChange = Utils.run(() => {
                    if (!hasRendered) {
                        return true;
                    }
                    const currentDeps = effect.deps;
                    const previousDeps = previousRenderEffects[index];
                    if (currentDeps.length !== previousDeps.length) {
                        return true;
                    }
                    return !currentDeps.every((dep, index) => {
                        const previousDep = previousDeps[index];
                        return dep === previousDep;
                    });
                });
                if (didDepsChange) {
                    effect.cleanup?.();
                    const cleanup = effect.cb();
                    if (typeof cleanup === "function") {
                        effect.cleanup = () => cleanup(); // typescript stuff
                    }
                }
            });
            const generatedRenderChildNodes = generateRenderNodeChildNodes({
                internalMetadata: outputInternalMetadata,
                parent: renderNode,
            });
            const reconciledRenderChildNodes = reconcileRenderNodeChildNodes({
                newRenderTreeNodes: generatedRenderChildNodes,
                oldRenderTreeNodes: renderNode.childNodes,
            });
            const nextNodeToProcess = reconciledRenderChildNodes.find((node) => {
                if (node.kind === "empty-slot") {
                    return false;
                }
                return node.indexPath.length === 0;
            }) ?? { kind: "empty-slot", parent: renderNode };
            const removedRenderNodes = renderNode.childNodes.filter((node) => !generatedRenderChildNodes.some((newNode) => newNode.kind !== "empty-slot" &&
                node.kind !== "empty-slot" &&
                Utils.compareIndexPaths(newNode.indexPath, node.indexPath)));
            removedRenderNodes.forEach((node) => {
                if (node.kind === "empty-slot") {
                    return;
                }
                node.hooks.forEach((hook) => {
                    if (hook.kind !== "effect") {
                        return;
                    }
                    if (hook.cleanup) {
                        hook.cleanup();
                    }
                });
            });
            renderNode.childNodes = reconciledRenderChildNodes;
            renderNode.hasRendered = true;
            const viewNode = generateViewTreeHelper({
                renderNode: nextNodeToProcess,
                startingFromRenderNodeId: renderNode.id,
                parentViewNode: newNode,
            });
            if (!viewNode) {
                break;
            }
            newNode.childNodes.push(viewNode);
            break;
        }
        case "tag": {
            const fullyComputedChildren = renderNode.internalMetadata.children.map((child) => {
                if (child.kind === "empty-slot") {
                    return {
                        renderNode: { kind: "empty-slot", parent: renderNode },
                        viewNode: {
                            kind: "empty-slot",
                            id: crypto.randomUUID(),
                            parent: newNode,
                        },
                    };
                }
                if (!currentTreeRef.renderTree?.root) {
                    throw new Error("determine the invariant error type later");
                }
                const existingRenderTreeNode = findRenderNodeOrThrow((node) => {
                    if (node.kind === "empty-slot") {
                        return false;
                    }
                    if (node.internalMetadata.kind === "empty-slot") {
                        return false;
                    }
                    return node.internalMetadata.id === child.id;
                }, currentTreeRef.renderTree.root);
                const parentRenderTreeNode = findRenderNodeOrThrow((node) => {
                    if (node.kind === "empty-slot") {
                        return false;
                    }
                    if (node.internalMetadata.kind === "empty-slot") {
                        return false;
                    }
                    return node.id === startingFromRenderNodeId;
                }, currentTreeRef.renderTree.root);
                if (parentRenderTreeNode.kind === "empty-slot" ||
                    parentRenderTreeNode.internalMetadata.kind === "empty-slot") {
                    throw new Error("Invariant Error: Parent cannot be an empty slot");
                }
                const reRenderChild = () => {
                    const viewNode = generateViewTreeHelper({
                        renderNode: existingRenderTreeNode,
                        startingFromRenderNodeId: startingFromRenderNodeId,
                        parentViewNode: newNode,
                    });
                    return { viewNode, renderNode: existingRenderTreeNode };
                };
                if (!currentTreeRef.viewTree) {
                    return reRenderChild();
                }
                if (existingRenderTreeNode.kind === "empty-slot") {
                    return {
                        viewNode: {
                            kind: "empty-slot",
                            id: crypto.randomUUID(),
                            parent: newNode,
                        },
                        renderNode: existingRenderTreeNode,
                    };
                }
                const computedNode = currentTreeRef.viewTree.root &&
                    existingRenderTreeNode.computedViewTreeNodeId
                    ? findViewNodeOrThrow((node) => node.id === existingRenderTreeNode.computedViewTreeNodeId, currentTreeRef.viewTree.root)
                    : null;
                if (!computedNode) {
                    return reRenderChild();
                }
                const isChild = Utils.isChildOf({
                    potentialChildId: child.id,
                    potentialParentId: parentRenderTreeNode.internalMetadata.id,
                });
                const shouldReRender = existingRenderTreeNode.internalMetadata.kind === "empty-slot"
                    ? false
                    : isChild;
                if (!shouldReRender) {
                    return {
                        viewNode: computedNode,
                        renderNode: existingRenderTreeNode,
                    };
                }
                return reRenderChild();
            });
            newNode.childNodes = fullyComputedChildren
                .map(({ viewNode }) => viewNode)
                .filter((viewNode) => viewNode !== null);
            break;
        }
    }
    return newNode;
};
export const currentTreeRef = {
    viewTree: null,
    renderTree: null,
    defaultContextState: [],
    tempViewTreeNodes: [],
};
export const buildReactTrees = (rootComponentInternalMetadata) => {
    const rootRenderTreeNode = rootComponentInternalMetadata.kind === "empty-slot"
        ? {
            kind: "empty-slot",
            parent: null,
        }
        : {
            kind: "real-element",
            childNodes: [],
            computedViewTreeNodeId: null,
            hasRendered: false,
            hooks: [],
            id: crypto.randomUUID(),
            indexPath: [],
            internalMetadata: {
                component: {
                    kind: "function",
                    function: () => rootComponentInternalMetadata,
                    name: "root",
                },
                children: [],
                id: crypto.randomUUID(),
                kind: "real-element",
                props: null,
                provider: null,
            },
            parent: null,
        };
    currentTreeRef.renderTree = {
        root: rootRenderTreeNode,
        currentLastRenderChildNodes: [],
        currentLocalCurrentHookOrder: 0,
        currentlyRendering: null,
    };
    console.log("\n\nRENDER START----------------------------------------------");
    const output = generateViewTree({
        renderNode: rootRenderTreeNode,
        parentViewNode: null,
    });
    console.log("RENDER END----------------------------------------------\n\n");
    const reactViewTree = {
        root: output,
    };
    currentTreeRef.viewTree = reactViewTree;
    currentTreeRef.renderTree.currentlyRendering = null;
    return {
        reactRenderTree: currentTreeRef.renderTree,
        reactViewTree: currentTreeRef.viewTree,
    };
};
export const triggerReRender = ({ capturedCurrentlyRenderingRenderNode, }) => {
    if (!capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId) {
        throw new Error("Invariant: set state trying to re-render unmounted component");
    }
    if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
        throw new Error("Invariant error, no view tree or no render tree");
    }
    const parentNode = findParentViewNode(capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId);
    if (parentNode.kind === "empty-slot") {
        throw new Error("Invariant Error: An empty slot cannot have any children");
    }
    const clonedParentNode = Utils.deepCloneTree(parentNode);
    console.log("\n\nRENDER START----------------------------------------------");
    const previousViewTree = clonedParentNode?.childNodes.find((node) => node.id === capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId) ?? currentTreeRef.viewTree.root;
    const reGeneratedViewTree = generateViewTree({
        renderNode: capturedCurrentlyRenderingRenderNode,
        parentViewNode: parentNode,
    });
    console.log("RENDER END----------------------------------------------\n\n");
    // its a detached node and because of that we set it as the root
    const index = parentNode.childNodes.findIndex((node) => capturedCurrentlyRenderingRenderNode.internalMetadata.kind ===
        "empty-slot" ||
        node.kind === "empty-slot" ||
        node.metadata.kind === "empty-slot"
        ? false
        : capturedCurrentlyRenderingRenderNode.internalMetadata.id ===
            node.metadata.id // changes this might be dangerous, but no idea why we used the key before
    );
    // this will always be in the parent nodes children (or is root)
    // because we re-rendered at capturedCurrentlyRenderingRenderNode,
    // so the previous parent must contain it
    // we can now update the view tree by replacing by component
    // equality (lets go keys)
    if (!parentNode || index === undefined || index === -1) {
        if (currentTreeRef.renderTree.root.kind === "empty-slot" &&
            reGeneratedViewTree) {
            throw new Error("Invariant Error: This implies an empty slot generated a not null view tree");
        }
        // should not do an upper mutate here...
        currentTreeRef.viewTree.root = reGeneratedViewTree;
        if (currentTreeRef.renderTree.root.kind === "real-element") {
            currentTreeRef.renderTree.root.computedViewTreeNodeId =
                reGeneratedViewTree?.id ?? null;
        }
    }
    else {
        parentNode.childNodes[index] = reGeneratedViewTree;
    }
    updateDom({
        newViewTree: reGeneratedViewTree,
        oldViewTree: previousViewTree,
        insertInfo: {
            kind: "child",
            previousViewTreeParent: clonedParentNode, // the root has no parent, so this is the only valid case, but may cause weird bugs if something was calculated weirdly
        },
    });
};
export const render = (rootElement, domEl) => {
    const { reactViewTree } = buildReactTrees(rootElement);
    updateDom({
        oldViewTree: null,
        newViewTree: reactViewTree.root,
        insertInfo: {
            kind: "root",
            root: domEl,
        },
    });
};
